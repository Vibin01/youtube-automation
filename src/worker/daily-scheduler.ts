import { createAutomationJob, executeAutomationJob } from "../lib/automation/engine";
import { prisma } from "../lib/database/prisma";
import { getAppSettings } from "../lib/database/settings";
import { sliceShortClipFromVideo } from "../lib/video/renderer";
import { getAuthenticatedYouTubeClient } from "../lib/youtube/client";
import path from "path";
import fs from "fs";

/**
 * Ensures a valid connected YouTube channel exists in the database.
 * If running in a headless CI environment (e.g. GitHub Actions), it auto-provisions
 * the channel record using YOUTUBE_REFRESH_TOKEN.
 */
export async function ensureYouTubeChannelReady() {
  let channel = await prisma.youTubeChannel.findFirst({ where: { isConnected: true } });
  if (!channel && process.env.YOUTUBE_REFRESH_TOKEN) {
    console.log("🔑 Initializing YouTube Channel authorization from environment secret...");
    try {
      const auth = await getAuthenticatedYouTubeClient();
      channel = auth.channel;
      console.log(`✅ YouTube Channel connected: ${channel.title} (${channel.channelId})`);
    } catch (authErr) {
      console.error("❌ Failed to authenticate YouTube Channel from secret:", authErr);
    }
  }
  return channel;
}

/**
 * Converts current Date to Indian Standard Time (IST, UTC+5:30).
 */
function getISTDate(date = new Date()): Date {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const istOffset = 5.5 * 3600000; // +5:30
  return new Date(utc + istOffset);
}

export type SlotType = "MORNING_SLOT" | "EVENING_SLOT";

interface NextTriggerInfo {
  targetDate: Date;
  slotType: SlotType;
  isWeeklyFullVideo: boolean;
}

/**
 * Calculates the next trigger time for either the Morning slot (10:10 - 11:00 AM IST)
 * or the Evening slot (4:00 - 5:00 PM IST).
 *
 * Weekly Full Video Day: Sunday (day 0 in getDay()).
 */
export function getNextTriggerInfo(weeklyDay = 0): NextTriggerInfo {
  const nowIST = getISTDate();
  const currentMinutes = nowIST.getHours() * 60 + nowIST.getMinutes();

  // Morning Window: 10:10 AM (610m) to 11:00 AM (660m)
  const randomMorningOffset = Math.floor(Math.random() * 50); // 0 to 49
  const morningTargetMinutes = 610 + randomMorningOffset; // 10:10 to 10:59 AM

  // Evening Window: 4:00 PM (960m) to 5:00 PM (1020m)
  const randomEveningOffset = Math.floor(Math.random() * 60); // 0 to 59
  const eveningTargetMinutes = 960 + randomEveningOffset; // 4:00 to 4:59 PM

  let slotType: SlotType;
  let targetMinutes: number;
  const targetDateIST = new Date(nowIST);

  if (currentMinutes < morningTargetMinutes) {
    // Today's morning slot is upcoming
    slotType = "MORNING_SLOT";
    targetMinutes = morningTargetMinutes;
  } else if (currentMinutes < eveningTargetMinutes) {
    // Today's evening slot is upcoming
    slotType = "EVENING_SLOT";
    targetMinutes = eveningTargetMinutes;
  } else {
    // Both slots passed today, schedule for tomorrow morning
    slotType = "MORNING_SLOT";
    targetMinutes = morningTargetMinutes;
    targetDateIST.setDate(targetDateIST.getDate() + 1);
  }

  const targetHour = Math.floor(targetMinutes / 60);
  const targetMin = targetMinutes % 60;
  targetDateIST.setHours(targetHour, targetMin, 0, 0);

  // Convert IST back to UTC timestamp for setTimeout
  const istOffset = 5.5 * 3600000;
  const targetUtcMs = targetDateIST.getTime() - istOffset;
  const isWeeklyFullVideo = slotType === "MORNING_SLOT" && targetDateIST.getDay() === weeklyDay;

  return {
    targetDate: new Date(targetUtcMs),
    slotType,
    isWeeklyFullVideo,
  };
}

/**
 * Publishes a 5 to 6 minute full Tamil cartoon story video (Horizontal 16:9)
 * featuring Kuttu, engaging storytelling, animal adventures, moral lessons, and musical dance scenes.
 */
export async function runWeeklyFullStoryPublishing(): Promise<void> {
  const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  console.log(`\n================================================================`);
  console.log(`🎬 [Weekly Master Story] Publishing 5 to 6 Min Tamil Cartoon Story`);
  console.log(`⏰ Time (IST): ${timestamp}`);
  console.log(`📐 Format: Horizontal 16:9 | Target: ~330 seconds (5.5 min)`);
  console.log(`💃 Features: Engaging story + Animated Tamil Dance Number`);
  console.log(`================================================================`);

  const channel = await ensureYouTubeChannelReady();
  if (!channel) {
    console.error("❌ No connected YouTube channel found! Please ensure YOUTUBE_REFRESH_TOKEN secret is configured.");
    return;
  }

  const job = await createAutomationJob({
    workflowType: "WEEKLY_FULL_STORY",
    payload: {
      niche: "Tamil Kids Cartoon Stories & Moral Rhymes",
      category: "kids",
      format: "LONG_FORM", // 16:9 horizontal
      targetDurationSec: 330, // 5.5 minutes
      language: "Tamil",
      tone: "Attractive, Entertaining, Playful, Musical with Dance",
      autoApprove: true,
      autoPublish: true,
      privacyStatus: "public",
      madeForKids: false,
      visualStyle: "cartoon",
    },
  });

  console.log(`📦 Created Job ID: ${job.id}`);
  console.log(`⏳ Executing full 5-6 min pipeline...`);

  await executeAutomationJob(job.id);

  const finishedJob = await prisma.automationJob.findUnique({
    where: { id: job.id },
    include: {
      videoProject: {
        include: {
          renders: { where: { status: "COMPLETED" }, orderBy: { createdAt: "desc" }, take: 1 },
          publishingJobs: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });

  const pubJob = finishedJob?.videoProject?.publishingJobs[0];
  const render = finishedJob?.videoProject?.renders[0];

  if (pubJob?.youtubeVideoUrl) {
    console.log(`\n🎉 SUCCESS! 5-6 min full story published publicly!`);
    console.log(`🔗 Video URL: ${pubJob.youtubeVideoUrl}`);
    console.log(`🎬 Title: ${pubJob.title}`);
  }

  // Also slice out a 30s Short from the dance sequence
  if (render?.outputPath && fs.existsSync(render.outputPath)) {
    try {
      const shortsDir = path.resolve(process.cwd(), "./output/shorts");
      fs.mkdirSync(shortsDir, { recursive: true });
      const shortPath = path.join(shortsDir, `kuttu_dance_short_${Date.now()}.mp4`);
      console.log(`✂️ Slicing a 30-second vertical (9:16) Short from dance sequence...`);
      await sliceShortClipFromVideo({
        sourceVideoPath: render.outputPath,
        outputShortPath: shortPath,
        startSec: 90, // around the middle dance sequence
        durationSec: 30,
      });
      console.log(`✅ Extracted 30-second Short saved at: ${shortPath}`);
    } catch (sliceErr) {
      console.warn("Could not slice short clip:", sliceErr);
    }
  }
}

/**
 * Publishes a 30-second vertical (9:16) Tamil cartoon Short.
 * Slot themes:
 * - "MORNING_STORY_HIGHLIGHT": 30s story teaser or mini-episode
 * - "EVENING_DANCE_SHORT": 30s energetic dance and rhyme short with Kuttu
 */
export async function runShortPublishing(themeType: "MORNING_STORY_HIGHLIGHT" | "EVENING_DANCE_SHORT"): Promise<void> {
  const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const isEveningDance = themeType === "EVENING_DANCE_SHORT";

  console.log(`\n================================================================`);
  console.log(`⚡ [Daily Short] Publishing 30-Second Tamil Cartoon Short (${themeType})`);
  console.log(`⏰ Time (IST): ${timestamp}`);
  console.log(`📐 Format: Vertical 9:16 | Target: 30 seconds`);
  console.log(`🌟 Theme: ${isEveningDance ? "Kuttu Dance & Rhyme Celebration 💃" : "Kuttu Morning Story Highlight 📖"}`);
  console.log(`================================================================`);

  const channel = await ensureYouTubeChannelReady();
  if (!channel) {
    console.error("❌ No connected YouTube channel found! Please ensure YOUTUBE_REFRESH_TOKEN secret is configured.");
    return;
  }

  const job = await createAutomationJob({
    workflowType: isEveningDance ? "DAILY_EVENING_DANCE_SHORT" : "DAILY_MORNING_SHORT",
    payload: {
      niche: isEveningDance
        ? "Tamil Kids Cartoon Dance Songs & Energetic Rhymes"
        : "Tamil Kids Cartoon Stories & Moral Highlights",
      category: "kids",
      format: "SHORTS", // 9:16 vertical
      targetDurationSec: 30, // 30 seconds
      language: "Tamil",
      tone: isEveningDance ? "High Energy, Joyful, Musical Dance, Bouncy" : "Engaging, Playful, Quick Twist",
      autoApprove: true,
      autoPublish: true,
      privacyStatus: "public",
      madeForKids: false,
      visualStyle: "cartoon",
    },
  });

  console.log(`📦 Created Job ID: ${job.id}`);
  console.log(`⏳ Executing 30s Short pipeline...`);

  await executeAutomationJob(job.id);

  const finishedJob = await prisma.automationJob.findUnique({
    where: { id: job.id },
    include: {
      videoProject: {
        include: {
          publishingJobs: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });

  const pubJob = finishedJob?.videoProject?.publishingJobs[0];
  if (pubJob?.youtubeVideoUrl) {
    console.log(`\n🎉 SUCCESS! 30-second Short published publicly!`);
    console.log(`🔗 Video URL: ${pubJob.youtubeVideoUrl}`);
    console.log(`🎬 Title: ${pubJob.title}`);
  }
}

/**
 * Main 24/7 continuous autonomous scheduler loop.
 */
export async function startMultiSlotScheduler(): Promise<void> {
  console.log("================================================================");
  console.log("🌟 AUTO-TUBE AI: Autonomous Dual-Slot Tamil Cartoon Scheduler");
  console.log("📅 Slot 1 (Morning): 10:10 AM – 11:00 AM IST (Weekly 5-6m Story on Sunday / 30s Short Mon-Sat)");
  console.log("📅 Slot 2 (Evening): 4:00 PM – 5:00 PM IST (Daily 30s Dance Short)");
  console.log("🔓 Privacy Visibility: PUBLIC");
  console.log("🎭 Character: Kuttu (Animated Tamil Cartoon)");
  console.log("================================================================");

  // Immediate execution flags for testing
  if (process.argv.includes("--full")) {
    console.log("⚡ Flag --full detected: Immediately generating 5-6 min full story video...");
    await runWeeklyFullStoryPublishing();
    return;
  }

  if (process.argv.includes("--short")) {
    console.log("⚡ Flag --short detected: Immediately generating 30s Short video...");
    await runShortPublishing("EVENING_DANCE_SHORT");
    return;
  }

  if (process.argv.includes("--now") || process.argv.includes("--test")) {
    console.log("⚡ Flag --now detected: Running current slot immediately...");
    const nextInfo = getNextTriggerInfo();
    if (nextInfo.isWeeklyFullVideo) {
      await runWeeklyFullStoryPublishing();
    } else {
      await runShortPublishing(nextInfo.slotType === "EVENING_SLOT" ? "EVENING_DANCE_SHORT" : "MORNING_STORY_HIGHLIGHT");
    }
    return;
  }

  // Continuous loop
  while (true) {
    const nextInfo = getNextTriggerInfo();
    const nextTriggerIST = nextInfo.targetDate.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const delayMs = nextInfo.targetDate.getTime() - Date.now();
    const delayHours = (delayMs / (1000 * 60 * 60)).toFixed(2);

    console.log(`\n⏳ Next Scheduled Post:`);
    console.log(`   👉 Slot: ${nextInfo.slotType}`);
    console.log(`   👉 Type: ${nextInfo.isWeeklyFullVideo ? "🌟 5 to 6 Min Full Master Story" : "⚡ 30-Second Short"}`);
    console.log(`   👉 IST Time: ${nextTriggerIST}`);
    console.log(`   👉 Sleeping for: ${delayHours} hours (${Math.round(delayMs / 60000)} minutes)\n`);

    // Sleep until scheduled target time
    await new Promise((res) => setTimeout(res, Math.max(1000, delayMs)));

    // Execute scheduled publishing slot
    if (nextInfo.isWeeklyFullVideo) {
      await runWeeklyFullStoryPublishing();
    } else if (nextInfo.slotType === "EVENING_SLOT") {
      await runShortPublishing("EVENING_DANCE_SHORT");
    } else {
      await runShortPublishing("MORNING_STORY_HIGHLIGHT");
    }

    // Buffer before next scheduling calculation
    await new Promise((res) => setTimeout(res, 60000));
  }
}

// Standalone execution entrypoint
startMultiSlotScheduler().catch((err) => {
  console.error("Fatal scheduler error:", err);
  process.exit(1);
});
