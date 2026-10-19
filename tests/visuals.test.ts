import { describe, it, expect, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { generateSceneImage, generateThumbnail } from "@/lib/video/visuals";

describe("Sharp Visuals and Thumbnail Engine", () => {
  const testDir = path.resolve(process.cwd(), "temp/test_visuals");

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("should generate a 9:16 vertical 1080x1920 scene image for Shorts", async () => {
    const sceneImgPath = path.join(testDir, "scene_shorts.png");
    await generateSceneImage({
      outputPath: sceneImgPath,
      orderIndex: 0,
      totalScenes: 4,
      narration: "Stop scrolling! Here are 3 tools that will change your life.",
      visualPrompt: "Futuristic digital interface glowing cyan",
      captionText: "Stop scrolling!",
      format: "SHORTS",
    });

    expect(fs.existsSync(sceneImgPath)).toBe(true);
    const meta = await sharp(sceneImgPath).metadata();
    expect(meta.width).toBe(1080);
    expect(meta.height).toBe(1920);
    expect(meta.format).toBe("png");
  });

  it("should generate a 16:9 landscape 1920x1080 thumbnail with high CTR styling", async () => {
    const thumbPath = path.join(testDir, "thumbnail_landscape.png");
    await generateThumbnail({
      outputPath: thumbPath,
      title: "HOW I AUTOMATED MY CHANNEL TO $10K/MO",
      hook: "Full breakdown of free tools inside",
      badge: "MUST WATCH",
      format: "LONG_FORM",
    });

    expect(fs.existsSync(thumbPath)).toBe(true);
    const meta = await sharp(thumbPath).metadata();
    expect(meta.width).toBe(1920);
    expect(meta.height).toBe(1080);
  });
});
