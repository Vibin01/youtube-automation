import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await prisma.scene.update({
      where: { id },
      data: {
        ...(body.narration && { narration: body.narration }),
        ...(body.visualPrompt !== undefined && { visualPrompt: body.visualPrompt }),
        ...(body.captionText !== undefined && { captionText: body.captionText }),
        ...(body.duration !== undefined && { duration: parseFloat(body.duration) }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
