import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";

export async function GET() {
  try {
    const [
      totalProjects,
      publishedProjects,
      renderingProjects,
      failedProjects,
      totalIdeas,
      totalRenders,
      recentProjects,
      channel,
    ] = await Promise.all([
      prisma.videoProject.count(),
      prisma.videoProject.count({ where: { status: "PUBLISHED" } }),
      prisma.videoProject.count({ where: { status: { in: ["RENDERING", "SCRIPTING"] } } }),
      prisma.videoProject.count({ where: { status: "FAILED" } }),
      prisma.contentIdea.count(),
      prisma.videoRender.count({ where: { status: "COMPLETED" } }),
      prisma.videoProject.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          renders: { take: 1, orderBy: { createdAt: "desc" } },
          publishingJobs: { take: 1, orderBy: { createdAt: "desc" } },
        },
      }),
      prisma.youTubeChannel.findFirst({
        where: { isConnected: true },
      }),
    ]);

    const shortsCount = await prisma.videoProject.count({ where: { format: "SHORTS" } });
    const longFormCount = await prisma.videoProject.count({ where: { format: "LONG_FORM" } });

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          totalVideos: totalProjects,
          publishedVideos: publishedProjects,
          inProgressVideos: renderingProjects,
          failedVideos: failedProjects,
          totalIdeas,
          totalRenders,
          shortsCount,
          longFormCount,
        },
        channel: channel
          ? {
              title: channel.title,
              customUrl: channel.customUrl,
              subscribers: channel.subscriberCount,
              videoCount: channel.videoCount,
              thumbnailUrl: channel.thumbnailUrl,
            }
          : null,
        recentActivity: recentProjects,
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
