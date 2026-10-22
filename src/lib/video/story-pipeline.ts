import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { prisma } from "../database/prisma";
import { getAppSettings } from "../database/settings";
import { generateGeminiOmniStoryScript } from "../gemini/client";
import { getFFmpegPath } from "./ffmpeg-bin";
import { synthesizeSpeech } from "./tts";
import { generateThumbnail } from "./visuals";
import { generateVideoFromPrompt } from "./ai-video-generator";
import { sliceShortClipFromVideo } from "./renderer";
import { uploadVideoToYouTube, getAuthenticatedYouTubeClient } from "../youtube/client";

export interface StoryPipelineParams {
  prompt: string;
  characters?: string[];
  sceneCount?: number; // 8 to 10
  autoPublish?: boolean;
  publishFirstPartNow?: boolean;
  privacyStatus?: "public" | "unlisted" | "private";
  onProgress?: (progress: number, stepName: string, meta?: any) => void;
}

export interface StoryShortItem {
  partNumber: number;
  title: string;
  outputPath: string;
  thumbnailPath: string;
  durationSec: number;
  scheduledTime: Date;
  slot: "MORNING" | "EVENING";
  status: "PUBLISHED" | "SCHEDULED" | "QUEUED";
  youtubeUrl?: string;
  youtubeVideoId?: string;
}

export interface StoryPipelineResult {
  success: boolean;
  projectId: string;
  projectTitle: string;
  masterVideo: {
    outputPath: string;
    thumbnailPath: string;
    durationSec: number;
    youtubeUrl?: string;
    youtubeVideoId?: string;
  };
  shorts: StoryShortItem[];
  error?: string;
}

function runFFmpeg(args: string[]): Promise<void> {
  const ffmpegPath = getFFmpegPath();
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { windowsHide: true });
    let stderr = "";
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-400)}`));
    });
    child.on("error", (err) => reject(err));
  });
}

/**
 * Calculates repeating Morning (10:00 AM IST) and Evening (5:00 PM IST) slots
 * sequentially for Parts 1 through 10.
 */
function computePublishSlots(totalParts: number): Array<{ date: Date; slot: "MORNING" | "EVENING" }> {
  const results: Array<{ date: Date; slot: "MORNING" | "EVENING" }> = [];
  const now = new Date();

  // Convert to IST offset (+5:30)
  const istOffsetMs = 5.5 * 3600000;
  let cursor = new Date(now.getTime() + istOffsetMs);

  for (let i = 0; i < totalParts; i++) {
    const isMorning = i % 2 === 0;
    const dayOffset = Math.floor(i / 2);

    const slotDateIST = new Date(cursor);
    slotDateIST.setDate(slotDateIST.getDate() + dayOffset);

    if (isMorning) {
      slotDateIST.setHours(10, 0, 0, 0); // 10:00 AM IST
    } else {
      slotDateIST.setHours(17, 0, 0, 0); // 5:00 PM IST
    }

    // Convert back to UTC for standard storage
    const utcDate = new Date(slotDateIST.getTime() - istOffsetMs);
    results.push({
      date: utcDate,
      slot: isMorning ? "MORNING" : "EVENING",
    });
  }

  return results;
}

/**
 * Generates an 8 to 10 scene continuous 5 to 6 min Master Animated Comedy Video,
 * slices each scene into a 30-second Short, and schedules repeating Morning & Evening posts.
 */
export async function generateOmniStoryPipeline(
  params: StoryPipelineParams
): Promise<StoryPipelineResult> {
  const settings = await getAppSettings();
  const sceneCount = Math.max(8, Math.min(10, params.sceneCount || 8));
  const autoPublish = params.autoPublish !== undefined ? params.autoPublish : true;
  const publishFirstPartNow = params.publishFirstPartNow !== undefined ? params.publishFirstPartNow : true;
  const privacyStatus = params.privacyStatus || (settings.defaultVisibility as "public" | "unlisted" | "private") || "public";

  params.onProgress?.(5, "🎬 Initializing Gemini Omni Screenplay Engine for 5-6 min story...");

  try {
    // -------------------------------------------------------------------------
    // STEP 1: GEMINI OMNI SCREENPLAY (8 to 10 Scenes, 5-6 Minutes Total)
    // -------------------------------------------------------------------------
    console.log(`🤖 [Story Pipeline] Generating ${sceneCount}-scene screenplay for: "${params.prompt}"`);
    params.onProgress?.(10, `Gemini Omni writing ${sceneCount} hilarious comedy scenes for characters...`);

    const scriptOutput = await generateGeminiOmniStoryScript({
      prompt: params.prompt,
      characters: params.characters,
      sceneCount,
      targetDurationSec: 330, // 5.5 min average
      language: "Tamil",
    });

    console.log(`✅ [Story Pipeline] Screenplay Generated: "${scriptOutput.title}" (${scriptOutput.scenes.length} scenes)`);
    params.onProgress?.(20, `Screenplay ready! "${scriptOutput.title}" - Setting up production workspace...`);

    // -------------------------------------------------------------------------
    // STEP 2: CREATE PROJECT IN DATABASE
    // -------------------------------------------------------------------------
    const project = await prisma.videoProject.create({
      data: {
        title: scriptOutput.title,
        description: scriptOutput.description,
        format: "LONG_FORM", // Master video is 16:9 full story
        language: "Tamil",
        status: "RENDERING",
        tags: JSON.stringify(scriptOutput.hashtags),
      },
    });

    await prisma.script.create({
      data: {
        videoProjectId: project.id,
        title: scriptOutput.title,
        hook: scriptOutput.hook,
        body: scriptOutput.synopsis,
        callToAction: "Subscribe to Happy Kuttu Song for daily morning & evening comedy shorts!",
        description: scriptOutput.description,
        hashtags: JSON.stringify(scriptOutput.hashtags),
        thumbnailIdeas: JSON.stringify(scriptOutput.thumbnailIdeas),
        targetDurationSec: 330,
        isApproved: true,
      },
    });

    // Setup working directories
    const baseOutputDir = path.resolve(process.cwd(), settings.outputDir || "./output");
    const projectDir = path.join(baseOutputDir, "projects", project.id);
    const scenesDir = path.join(projectDir, "scenes");
    const shortsDir = path.join(projectDir, "shorts");
    const tempDir = path.join(projectDir, "temp");

    fs.mkdirSync(projectDir, { recursive: true });
    fs.mkdirSync(scenesDir, { recursive: true });
    fs.mkdirSync(shortsDir, { recursive: true });
    fs.mkdirSync(tempDir, { recursive: true });

    // -------------------------------------------------------------------------
    // STEP 3: GENERATE ALL 8 TO 10 ANIMATED SCENES (NO STATIC IMAGES)
    // -------------------------------------------------------------------------
    const segmentPaths: string[] = [];
    let totalDuration = 0;
    const totalScenes = scriptOutput.scenes.length;

    for (let i = 0; i < totalScenes; i++) {
      const sceneData = scriptOutput.scenes[i];
      const stepPct = Math.round(25 + (i / totalScenes) * 45); // 25% to 70%
      params.onProgress?.(
        stepPct,
        `[Scene ${i + 1}/${totalScenes}] Animating 3D character kinetics & voiceover...`
      );

      // 1. Audio synthesis via Edge-TTS
      const audioPath = path.join(tempDir, `scene_${i}_audio.mp3`);
      const ttsRes = await synthesizeSpeech({
        text: sceneData.narration,
        outputPath: audioPath,
        language: "Tamil",
      });

      const sceneDuration = Math.max(30.0, ttsRes.durationSec || sceneData.duration || 35.0);

      // 2. 100% Free Autonomous 3D Kinetic Animation Video Synthesizer
      const rawClipPath = path.join(tempDir, `scene_${i}_anim.mp4`);
      await generateVideoFromPrompt({
        prompt: sceneData.visualPrompt || sceneData.narration,
        outputPath: rawClipPath,
        durationSec: sceneDuration,
        format: "LONG_FORM",
        captionText: sceneData.captionText,
        characterId: sceneData.characters?.[0] || undefined,
      });

      // 3. Merge audio + video for scene
      const sceneSegmentPath = path.join(scenesDir, `scene_${i}.mp4`);
      await runFFmpeg([
        "-y",
        "-stream_loop",
        "-1",
        "-i",
        rawClipPath,
        "-i",
        audioPath,
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
        sceneSegmentPath,
      ]);

      segmentPaths.push(sceneSegmentPath);
      totalDuration += sceneDuration;

      // Save scene in DB
      await prisma.scene.create({
        data: {
          videoProjectId: project.id,
          orderIndex: i,
          narration: sceneData.narration,
          visualPrompt: sceneData.visualPrompt,
          captionText: sceneData.captionText,
          duration: sceneDuration,
          audioPath,
          videoClipPath: sceneSegmentPath,
          status: "READY",
        },
      });

      console.log(`🎬 [Story Pipeline] Rendered Scene ${i + 1}/${totalScenes} (${sceneDuration.toFixed(1)}s): ${sceneData.sceneTitle}`);
    }

    // -------------------------------------------------------------------------
    // STEP 4: MERGE ALL SCENES INTO 5-6 MIN MASTER EPISODE
    // -------------------------------------------------------------------------
    params.onProgress?.(72, "Joining all scenes into continuous 5 to 6 minute master story video...");
    const masterVideoPath = path.join(projectDir, `${project.id}_5min_master_episode.mp4`);

    const concatListPath = path.join(tempDir, "master_concat.txt");
    const concatText = segmentPaths.map((f) => `file '${f.replace(/\\/g, "/")}'`).join("\n");
    fs.writeFileSync(concatListPath, concatText, "utf-8");

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
      masterVideoPath,
    ]);

    // Master Episode Thumbnail
    const masterThumbnailPath = path.join(projectDir, `${project.id}_master_thumbnail.png`);
    await generateThumbnail({
      outputPath: masterThumbnailPath,
      title: scriptOutput.title,
      hook: scriptOutput.hook,
      badge: "⭐ 5 MIN MASTER COMEDY ⭐",
      format: "LONG_FORM",
      language: "Tamil",
      style: "cartoon",
    });

    // Record Render
    const masterStats = fs.statSync(masterVideoPath);
    await prisma.videoRender.create({
      data: {
        videoProjectId: project.id,
        resolution: "1920x1080",
        aspectRatio: "16:9",
        durationSec: totalDuration,
        fileSizeBytes: masterStats.size,
        outputPath: masterVideoPath,
        thumbnailPath: masterThumbnailPath,
        status: "COMPLETED",
        progress: 100,
      },
    });

    console.log(`🎉 [Story Pipeline] 5-6 Min Master Episode Joined: ${masterVideoPath} (${totalDuration.toFixed(1)}s)`);

    // -------------------------------------------------------------------------
    // STEP 5: SLICE EACH SCENE INTO 30-SEC VERTICAL SHORTS (MORNING & EVENING)
    // -------------------------------------------------------------------------
    params.onProgress?.(80, "Slicing scenes into 30-second vertical Shorts for morning & evening slots...");
    const publishSlots = computePublishSlots(totalScenes);
    const shortsItems: StoryShortItem[] = [];

    for (let i = 0; i < totalScenes; i++) {
      const sceneSeg = segmentPaths[i];
      const sceneData = scriptOutput.scenes[i];
      const slotInfo = publishSlots[i];
      const partNumber = i + 1;

      const shortPath = path.join(shortsDir, `part_${partNumber}_30s_short.mp4`);
      const shortThumbPath = path.join(shortsDir, `part_${partNumber}_thumb.png`);

      // Slice vertical 9:16 Short (first 30s of scene)
      await sliceShortClipFromVideo({
        sourceVideoPath: sceneSeg,
        outputShortPath: shortPath,
        startSec: 0,
        durationSec: 30,
      });

      // Generate Shorts Thumbnail
      await generateThumbnail({
        outputPath: shortThumbPath,
        title: `Part ${partNumber}: ${sceneData.shortsHook || sceneData.captionText}`,
        hook: `Episode ${partNumber} of ${totalScenes}`,
        badge: slotInfo.slot === "MORNING" ? "☀️ MORNING SHORT" : "🌙 EVENING SHORT",
        format: "SHORTS",
        language: "Tamil",
        style: "cartoon",
      });

      const shortTitle = `${scriptOutput.title} — Part ${partNumber} | ${sceneData.shortsHook || sceneData.sceneTitle} #Shorts`;
      const shortDesc = `${sceneData.shortsHook}\n\n${sceneData.narration}\n\nPart ${partNumber} of our 5-Minute Comedy Masterpiece!\n\n🔔 Subscribe to Happy Kuttu Song for daily Morning & Evening Tamil cartoon shorts!\n\n#HappyKuttuSong #TamilShorts #TamilComedy #Shorts`;

      // Create PublishingJob record for this episodic Short
      const pubJob = await prisma.publishingJob.create({
        data: {
          videoProjectId: project.id,
          title: shortTitle,
          description: shortDesc,
          tags: JSON.stringify(scriptOutput.hashtags),
          privacyStatus,
          scheduledPublishTime: slotInfo.date,
          madeForKids: false,
          status: "SCHEDULED",
        },
      });

      shortsItems.push({
        partNumber,
        title: shortTitle,
        outputPath: shortPath,
        thumbnailPath: shortThumbPath,
        durationSec: 30,
        scheduledTime: slotInfo.date,
        slot: slotInfo.slot,
        status: "SCHEDULED",
      });
    }

    console.log(`✅ [Story Pipeline] Successfully sliced and queued ${shortsItems.length} episodic Shorts!`);

    // -------------------------------------------------------------------------
    // STEP 6: PUBLISH PART 1 IMMEDIATELY IF REQUESTED
    // -------------------------------------------------------------------------
    let channel = await prisma.youTubeChannel.findFirst({ where: { isConnected: true } });
    if (!channel && process.env.YOUTUBE_REFRESH_TOKEN) {
      try {
        const auth = await getAuthenticatedYouTubeClient();
        channel = auth.channel;
      } catch (authErr) {
        console.warn("Could not auto-auth YouTube channel:", authErr);
      }
    }

    let masterYouTubeUrl: string | undefined;
    let masterYouTubeVideoId: string | undefined;

    if (autoPublish && channel) {
      try {
        params.onProgress?.(91, `Publishing 5-6 Min Master Comedy Episode to "${channel.title}"...`);
        console.log(`🚀 [Story Pipeline] Publishing 5-6 Min Master Episode to channel "${channel.title}"...`);

        const masterUpload = await uploadVideoToYouTube({
          videoFilePath: masterVideoPath,
          thumbnailFilePath: masterThumbnailPath,
          title: scriptOutput.title,
          description: `${scriptOutput.title}\n\n${scriptOutput.synopsis || ""}\n\n${scriptOutput.description || ""}\n\n#HappyKuttuSong #TamilComedy #TamilCartoon`,
          tags: scriptOutput.hashtags.map((t) => t.replace("#", "")),
          privacyStatus,
          madeForKids: false,
          language: "ta",
        });

        masterYouTubeUrl = (masterUpload as any).videoUrl || (masterUpload as any).youtubeUrl;
        masterYouTubeVideoId = (masterUpload as any).videoId || (masterUpload as any).youtubeVideoId;
        console.log(`🎉 [Story Pipeline] Master Episode Published! URL: ${masterYouTubeUrl}`);
      } catch (masterErr: any) {
        console.warn("Notice: Master video saved locally:", masterErr.message);
      }

      if (publishFirstPartNow && shortsItems.length > 0) {
        try {
          const part1 = shortsItems[0];
          params.onProgress?.(95, `Publishing Part 1 Short to "${channel.title}"...`);
          console.log(`🚀 [Story Pipeline] Publishing Part 1 Short immediately to channel "${channel.title}"...`);

          const uploadRes = await uploadVideoToYouTube({
            videoFilePath: part1.outputPath,
            thumbnailFilePath: part1.thumbnailPath,
            title: part1.title,
            description: `${part1.title}\n\nPart 1 of our continuous 5-minute story!\n\n#HappyKuttuSong #TamilShorts #Comedy #Shorts`,
            tags: scriptOutput.hashtags.map((t) => t.replace("#", "")),
            privacyStatus,
            madeForKids: false,
            language: "ta",
          });

          const vidUrl = (uploadRes as any).videoUrl || (uploadRes as any).youtubeUrl;
          const vidId = (uploadRes as any).videoId || (uploadRes as any).youtubeVideoId;

          part1.status = "PUBLISHED";
          part1.youtubeUrl = vidUrl;
          part1.youtubeVideoId = vidId;

          console.log(`🎉 [Story Pipeline] Part 1 Short Published Successfully! URL: ${vidUrl}`);
        } catch (uploadErr: any) {
          console.warn("Notice: Part 1 upload saved locally:", uploadErr.message);
        }
      }
    }

    params.onProgress?.(100, `Complete! 5-6 min Master Story and ${shortsItems.length} Shorts queued!`, {
      masterVideoPath,
      masterYouTubeUrl,
      shorts: shortsItems,
    });

    await prisma.videoProject.update({
      where: { id: project.id },
      data: { status: "RENDERED" },
    });

    return {
      success: true,
      projectId: project.id,
      projectTitle: scriptOutput.title,
      masterVideo: {
        outputPath: masterVideoPath,
        thumbnailPath: masterThumbnailPath,
        durationSec: totalDuration,
        youtubeUrl: masterYouTubeUrl,
        youtubeVideoId: masterYouTubeVideoId,
      },
      shorts: shortsItems,
    };
  } catch (err: any) {
    console.error("❌ [Story Pipeline] Fatal error:", err);
    params.onProgress?.(0, `Error: ${err.message}`);
    return {
      success: false,
      projectId: "",
      projectTitle: "",
      masterVideo: { outputPath: "", thumbnailPath: "", durationSec: 0 },
      shorts: [],
      error: err.message,
    };
  }
}
