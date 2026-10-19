import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";

export async function GET() {
  try {
    const channel = await prisma.youTubeChannel.findFirst({
      where: { isConnected: true },
      select: {
        id: true,
        channelId: true,
        title: true,
        customUrl: true,
        description: true,
        thumbnailUrl: true,
        subscriberCount: true,
        videoCount: true,
        isConnected: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      connected: Boolean(channel),
      data: channel,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await prisma.youTubeChannel.updateMany({
      data: { isConnected: false },
    });

    return NextResponse.json({ success: true, message: "Channel disconnected successfully." });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
