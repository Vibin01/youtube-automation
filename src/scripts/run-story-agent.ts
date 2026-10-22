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

import { generateOmniStoryPipeline } from "../lib/video/story-pipeline";
import { CAST } from "../lib/characters/cast";

async function main() {
  console.log("==================================================================");
  console.log("🎬 AutoTube AI — Gemini Omni 5-6 Min Master Story & Shorts Pipeline");
  console.log("Takes Prompt + Characters -> 8-10 Scenes -> 5-6m Master + Morning/Evening Shorts");
  console.log("==================================================================");

  // Parse CLI arguments
  const args = process.argv.slice(2);
  let prompt = "ஆனந்தின் அதிநவீன AI ரோபோ டீக்கடை கலாட்டா! சோடா மணி பீதி!";
  let characters = ["anand", "balu", "aarumugam"];
  let scenes = 8;
  let privacyStatus: "public" | "unlisted" | "private" = "public";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--prompt" && args[i + 1]) {
      prompt = args[i + 1];
      i++;
    } else if (args[i] === "--characters" && args[i + 1]) {
      characters = args[i + 1].split(",").map((s) => s.trim());
      i++;
    } else if (args[i] === "--scenes" && args[i + 1]) {
      scenes = parseInt(args[i + 1], 10) || 8;
      i++;
    } else if (args[i] === "--privacy" && args[i + 1]) {
      privacyStatus = args[i + 1] as any;
      i++;
    } else if (args[i] === "--public") {
      privacyStatus = "public";
    } else if (args[i] === "--unlisted") {
      privacyStatus = "unlisted";
    } else if (!args[i].startsWith("--") && i === 0) {
      prompt = args[i];
    }
  }

  const selectedCast = characters
    .map((c) => CAST.find((char) => char.id === c.toLowerCase() || char.name.toLowerCase().includes(c.toLowerCase())))
    .filter(Boolean);

  console.log(`📌 Story Prompt: "${prompt}"`);
  console.log(`🎭 Starring Characters: ${selectedCast.map((c) => c?.name).join(", ")}`);
  console.log(`🎬 Target Scenes: ${scenes} (Sum total ~5 to 6 minutes)`);
  console.log(`🌐 YouTube Privacy: ${privacyStatus.toUpperCase()}`);
  console.log(`📅 Publishing Strategy: Morning & Evening repeating 30s Shorts\n`);

  const result = await generateOmniStoryPipeline({
    prompt,
    characters,
    sceneCount: scenes,
    autoPublish: true,
    publishFirstPartNow: true,
    privacyStatus,
    onProgress: (pct, msg) => {
      console.log(`[Omni Story Agent: ${pct}%] ${msg}`);
    },
  });

  if (result.success) {
    console.log("\n==================================================================");
    console.log("🎉 5-6 MIN MASTER STORY & EPISODIC SHORTS GENERATED SUCCESSFULLY!");
    console.log("==================================================================");
    console.log(`🎬 Master Episode: ${result.masterVideo.outputPath}`);
    console.log(`⏱️ Master Duration: ${(result.masterVideo.durationSec / 60).toFixed(1)} minutes (${result.masterVideo.durationSec.toFixed(1)}s)`);
    console.log(`🖼️ Master Thumbnail: ${result.masterVideo.thumbnailPath}`);
    if (result.masterVideo.youtubeUrl) {
      console.log(`🌐 Master Episode YouTube Live (PUBLIC): ${result.masterVideo.youtubeUrl}`);
    }
    console.log(`\n📱 Queued Episodic Shorts (${result.shorts.length} parts):`);

    result.shorts.forEach((s) => {
      const timeStr = s.scheduledTime.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      console.log(`   👉 Part ${s.partNumber} (${s.slot}): "${s.title}"`);
      console.log(`      File: ${s.outputPath}`);
      console.log(`      Scheduled: ${timeStr} | Status: ${s.status}${s.youtubeUrl ? ` | Live: ${s.youtubeUrl}` : ""}`);
    });

    console.log("\n🔁 Repeating Cycle: Morning Short (10:00 AM IST) -> Evening Short (5:00 PM IST)");
    console.log("==================================================================");
    process.exit(0);
  } else {
    console.error("\n❌ Omni Story Generation Failed:", result.error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
