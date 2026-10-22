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

import { runAutonomousVideoAgent } from "../lib/agent/autonomous-video-agent";

async function main() {
  console.log("==================================================================");
  console.log("🤖 AutoTube AI — Autonomous Animation Video Agent");
  console.log("Strict Prompt-to-Video Generation (No Static Images) -> Merge -> Publish");
  console.log("==================================================================");

  const topic = process.argv[2] || "அலப்பறை ஆறுமுகம் 500 கோடி இன்டர்நேஷனல் டீல்! 🤣🔥";
  const format = (process.argv[3] as "SHORTS" | "LONG_FORM") || "SHORTS";

  console.log(`📌 Topic: ${topic}`);
  console.log(`📱 Format: ${format}`);
  console.log(`🚀 Starting Autonomous AI Agent Workflow...\n`);

  const result = await runAutonomousVideoAgent({
    topic,
    format,
    language: "Tamil",
    autoPublish: true,
    privacyStatus: "unlisted",
    onProgress: (pct, msg) => {
      console.log(`[Agent: ${pct}%] ${msg}`);
    },
  });

  if (result.success) {
    console.log("\n==================================================================");
    console.log("🎉 AGENT WORKFLOW COMPLETED SUCCESSFULLY!");
    console.log(`📁 Video Path: ${result.videoPath}`);
    console.log(`🖼️ Thumbnail Path: ${result.thumbnailPath}`);
    console.log(`⏱️ Duration: ${result.durationSec.toFixed(1)}s`);
    if (result.youtubeUrl) {
      console.log(`🌐 YouTube Live URL: ${result.youtubeUrl}`);
    } else {
      console.log(`ℹ️ Video saved locally and ready for YouTube upload.`);
    }
    console.log("==================================================================");
    process.exit(0);
  } else {
    console.error("\n❌ Agent Workflow Failed:", result.error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error running agent:", err);
  process.exit(1);
});
