import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { prisma } from "../database/prisma";
import { getAppSettings } from "../database/settings";
import { getFFmpegPath } from "./ffmpeg-bin";
import { synthesizeSpeech } from "./tts";
import { generateSceneImage, generateThumbnail } from "./visuals";

export interface RenderProgressCallback {
  (percentage: number, statusMessage: string): void;
}

/**
 * Runs an FFmpeg command via spawn and returns a Promise.
 */
function runFFmpeg(args: string[]): Promise<void> {
  const ffmpegPath = getFFmpegPath();

  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { windowsHide: true });
    let stderr = "";

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-500)}`));
      }
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}

/**
 * Renders an entire video project end-to-end.
 */
export async function renderVideoProject(
  projectId: string,
  onProgress?: RenderProgressCallback
): Promise<{
  renderId: string;
  outputPath: string;
  thumbnailPath: string;
  durationSec: number;
  fileSizeBytes: number;
}> {
  const settings = await getAppSettings();
  const project = await prisma.videoProject.findUnique({
    where: { id: projectId },
    include: {
      script: true,
      scenes: {
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!project) {
    throw new Error(`Project with ID ${projectId} not found.`);
  }

  if (!project.scenes || project.scenes.length === 0) {
    throw new Error(`Project ${projectId} has no scenes to render.`);
  }

  // Setup directories
  const baseOutputDir = path.resolve(process.cwd(), settings.outputDir || "./output");
  const projectDir = path.join(baseOutputDir, "projects", projectId);
  const segmentsDir = path.join(projectDir, "segments");
  const tempDir = path.join(projectDir, "temp");

  fs.mkdirSync(projectDir, { recursive: true });
  fs.mkdirSync(segmentsDir, { recursive: true });
  fs.mkdirSync(tempDir, { recursive: true });

  // Create VideoRender entry in database
  const isShorts = project.format === "SHORTS";
  const resolution = isShorts ? "1080x1920" : "1920x1080";
  const aspectRatio = isShorts ? "9:16" : "16:9";

  const renderRecord = await prisma.videoRender.create({
    data: {
      videoProjectId: projectId,
      resolution,
      aspectRatio,
      status: "RENDERING",
      progress: 5,
    },
  });

  onProgress?.(5, "Initializing video assets and workspace...");

  const segmentFiles: string[] = [];
  let totalDuration = 0;
  const totalScenes = project.scenes.length;

  for (let i = 0; i < totalScenes; i++) {
    const scene = project.scenes[i];
    const progressPercent = Math.round(5 + ((i + 1) / totalScenes) * 60);
    onProgress?.(progressPercent, `Generating audio and visuals for scene ${i + 1} of ${totalScenes}...`);

    // 1. Audio synthesis
    let audioPath = scene.audioPath;
    let sceneDuration = scene.duration;

    if (!audioPath || !fs.existsSync(audioPath)) {
      audioPath = path.join(tempDir, `scene_${i}.mp3`);
      const ttsResult = await synthesizeSpeech({
        text: scene.narration,
        outputPath: audioPath,
        language: project.language as "English" | "Tamil",
      });
      sceneDuration = Math.max(3.0, ttsResult.durationSec);

      await prisma.scene.update({
        where: { id: scene.id },
        data: {
          audioPath,
          duration: sceneDuration,
        },
      });
    }

    // 2. Visual generation
    let imagePath = scene.imagePath;
    if (!imagePath || !fs.existsSync(imagePath)) {
      imagePath = path.join(tempDir, `scene_${i}.png`);
      await generateSceneImage({
        outputPath: imagePath,
        orderIndex: scene.orderIndex,
        totalScenes,
        narration: scene.narration,
        visualPrompt: scene.visualPrompt || undefined,
        captionText: scene.captionText || undefined,
        format: project.format as "SHORTS" | "LONG_FORM",
      });

      await prisma.scene.update({
        where: { id: scene.id },
        data: { imagePath },
      });
    }

    // 3. Render scene segment
    const segmentPath = path.join(segmentsDir, `segment_${i}.mp4`);
    // Create mp4 from static image and audio
    await runFFmpeg([
      "-y",
      "-loop",
      "1",
      "-i",
      imagePath,
      "-i",
      audioPath,
      "-c:v",
      "libx264",
      "-tune",
      "stillimage",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-pix_fmt",
      "yuv420p",
      "-shortest",
      "-t",
      sceneDuration.toFixed(2),
      segmentPath,
    ]);

    segmentFiles.push(segmentPath);
    totalDuration += sceneDuration;
  }

  onProgress?.(70, "Concatenating scenes into final video...");

  // Write concat list file
  const concatListPath = path.join(tempDir, "concat_list.txt");
  const concatContent = segmentFiles
    .map((file) => `file '${file.replace(/\\/g, "/")}'`)
    .join("\n");
  fs.writeFileSync(concatListPath, concatContent, "utf-8");

  const finalVideoPath = path.join(projectDir, `${projectId}_final.mp4`);

  await runFFmpeg([
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    concatListPath,
    "-c",
    "copy",
    finalVideoPath,
  ]);

  onProgress?.(85, "Designing high-CTR thumbnail...");

  // 4. Generate thumbnail
  const thumbnailPath = path.join(projectDir, `${projectId}_thumbnail.png`);
  await generateThumbnail({
    outputPath: thumbnailPath,
    title: project.title,
    hook: project.script?.hook || undefined,
    badge: project.format === "SHORTS" ? "SHORTS" : "MUST WATCH",
    format: project.format as "SHORTS" | "LONG_FORM",
  });

  onProgress?.(95, "Validating output file metrics...");

  const stats = fs.statSync(finalVideoPath);
  const fileSizeBytes = stats.size;

  // 5. Update database records
  await prisma.videoRender.update({
    where: { id: renderRecord.id },
    data: {
      outputPath: finalVideoPath,
      thumbnailPath,
      durationSec: totalDuration,
      fileSizeBytes,
      status: "COMPLETED",
      progress: 100,
    },
  });

  await prisma.videoProject.update({
    where: { id: projectId },
    data: {
      status: "RENDERED",
    },
  });

  onProgress?.(100, "Video rendering completed successfully!");

  return {
    renderId: renderRecord.id,
    outputPath: finalVideoPath,
    thumbnailPath,
    durationSec: totalDuration,
    fileSizeBytes,
  };
}
