import fs from "fs";
import path from "path";

// Load environment configuration (.env.local and .env)
const envLocal = path.resolve(process.cwd(), ".env.local");
const envMain = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envLocal) && typeof (process as any).loadEnvFile === "function") {
  (process as any).loadEnvFile(envLocal);
}
if (fs.existsSync(envMain) && typeof (process as any).loadEnvFile === "function") {
  (process as any).loadEnvFile(envMain);
}

import { runContinuousNarrativePipeline } from "../lib/narrative/continuous-narrative-pipeline";
import { CAST } from "../lib/characters/cast";

async function main() {
  console.log("==================================================================");
  console.log("🎬 AutoTube AI — 9-Step Continuous Narrative Video Pipeline");
  console.log("STEP 1: Narrative Generation (16 Character Pool)");
  console.log("STEP 2: Scene Breakdown & Timing (8-10s scenes, 30-45 total)");
  console.log("STEP 3: Scene Registry & Tracking (Central DB & CSV/JSON Sheets)");
  console.log("STEP 4: AI Video Generation & Asset Retrieval (Char Image + Prompt)");
  console.log("STEP 5: Sequential Batch Processing");
  console.log("STEP 6: Stitching & Post-Production (Seamless 5-6m Master)");
  console.log("STEP 7: Long-Form Publishing Schedule (Every Monday)");
  console.log("STEP 8: Automated Shorts Repurposing & Twice-Daily Distribution");
  console.log("STEP 9: Complete Zero-Touch Autonomous Execution");
  console.log("==================================================================");

  // Parse command line arguments
  const args = process.argv.slice(2);
  let topic = "டீக்கடை பஞ்சாயத்து: ஆனந்த், பாலு & ஆறுமுகம் மகா காமெடி கலாட்டா! 🤣🔥";
  let characters: string[] | undefined = undefined;
  let targetDurationSec = 330; // 5.5 minutes
  let targetSceneDurationSec = 9.2; // 8-10 seconds
  let targetSceneCount: number | undefined = undefined;
  let privacyStatus: "public" | "unlisted" | "private" = "public";
  let autoPublish = true;
  let videoProviderOverride: any = "gemini_browser";
  let resumeProjectId: string | undefined = undefined;
  let forceNew = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--new" || arg === "--fresh") {
      forceNew = true;
    } else if (arg === "--resume") {
      if (args[i + 1] && !args[i + 1].startsWith("--")) {
        resumeProjectId = args[++i];
      } else {
        resumeProjectId = "AUTO";
      }
    } else if ((arg === "--topic" || arg === "--prompt") && args[i + 1]) {
      topic = args[++i];
    } else if (arg === "--characters" && args[i + 1]) {
      characters = args[++i].split(",").map((s) => s.trim().toLowerCase());
    } else if (arg === "--scenes" && args[i + 1]) {
      targetSceneCount = parseInt(args[++i], 10);
    } else if (arg === "--duration" && args[i + 1]) {
      targetDurationSec = parseInt(args[++i], 10);
    } else if (arg === "--sceneDuration" && args[i + 1]) {
      targetSceneDurationSec = parseFloat(args[++i]);
    } else if (arg === "--privacy" && args[i + 1]) {
      privacyStatus = args[++i] as any;
    } else if (arg === "--provider" && args[i + 1]) {
      videoProviderOverride = args[++i];
    } else if (arg === "--no-publish") {
      autoPublish = false;
    } else if (arg === "--public") {
      privacyStatus = "public";
    } else if (arg === "--unlisted") {
      privacyStatus = "unlisted";
    } else if (arg === "--private") {
      privacyStatus = "private";
    } else if (!arg.startsWith("--") && i === 0) {
      topic = arg;
    }
  }

  // Graceful exit handler on Ctrl+C or window close
  process.on("SIGINT", () => {
    console.log("\n\n==================================================================");
    console.log("🛑 [PIPELINE PAUSED] Process interrupted!");
    console.log("💾 All finished scenes have been safely saved to checkpoint.");
    console.log("👉 Run 'run_narrative_pipeline.bat' anytime to resume right where you left off!");
    console.log("==================================================================\n");
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\n🛑 [PIPELINE TERMINATED] Progress saved safely. Ready to resume anytime.");
    process.exit(0);
  });

  console.log(`📌 Topic: "${topic}"`);
  if (characters && characters.length > 0) {
    console.log(`🎭 Requested Characters: ${characters.join(", ")}`);
  } else {
    console.log(`🎭 Characters: Dynamic selection from 16-character cast`);
  }
  console.log(`⏱️ Duration: ${targetDurationSec}s (~${(targetDurationSec / 60).toFixed(1)} mins)`);
  console.log(`📐 Scene Length: ~${targetSceneDurationSec.toFixed(1)}s (8–10s target)`);
  console.log(`🌐 YouTube Privacy: ${privacyStatus.toUpperCase()}`);
  console.log(`🚀 Auto Publish: ${autoPublish ? "YES" : "NO"}`);
  console.log(`🔄 Mode: ${forceNew ? "NEW PROJECT (--new)" : "AUTO-RESUME ENABLED (Resumes unfinished projects)"}\n`);

  const result = await runContinuousNarrativePipeline({
    topicOrPrompt: topic,
    selectedCharacterIds: characters,
    targetDurationSec,
    targetSceneDurationSec,
    targetSceneCount,
    language: "Tamil",
    autoPublish,
    publishFirstShortNow: autoPublish,
    privacyStatus,
    videoProviderOverride,
    resumeProjectId,
    forceNew,
    onProgress: (pct, stepName) => {
      console.log(`[Pipeline Progress: ${pct}%] ${stepName}`);
    },
  });

  if (result.success) {
    console.log("\n==================================================================");
    console.log("🎉 9-STEP PIPELINE EXECUTION SUCCESSFUL!");
    console.log("==================================================================");
    console.log(`🎬 Master Episode: ${result.masterVideo.videoPath}`);
    console.log(`⏱️ Master Runtime: ${(result.masterVideo.durationSec / 60).toFixed(1)} mins (${result.masterVideo.durationSec.toFixed(1)}s)`);
    console.log(`🖼️ Master Thumbnail: ${result.masterVideo.thumbnailPath}`);
    console.log(`📋 Scene Registry Sheet: ${result.registryPaths.csvPath}`);
    console.log(`📅 Scheduled Monday Master: ${result.masterVideo.scheduledMondayIST}`);
    if (result.masterVideo.youtubeUrl) {
      console.log(`🌐 YouTube Live URL (Master): ${result.masterVideo.youtubeUrl}`);
    }

    console.log(`\n📱 Queued Episodic Shorts (${result.episodicShorts.length} parts):`);
    result.episodicShorts.forEach((s) => {
      console.log(`   👉 Part ${s.partNumber} [${s.slot}]: "${s.title}"`);
      console.log(`      File: ${path.basename(s.videoPath)} | Scheduled: ${s.scheduledTimeIST} | Status: ${s.status}${s.youtubeUrl ? ` (Live: ${s.youtubeUrl})` : ""}`);
    });

    console.log("\n🔁 Distribution Schedule: Monday Master + Twice-Daily Shorts (10 AM & 5 PM IST)");
    console.log("==================================================================");
    process.exit(0);
  } else {
    console.error("\n❌ Pipeline Execution Failed:", result.error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
