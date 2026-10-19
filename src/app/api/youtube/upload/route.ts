import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { uploadVideoToYouTube } from "@/lib/youtube/client";
import { PublishingInputSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = PublishingInputSchema.parse(body);

    const project = await prisma.videoProject.findUnique({
      where: { id: validated.videoProjectId },
      include: {
        renders: {
          where: { status: "COMPLETED" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    const latestRender = project.renders[0];
    if (!latestRender || !latestRender.outputPath) {
      return NextResponse.json(
        { success: false, error: "No completed video render found for this project. Please render the video first." },
        { status: 400 }
      );
    }

    // Create queued publishing job
    const job = await prisma.publishingJob.create({
      data: {
        videoProjectId: validated.videoProjectId,
        channelId: validated.channelId,
        title: validated.title,
        description: validated.description,
        tags: JSON.stringify(validated.tags),
        privacyStatus: validated.privacyStatus,
        scheduledPublishTime: validated.scheduledPublishTime ? new Date(validated.scheduledPublishTime) : null,
        madeForKids: validated.madeForKids,
        status: "UPLOADING",
        uploadProgress: 10,
      },
    });

    // Upload to YouTube
    const result = await uploadVideoToYouTube({
      videoFilePath: latestRender.outputPath,
      thumbnailFilePath: latestRender.thumbnailPath || undefined,
      title: validated.title,
      description: validated.description,
      tags: validated.tags,
      privacyStatus: validated.privacyStatus,
      scheduledPublishTime: validated.scheduledPublishTime || undefined,
      madeForKids: validated.madeForKids,
      channelId: validated.channelId,
    });

    // Update job record
    const updatedJob = await prisma.publishingJob.update({
      where: { id: job.id },
      data: {
        status: validated.scheduledPublishTime ? "SCHEDULED" : "PUBLISHED",
        youtubeVideoId: result.videoId,
        youtubeVideoUrl: result.videoUrl,
        uploadProgress: 100,
      },
    });

    await prisma.videoProject.update({
      where: { id: validated.videoProjectId },
      data: {
        status: "PUBLISHED",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        job: updatedJob,
        videoId: result.videoId,
        videoUrl: result.videoUrl,
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("YouTube upload error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
