import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { createAutomationJob, executeAutomationJob } from "@/lib/automation/engine";

export async function GET() {
  try {
    const jobs = await prisma.automationJob.findMany({
      include: {
        steps: { orderBy: { orderIndex: "asc" } },
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

    return NextResponse.json({ success: true, data: jobs });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const job = await createAutomationJob({
      workflowType: body.workflowType || "FULL_PIPELINE",
      videoProjectId: body.videoProjectId,
      payload: body.payload || {},
    });

    // If autoExecute requested or in local development mode without dedicated worker
    if (body.runImmediately !== false) {
      // Run execution asynchronously in background
      executeAutomationJob(job.id).catch((e) => {
        console.error(`Background job ${job.id} execution failed:`, e);
      });
    }

    return NextResponse.json({ success: true, data: job });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
