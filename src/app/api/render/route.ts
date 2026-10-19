import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { renderVideoProject } from "@/lib/video/renderer";
import { VideoRenderSchema } from "@/lib/validation";

export async function GET() {
  try {
    const renders = await prisma.videoRender.findMany({
      include: {
        videoProject: {
          select: {
            id: true,
            title: true,
            format: true,
            language: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, data: renders });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = VideoRenderSchema.parse(body);

    const project = await prisma.videoProject.findUnique({
      where: { id: validated.videoProjectId },
      include: { scenes: true },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    if (!project.scenes || project.scenes.length === 0) {
      return NextResponse.json(
        { success: false, error: "Project has no scenes. Please generate a script first." },
        { status: 400 }
      );
    }

    // Execute rendering directly
    const renderResult = await renderVideoProject(validated.videoProjectId);

    return NextResponse.json({
      success: true,
      data: renderResult,
      message: "Video rendered successfully!",
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Render route error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
