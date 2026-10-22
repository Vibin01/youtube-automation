import { NextRequest, NextResponse } from "next/server";
import { runAutonomousVideoAgent } from "@/lib/agent/autonomous-video-agent";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      scriptText,
      topic,
      niche,
      category,
      format,
      language,
      targetDurationSec,
      autoPublish,
      privacyStatus,
      videoProvider,
      characterId,
    } = body;

    console.log("⚡ Received AI Agent trigger request:", { topic, format, language, videoProvider, characterId, autoPublish });

    if (body.pipelineType === "narrative_continuous" || body.pipelineType === "continuous_narrative") {
      const { runContinuousNarrativePipeline } = await import("@/lib/narrative/continuous-narrative-pipeline");
      const res = await runContinuousNarrativePipeline({
        topicOrPrompt: topic || scriptText,
        selectedCharacterIds: body.characters || (characterId && characterId !== "auto" ? [characterId] : undefined),
        targetDurationSec: targetDurationSec || 330,
        targetSceneDurationSec: body.targetSceneDurationSec || 9.2,
        targetSceneCount: body.targetSceneCount,
        language: language || "Tamil",
        autoPublish: autoPublish !== undefined ? autoPublish : true,
        publishFirstShortNow: body.publishFirstShortNow !== undefined ? body.publishFirstShortNow : true,
        privacyStatus: privacyStatus || "public",
        videoProviderOverride: videoProvider,
        onProgress: (pct, msg) => {
          console.log(`[Narrative Agent Progress: ${pct}%] ${msg}`);
        },
      });

      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: res,
      });
    }

    const result = await runAutonomousVideoAgent({
      scriptText,
      topic,
      niche,
      category,
      format,
      language,
      targetDurationSec,
      autoPublish,
      privacyStatus,
      videoProvider,
      characterId,
      onProgress: (pct, msg) => {
        console.log(`[Agent Progress: ${pct}%] ${msg}`);
      },
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("Agent API Route Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
