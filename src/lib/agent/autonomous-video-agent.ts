import fs from "fs";
import path from "path";
import { prisma } from "../database/prisma";
import { getAppSettings } from "../database/settings";
import { generateFullScript } from "../gemini/client";
import { renderVideoProject } from "../video/renderer";
import { uploadVideoToYouTube, getAuthenticatedYouTubeClient } from "../youtube/client";
import { CAST } from "../characters/cast";

export interface AgentRunParams {
  scriptText?: string;
  topic?: string;
  niche?: string;
  category?: "educational" | "entertainment" | "storytelling" | "kids";
  format?: "SHORTS" | "LONG_FORM";
  language?: "English" | "Tamil";
  targetDurationSec?: number;
  autoPublish?: boolean;
  privacyStatus?: "public" | "unlisted" | "private";
  videoProvider?: "gemini_browser" | "gemini" | "replicate" | "luma" | "fal" | "procedural" | "auto";
  characterId?: string;
  onProgress?: (progress: number, stepName: string, meta?: any) => void;
}

export interface AgentRunResult {
  success: boolean;
  projectId: string;
  videoPath: string;
  thumbnailPath: string;
  durationSec: number;
  youtubeUrl?: string;
  youtubeVideoId?: string;
  error?: string;
}

/**
 * Autonomous AI Video Agent:
 * 1. Takes / ingests script automatically
 * 2. Generates prompt-based animation video clips for every scene (STRICT NO STATIC IMAGES)
 * 3. Merges the animation video clips with synchronized audio & transitions
 * 4. Publishes directly to YouTube
 */
export async function runAutonomousVideoAgent(params: AgentRunParams): Promise<AgentRunResult> {
  const settings = await getAppSettings();
  const format = params.format || (settings.defaultVideoFormat as "SHORTS" | "LONG_FORM") || "SHORTS";
  const language = params.language || (settings.defaultLanguage as "English" | "Tamil") || "Tamil";
  const niche = params.niche || settings.defaultNiche || "Tamil Comedy & Animation";
  const category = params.category || "entertainment";
  const targetDurationSec = params.targetDurationSec || (format === "SHORTS" ? 45 : 180);
  const autoPublish = params.autoPublish !== undefined ? params.autoPublish : true;
  const privacyStatus = params.privacyStatus || (settings.defaultVisibility as "public" | "unlisted" | "private") || "public";

  params.onProgress?.(5, "🤖 AI Agent initialized. Ingesting script...");

  try {
    // -------------------------------------------------------------------------
    // PHASE 1: AUTOMATIC SCRIPT INGESTION / GENERATION
    // -------------------------------------------------------------------------
    let projectTitle = params.topic || "AI Animated Comedy Episode";
    let scriptOutput: {
      title: string;
      hook: string;
      body: string;
      callToAction: string;
      description: string;
      hashtags: string[];
      thumbnailIdeas: string[];
      scenes: Array<{
        orderIndex: number;
        narration: string;
        visualPrompt: string;
        captionText: string;
        duration: number;
      }>;
    };

    if (params.scriptText && params.scriptText.trim().length > 20) {
      console.log("📝 [AI Agent] Ingesting provided raw script...");
      params.onProgress?.(10, "Parsing and structuring input script into animation scenes...");

      // Split raw script lines into scenes if not structured
      const lines = params.scriptText
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      const sceneCount = Math.max(3, Math.min(lines.length, 10));
      const scenes = [];

      for (let i = 0; i < sceneCount; i++) {
        const line = lines[i] || `Scene ${i + 1}`;
        const char = CAST[i % CAST.length];
        scenes.push({
          orderIndex: i,
          narration: line,
          visualPrompt: `[Characters: ${char.id}] 3D cartoon animation, ${char.name} ${char.personality.slice(0, 50)}, fluid dynamic cartoon motion, vibrant studio lighting`,
          captionText: line.slice(0, 60),
          duration: 5.0,
        });
      }

      scriptOutput = {
        title: projectTitle,
        hook: lines[0] || "Watch what happens!",
        body: params.scriptText,
        callToAction: "Subscribe for more animated episodes!",
        description: `${projectTitle}\n\n${params.scriptText}\n\n#Animation #Comedy #TamilShorts`,
        hashtags: ["#Animation", "#AIAnimation", "#Comedy"],
        thumbnailIdeas: ["Mass character pose with bold comic title"],
        scenes,
      };
    } else {
      console.log("✨ [AI Agent] Generating autonomous screenplay via Gemini...");
      params.onProgress?.(12, "Autonomous AI Screenwriter generating comedy scenes and visual prompts...");

      scriptOutput = await generateFullScript({
        title: projectTitle,
        format,
        language,
        niche,
        category,
        targetDurationSec,
        tone: "Hilarious, energetic, comedic timing",
      });
      projectTitle = scriptOutput.title;
    }

    // 1. Create VideoProject in database
    const project = await prisma.videoProject.create({
      data: {
        title: projectTitle,
        description: scriptOutput.description,
        format,
        language,
        status: "SCRIPT_READY",
        tags: JSON.stringify(scriptOutput.hashtags),
      },
    });

    console.log(`✅ [AI Agent] Project Created: ${project.id} - "${projectTitle}"`);

    // 2. Create Script record
    await prisma.script.create({
      data: {
        videoProjectId: project.id,
        title: scriptOutput.title,
        hook: scriptOutput.hook,
        body: scriptOutput.body,
        callToAction: scriptOutput.callToAction,
        description: scriptOutput.description,
        hashtags: JSON.stringify(scriptOutput.hashtags),
        thumbnailIdeas: JSON.stringify(scriptOutput.thumbnailIdeas),
        targetDurationSec,
        isApproved: true,
      },
    });

    // 3. Create Scene records with prompt-to-video instructions
    for (const s of scriptOutput.scenes) {
      await prisma.scene.create({
        data: {
          videoProjectId: project.id,
          orderIndex: s.orderIndex,
          narration: s.narration,
          visualPrompt: s.visualPrompt,
          captionText: s.captionText,
          duration: s.duration || 5.0,
          status: "PENDING",
        },
      });
    }

    params.onProgress?.(25, `Script ingested! ${scriptOutput.scenes.length} animation scenes prepared.`);

    // -------------------------------------------------------------------------
    // PHASE 2 & 3: GENERATE ANIMATION VIDEO CLIPS & MERGE
    // (Prompt-to-video engine with strict NO STATIC IMAGES)
    // -------------------------------------------------------------------------
    params.onProgress?.(30, "Generating prompt-based animation video clips for all scenes...");

    const renderResult = await renderVideoProject(
      project.id,
      (renderPct, renderMsg) => {
        const overallProgress = Math.min(88, Math.round(30 + (renderPct * 0.58)));
        params.onProgress?.(overallProgress, renderMsg);
      },
      { providerOverride: params.videoProvider, characterId: params.characterId }
    );

    console.log(`🎬 [AI Agent] Video Rendered & Merged Successfully: ${renderResult.outputPath}`);
    params.onProgress?.(90, "Animation video successfully generated & merged! Preparing YouTube publishing...");

    // -------------------------------------------------------------------------
    // PHASE 4: PUBLISH TO YOUTUBE
    // -------------------------------------------------------------------------
    let youtubeUrl: string | undefined;
    let youtubeVideoId: string | undefined;

    if (autoPublish) {
      params.onProgress?.(92, "Connecting to YouTube channel...");

      let channel = await prisma.youTubeChannel.findFirst({ where: { isConnected: true } });
      if (!channel && process.env.YOUTUBE_REFRESH_TOKEN) {
        try {
          const auth = await getAuthenticatedYouTubeClient();
          channel = auth.channel;
        } catch (e) {
          console.warn("YouTube channel auto-auth from env secret:", e);
        }
      }

      if (channel) {
        try {
          console.log(`🚀 [AI Agent] Uploading to YouTube channel: ${channel.title}...`);
          params.onProgress?.(95, `Uploading video to YouTube channel "${channel.title}"...`);

          const uploadRes = await uploadVideoToYouTube({
            videoFilePath: renderResult.outputPath,
            thumbnailFilePath: renderResult.thumbnailPath,
            title: projectTitle,
            description: `${scriptOutput.description}\n\n${scriptOutput.hashtags.join(" ")}`,
            tags: scriptOutput.hashtags.map((t) => t.replace("#", "")),
            privacyStatus,
            madeForKids: false,
            language: language === "Tamil" ? "ta" : "en",
          });

          youtubeVideoId = (uploadRes as any).videoId || (uploadRes as any).youtubeVideoId;
          youtubeUrl = (uploadRes as any).videoUrl || (uploadRes as any).youtubeUrl;
          console.log(`🎉 [AI Agent] Published to YouTube! URL: ${youtubeUrl}`);
        } catch (uploadErr: any) {
          console.warn("⚠️ [AI Agent] YouTube auto-upload notice:", uploadErr.message);
          params.onProgress?.(96, `YouTube upload notice: ${uploadErr.message}. Video saved locally!`);
        }
      } else {
        console.log("ℹ️ [AI Agent] YouTube Channel not yet linked. Video saved and ready for one-click upload.");
        params.onProgress?.(96, "YouTube Channel not yet linked. Master video saved locally!");
      }
    }

    params.onProgress?.(100, "AI Agent workflow completed successfully!", {
      videoPath: renderResult.outputPath,
      youtubeUrl,
    });

    return {
      success: true,
      projectId: project.id,
      videoPath: renderResult.outputPath,
      thumbnailPath: renderResult.thumbnailPath,
      durationSec: renderResult.durationSec,
      youtubeUrl,
      youtubeVideoId,
    };
  } catch (err: any) {
    console.error("❌ [AI Agent] Execution failed:", err);
    params.onProgress?.(0, `Agent Error: ${err.message}`);
    return {
      success: false,
      projectId: "",
      videoPath: "",
      thumbnailPath: "",
      durationSec: 0,
      error: err.message,
    };
  }
}
