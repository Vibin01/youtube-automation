import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { executeAutomationJob } from "@/lib/automation/engine";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await prisma.automationJob.findUnique({
      where: { id },
      include: {
        steps: { orderBy: { orderIndex: "asc" } },
        videoProject: {
          include: {
            script: true,
            scenes: { orderBy: { orderIndex: "asc" } },
            renders: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: job });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action } = await request.json();

    const job = await prisma.automationJob.findUnique({ where: { id } });
    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    if (action === "cancel") {
      await prisma.automationJob.update({
        where: { id },
        data: { status: "cancelled" },
      });
      return NextResponse.json({ success: true, message: "Job cancelled successfully." });
    }

    if (action === "approve") {
      // Approve human review step
      if (job.videoProjectId) {
        await prisma.videoProject.update({
          where: { id: job.videoProjectId },
          data: { humanApproved: true },
        });
        await prisma.script.updateMany({
          where: { videoProjectId: job.videoProjectId },
          data: { isApproved: true },
        });
      }

      await prisma.automationJob.update({
        where: { id },
        data: { status: "approved" },
      });

      // Resume execution
      executeAutomationJob(id).catch(console.error);

      return NextResponse.json({ success: true, message: "Script approved and job resumed." });
    }

    if (action === "retry" || action === "resume") {
      await prisma.automationJob.update({
        where: { id },
        data: {
          status: "queued",
          errorMessage: null,
        },
      });

      executeAutomationJob(id).catch(console.error);
      return NextResponse.json({ success: true, message: "Job queued for retry." });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
