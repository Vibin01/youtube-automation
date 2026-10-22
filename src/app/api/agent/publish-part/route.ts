import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { uploadVideoToYouTube, getAuthenticatedYouTubeClient } from "@/lib/youtube/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { videoPath, thumbnailPath, title, description, tags, privacyStatus } = body;

    if (!videoPath) {
      return NextResponse.json({ success: false, error: "Missing videoPath" }, { status: 400 });
    }

    let channel = await prisma.youTubeChannel.findFirst({ where: { isConnected: true } });
    if (!channel && process.env.YOUTUBE_REFRESH_TOKEN) {
      const auth = await getAuthenticatedYouTubeClient();
      channel = auth.channel;
    }

    if (!channel) {
      return NextResponse.json(
        { success: false, error: "No connected YouTube channel found." },
        { status: 400 }
      );
    }

    const uploadRes = await uploadVideoToYouTube({
      videoFilePath: videoPath,
      thumbnailFilePath: thumbnailPath,
      title: title || "Happy Kuttu Song Episode",
      description: description || "#HappyKuttuSong #TamilShorts",
      tags: Array.isArray(tags) ? tags : ["HappyKuttuSong", "TamilShorts"],
      privacyStatus: privacyStatus || "public",
      madeForKids: false,
      language: "ta",
    });

    const youtubeVideoId = (uploadRes as any).videoId || (uploadRes as any).youtubeVideoId;
    const youtubeUrl = (uploadRes as any).videoUrl || (uploadRes as any).youtubeUrl;

    return NextResponse.json({
      success: true,
      youtubeVideoId,
      youtubeUrl,
    });
  } catch (err: any) {
    console.error("Publish Part Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
