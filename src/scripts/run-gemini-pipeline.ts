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
import { CAST } from "../lib/characters/cast";

async function main() {
  console.log("==================================================================");
  console.log("🎬 AutoTube AI — 5-6 Minute Comedy Video Pipeline");
  console.log("STEP 1: Generate 5-6 min Comedy Screenplay");
  console.log("STEP 2: Pick Characters Relevant to the Comedy Script");
  console.log("STEP 3: Generate Video Clips via Gemini & Store Them");
  console.log("STEP 4: Merge Clips with Audio & Sound Effects");
  console.log("STEP 5: Publish Final Video to YouTube (PUBLIC)");
  console.log("==================================================================");

  // Command-line arguments:
  // npm run agent:gemini [characterId] [topicOrStory] [format] [privacy] [durationSec]
  const rawChar = (process.argv[2] || "auto").toLowerCase();
  const topicOrStory = process.argv[3] || "டீக்கடை பஞ்சாயத்து: ஆனந்த், பாலு & ஆறுமுகம் மகா காமெடி அலப்பறை 🤣🔥";
  const format = ((process.argv[4] as string)?.toUpperCase() === "SHORTS" ? "SHORTS" : "LONG_FORM") as "SHORTS" | "LONG_FORM";
  const privacyStatus = (process.argv[5] as "public" | "unlisted" | "private") || "public";
  const targetDurationSec = process.argv[6] ? parseInt(process.argv[6], 10) : (format === "LONG_FORM" ? 330 : 45);

  const isAutoChar = rawChar === "auto";
  const selectedChar = isAutoChar ? null : (CAST.find((c) => c.id.toLowerCase() === rawChar) || CAST[0]);

  console.log(`\n------------------------------------------------------------------`);
  console.log(`📌 STEP 1: Generate 5-6 Min Comedy Script`);
  console.log(`------------------------------------------------------------------`);
  console.log(`📖 Comedy Topic: "${topicOrStory}"`);
  console.log(`⏱️ Target Duration: ${targetDurationSec} seconds (~${(targetDurationSec / 60).toFixed(1)} mins)`);
  console.log(`📱 Format: ${format} (${format === "LONG_FORM" ? "16:9 Cinematic Widescreen" : "9:16 Vertical Shorts"})`);
  console.log(`🌐 YouTube Privacy: ${privacyStatus.toUpperCase()}`);

  console.log(`\n------------------------------------------------------------------`);
  console.log(`🎭 STEP 2: Character Assignment`);
  console.log(`------------------------------------------------------------------`);
  if (isAutoChar) {
    console.log(`✨ Dynamic Multi-Cast Selection: Characters will be automatically picked per scene based on the screenplay dialogue!`);
    console.log(`   Cast Pool: ${CAST.map((c) => c.name).slice(0, 8).join(", ")} and more.`);
  } else if (selectedChar) {
    console.log(`🎭 Lead Character: ${selectedChar.name} (${selectedChar.id}) - ${selectedChar.role}`);
  }

  console.log(`\n------------------------------------------------------------------`);
  console.log(`🎬 STEP 3 & 4: Generate Video Clips -> Download & Merge`);
  console.log(`------------------------------------------------------------------`);

  const isFullScript = topicOrStory.includes("\n") || topicOrStory.length > 80;

  const result = await runAutonomousVideoAgent({
    topic: isFullScript ? "டீக்கடை மகா காமெடி நாடகம்" : topicOrStory,
    scriptText: isFullScript ? topicOrStory : undefined,
    format,
    targetDurationSec,
    language: "Tamil",
    videoProvider: "gemini_browser",
    characterId: isAutoChar ? "auto" : selectedChar?.id,
    autoPublish: true,
    privacyStatus,
    onProgress: (pct, msg) => {
      let stepTag = "STEP 3";
      if (pct < 25) stepTag = "STEP 1 & 2";
      else if (pct < 70) stepTag = "STEP 3 (Generate & Store)";
      else if (pct < 90) stepTag = "STEP 4 (Merge & Render)";
      else stepTag = "STEP 5 (Publish)";
      console.log(`[${stepTag} | ${pct}%] ${msg}`);
    },
  });

  if (result.success) {
    console.log(`\n------------------------------------------------------------------`);
    console.log(`📢 STEP 5: Published to YouTube (PUBLIC)`);
    console.log(`------------------------------------------------------------------`);
    console.log(`🎉 Pipeline completed successfully!`);
    console.log(`📁 Final Merged Video: ${result.videoPath}`);
    console.log(`🖼️ High-CTR Thumbnail: ${result.thumbnailPath}`);
    console.log(`⏱️ Duration: ${result.durationSec.toFixed(1)}s (~${(result.durationSec / 60).toFixed(1)} mins)`);
    if (result.youtubeUrl) {
      console.log(`🌐 YouTube Live URL (PUBLIC): ${result.youtubeUrl}`);
    } else {
      console.log(`ℹ️ Video saved and ready for YouTube upload.`);
    }
    console.log("==================================================================");
    process.exit(0);
  } else {
    console.error("\n❌ Pipeline Failed:", result.error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error running pipeline:", err);
  process.exit(1);
});
