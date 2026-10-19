import { prisma } from "../lib/database/prisma";
import { executeAutomationJob } from "../lib/automation/engine";

let isRunning = false;
let shouldStop = false;

export async function processNextJob(): Promise<boolean> {
  const queuedJob = await prisma.automationJob.findFirst({
    where: {
      status: "queued",
    },
    orderBy: { createdAt: "asc" },
  });

  if (!queuedJob) {
    return false;
  }

  console.log(`[Worker] Starting job ${queuedJob.id} (Workflow: ${queuedJob.workflowType})`);

  try {
    await executeAutomationJob(queuedJob.id);
    console.log(`[Worker] Successfully completed job ${queuedJob.id}`);
    return true;
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`[Worker] Job ${queuedJob.id} failed:`, error.message);
    return false;
  }
}

export async function startWorkerLoop(intervalMs = 3000) {
  if (isRunning) return;
  isRunning = true;
  shouldStop = false;

  console.log("==================================================");
  console.log("🤖 YouTube Automation Local Worker Started");
  console.log("==================================================");

  while (!shouldStop) {
    try {
      const processed = await processNextJob();
      if (!processed) {
        await new Promise((res) => setTimeout(res, intervalMs));
      }
    } catch (loopErr) {
      console.error("[Worker Loop Error]:", loopErr);
      await new Promise((res) => setTimeout(res, intervalMs));
    }
  }

  isRunning = false;
  console.log("[Worker] Stopped.");
}

export function stopWorkerLoop() {
  shouldStop = true;
}

// Standalone execution check
if (require.main === module || process.argv.includes("--run-worker")) {
  startWorkerLoop()
    .then(() => {})
    .catch((err) => {
      console.error("Worker fatal error:", err);
      process.exit(1);
    });
}
