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
        language: project.language as "English" | "Tamil",
        style: project.language === "Tamil" ? "cartoon" : "gradient",
      });

      await prisma.scene.update({
        where: { id: scene.id },
        data: { imagePath },
      });
    }

    // 3. Render scene segment with camera motion
    const segmentPath = path.join(segmentsDir, `segment_${i}.mp4`);
    const fps = 25;
    const frames = Math.max(25, Math.round(sceneDuration * fps));
    const width = isShorts ? 1080 : 1920;
    const height = isShorts ? 1920 : 1080;

    try {
      // Animated camera motion (gentle zoom in) for engaging cartoon animation
      await runFFmpeg([
        "-y",
        "-loop",
        "1",
        "-i",
        imagePath,
        "-i",
        audioPath,
        "-vf",
        `zoompan=z='min(zoom+0.0008,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${width}x${height}:fps=${fps}`,
        "-c:v",
        "libx264",
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
    } catch {
      // Fallback to static stillimage if zoompan is unsupported
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
    }

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
    badge: project.language === "Tamil" ? "🌟 HAPPY KUTTU SONG 🌟" : project.format === "SHORTS" ? "SHORTS" : "MUST WATCH",
    format: project.format as "SHORTS" | "LONG_FORM",
    language: project.language as "English" | "Tamil",
    style: project.language === "Tamil" ? "cartoon" : "gradient",
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

/**
 * Extracts a 30-second vertical (9:16) Short from a master video with FFmpeg.
 */
export async function sliceShortClipFromVideo(params: {
  sourceVideoPath: string;
  outputShortPath: string;
  startSec?: number;
  durationSec?: number;
}): Promise<string> {
  const start = params.startSec || 0;
  const duration = params.durationSec || 30;

  const dir = path.dirname(params.outputShortPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Scale and center-crop from 16:9 to vertical 1080x1920 (9:16) Shorts format
  await runFFmpeg([
    "-y",
    "-ss",
    start.toFixed(2),
    "-i",
    params.sourceVideoPath,
    "-t",
    duration.toFixed(2),
    "-vf",
    "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",
    "-c:v",
    "libx264",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-pix_fmt",
    "yuv420p",
    params.outputShortPath,
  ]);

  return params.outputShortPath;
}

