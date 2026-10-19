import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { generateFullScript } from "@/lib/gemini/client";
import { ScriptGenerationSchema } from "@/lib/validation";

export async function GET() {
  try {
    const projects = await prisma.videoProject.findMany({
      include: {
        script: true,
        scenes: {
          orderBy: { orderIndex: "asc" },
        },
        renders: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: projects });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = ScriptGenerationSchema.parse(body);

    const generated = await generateFullScript(validated);

    // Create VideoProject
    const project = await prisma.videoProject.create({
      data: {
        title: generated.title,
        description: generated.description,
        format: validated.format,
        language: validated.language,
        status: "SCRIPT_READY",
        contentIdeaId: validated.contentIdeaId || null,
        tags: JSON.stringify(generated.hashtags),
      },
    });

    // Create Script
    const script = await prisma.script.create({
      data: {
        videoProjectId: project.id,
        title: generated.title,
        hook: generated.hook,
        body: generated.body,
        callToAction: generated.callToAction,
        description: generated.description,
        hashtags: JSON.stringify(generated.hashtags),
        thumbnailIdeas: JSON.stringify(generated.thumbnailIdeas),
        targetDurationSec: validated.targetDurationSec,
        isApproved: false,
      },
    });

    // Create Scenes
    const scenePromises = generated.scenes.map((scene) =>
      prisma.scene.create({
        data: {
          videoProjectId: project.id,
          orderIndex: scene.orderIndex,
          narration: scene.narration,
          visualPrompt: scene.visualPrompt,
          captionText: scene.captionText,
          duration: scene.duration || 5.0,
          status: "PENDING",
        },
      })
    );

    const scenes = await Promise.all(scenePromises);

    // If an idea was linked, mark it USED
    if (validated.contentIdeaId) {
      await prisma.contentIdea
        .update({
          where: { id: validated.contentIdeaId },
          data: { status: "USED" },
        })
        .catch(() => {});
    }

    return NextResponse.json({
      success: true,
      data: {
        ...project,
        script,
        scenes,
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
