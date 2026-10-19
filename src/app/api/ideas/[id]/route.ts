import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await prisma.contentIdea.update({
      where: { id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.title && { title: body.title }),
        ...(body.hook && { hook: body.hook }),
        ...(body.description && { description: body.description }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.contentIdea.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
