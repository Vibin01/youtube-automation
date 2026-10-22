import { NextRequest, NextResponse } from "next/server";
import { generateOmniStoryPipeline } from "@/lib/video/story-pipeline";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      prompt,
      characters,
      sceneCount,
      autoPublish,
      publishFirstPartNow,
      privacyStatus,
    } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid story prompt or topic." },
        { status: 400 }
      );
    }

    console.log("🎬 [Omni Story API] Starting 5-6 min Master Story generation:", {
      prompt,
      characters,
      sceneCount: sceneCount || 8,
    });

    const result = await generateOmniStoryPipeline({
      prompt: prompt.trim(),
      characters: Array.isArray(characters) ? characters : undefined,
      sceneCount: typeof sceneCount === "number" ? sceneCount : 8,
      autoPublish: autoPublish !== false,
      publishFirstPartNow: publishFirstPartNow !== false,
      privacyStatus: privacyStatus || "unlisted",
      onProgress: (pct, msg) => {
        console.log(`[Omni Story API: ${pct}%] ${msg}`);
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
    console.error("Omni Story API Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
