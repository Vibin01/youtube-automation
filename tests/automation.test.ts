import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/database/prisma";
import { createAutomationJob, executeAutomationJob } from "@/lib/automation/engine";

describe("Automation Engine and Job Runner", () => {
  it("should create an automation job with sequenced steps", async () => {
    const job = await createAutomationJob({
      workflowType: "FULL_PIPELINE",
      payload: {
        title: "Test Automation Pipeline Video",
        niche: "AI Tools",
        format: "SHORTS",
        language: "English",
        autoApprove: false, // will pause on needs_review
      },
    });

    expect(job.id).toBeDefined();
    expect(job.status).toBe("queued");

    const steps = await prisma.workflowStep.findMany({
      where: { automationJobId: job.id },
      orderBy: { orderIndex: "asc" },
    });

    expect(steps.length).toBe(5);
    expect(steps[0].stepName).toBe("generate_idea");
    expect(steps[1].stepName).toBe("generate_script");
    expect(steps[2].stepName).toBe("review_approval");
  });

  it("should execute steps and pause at human review gate when autoApprove is false", async () => {
    const job = await createAutomationJob({
      workflowType: "FULL_PIPELINE",
      payload: {
        title: "Test Safety Review Pipeline",
        niche: "Tech Productivity",
        format: "SHORTS",
        language: "English",
        autoApprove: false,
      },
    });

    await executeAutomationJob(job.id);

    const updatedJob = await prisma.automationJob.findUnique({
      where: { id: job.id },
      include: {
        steps: { orderBy: { orderIndex: "asc" } },
        videoProject: { include: { script: true, scenes: true } },
      },
    });

    expect(updatedJob).toBeDefined();
    // It should have completed generate_idea and generate_script, and paused at needs_review
    expect(updatedJob?.status).toBe("needs_review");
    expect(updatedJob?.videoProject).toBeDefined();
    expect(updatedJob?.videoProject?.script).toBeDefined();
    expect(updatedJob?.videoProject?.scenes.length).toBeGreaterThan(0);
  });
});
