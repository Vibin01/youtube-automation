import { NextRequest, NextResponse } from "next/server";
import { runContinuousNarrativePipeline } from "@/lib/narrative/continuous-narrative-pipeline";

/**
 * Webhook and REST API Endpoint: End-to-End Continuous Narrative Video Pipeline
 * Triggerable via single-click dashboard button, curl, or external webhook.
 *
 * Steps:
 * 1. Narrative Generation (from 16-character cast)
 * 2. Scene Breakdown & Timing (8-10s each, 30-45 scenes)
 * 3. Central Scene Registry (Database + CSV/JSON Sheets)
 * 4. AI Video Generation & Asset Retrieval (Character image + prompt)
 * 5. Sequential Batch Processing
 * 6. Stitching & Post-Production (Seamless 5-6 min master)
 * 7. Monday Long-Form Publishing Schedule
 * 8. Automated Shorts Repurposing & Twice-Daily Distribution
 * 9. Complete Zero-Touch Packaging
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      topic,
      prompt,
      characters,
      targetDurationSec,
      targetSceneDurationSec,
      targetSceneCount,
      language,
      autoPublish,
      publishFirstShortNow,
      privacyStatus,
      videoProvider,
    } = body;

    console.log("⚡ [API Route: /api/pipeline/narrative-to-video] Pipeline Trigger Received:", {
      topic: topic || prompt,
      characters,
      targetDurationSec,
      privacyStatus,
    });

    const result = await runContinuousNarrativePipeline({
      topicOrPrompt: topic || prompt,
      selectedCharacterIds: characters,
      targetDurationSec: targetDurationSec ? Number(targetDurationSec) : 330,
      targetSceneDurationSec: targetSceneDurationSec ? Number(targetSceneDurationSec) : 9.2,
      targetSceneCount: targetSceneCount ? Number(targetSceneCount) : undefined,
      language: language || "Tamil",
      autoPublish: autoPublish !== undefined ? Boolean(autoPublish) : true,
      publishFirstShortNow: publishFirstShortNow !== undefined ? Boolean(publishFirstShortNow) : true,
      privacyStatus: privacyStatus || "public",
      videoProviderOverride: videoProvider,
      onProgress: (pct, stepName) => {
        console.log(`[API Webhook Progress: ${pct}%] ${stepName}`);
      },
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        projectId: result.projectId,
        title: result.narrativeTitle,
        synopsis: result.synopsis,
        cast: result.selectedCast.map((c) => ({ id: c.id, name: c.name, role: c.role })),
        totalScenes: result.totalScenes,
        totalDurationSec: result.totalDurationSec,
        registryPaths: result.registryPaths,
        masterVideo: result.masterVideo,
        episodicShorts: result.episodicShorts,
      },
    });
  } catch (err: any) {
    console.error("Pipeline API Webhook Fatal Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to execute continuous narrative pipeline",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    name: "AutoTube AI - Continuous Narrative Video Pipeline Webhook",
    description: "Accepts POST requests to trigger 9-step automated video pipeline.",
    examplePayload: {
      topic: "டீக்கடை பஞ்சாயத்து: ஆனந்த், பாலு & ஆறுமுகம் மகா கலாட்டா! 🤣🔥",
      characters: ["anand", "balu", "aarumugam", "sodamani"],
      targetDurationSec: 330,
      targetSceneDurationSec: 9.2,
      targetSceneCount: 36,
      privacyStatus: "public",
      autoPublish: true,
    },
  });
}
