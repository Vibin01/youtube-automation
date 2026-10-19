import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await prisma.videoProject.findUnique({
      where: { id },
      include: {
        script: true,
        scenes: { orderBy: { orderIndex: "asc" } },
        renders: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: project });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // If updating script fields
    if (body.title || body.body || body.hook || body.callToAction || body.description !== undefined || body.isApproved !== undefined) {
      await prisma.script.updateMany({
        where: { videoProjectId: id },
        data: {
          ...(body.title && { title: body.title }),
          ...(body.body && { body: body.body }),
          ...(body.hook !== undefined && { hook: body.hook }),
          ...(body.callToAction !== undefined && { callToAction: body.callToAction }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.isApproved !== undefined && { isApproved: body.isApproved }),
        },
      });
    }

    if (body.title || body.madeForKids !== undefined || body.humanApproved !== undefined || body.status) {
      await prisma.videoProject.update({
        where: { id },
        data: {
          ...(body.title && { title: body.title }),
          ...(body.madeForKids !== undefined && { madeForKids: body.madeForKids }),
          ...(body.humanApproved !== undefined && { humanApproved: body.humanApproved }),
          ...(body.status && { status: body.status }),
        },
      });
    }

    const updated = await prisma.videoProject.findUnique({
      where: { id },
      include: {
        script: true,
        scenes: { orderBy: { orderIndex: "asc" } },
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
    await prisma.videoProject.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
