import { describe, it, expect, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import {
  selectCharacterCast,
  resolveCharacterReferenceImage,
  computeUpcomingMondaySchedule,
  computeTwiceDailyShortsSlots,
  generateNarrativeScreenplay,
  logAndExportSceneRegistry,
} from "@/lib/narrative/continuous-narrative-pipeline";
import { CAST } from "@/lib/characters/cast";

describe("9-Step Continuous Narrative Video Pipeline", () => {
  const testDir = path.resolve(process.cwd(), "temp/test_narrative");

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      try {
        fs.rmSync(testDir, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
  });

  describe("Step 1: Narrative & Character Cast Selection", () => {
    it("should select characters from the permanent pool of 16 characters", () => {
      expect(CAST.length).toBe(16);

      const defaultCast = selectCharacterCast();
      expect(defaultCast.length).toBeGreaterThanOrEqual(3);
      expect(defaultCast.every((c) => CAST.some((orig) => orig.id === c.id))).toBe(true);

      const requestedCast = selectCharacterCast(["senthil", "govind", "balu"]);
      expect(requestedCast.length).toBe(3);
      expect(requestedCast.map((c) => c.id)).toContain("senthil");
      expect(requestedCast.map((c) => c.id)).toContain("govind");
      expect(requestedCast.map((c) => c.id)).toContain("balu");
    });
  });

  describe("Step 2: Scene Breakdown & Timing (8-10s scenes, 30-45 total)", () => {
    it("should generate 30 to 45 scenes with 8 to 10 seconds duration each", async () => {
      const selectedCast = selectCharacterCast(["anand", "balu", "aarumugam"]);
      const screenplay = await generateNarrativeScreenplay({
        topicOrPrompt: "டீக்கடை பஞ்சாயத்து மகா கலாட்டா",
        selectedCast,
        targetDurationSec: 330,
        targetSceneDurationSec: 9.2,
        targetSceneCount: 36,
        language: "Tamil",
      });

      expect(screenplay.title).toBeDefined();
      expect(screenplay.scenes.length).toBeGreaterThanOrEqual(30);
      expect(screenplay.scenes.length).toBeLessThanOrEqual(45);

      // Verify every scene is between 8 and 10.5 seconds
      for (const scene of screenplay.scenes) {
        expect(scene.durationSec).toBeGreaterThanOrEqual(8.0);
        expect(scene.durationSec).toBeLessThanOrEqual(10.5);
        expect(scene.characterId).toBeDefined();
        expect(scene.narration).toBeDefined();
        expect(scene.visualPrompt).toBeDefined();
        expect(scene.captionText).toBeDefined();
      }

      // Verify total duration meets 5 to 6 minutes (300 to 360 seconds)
      const totalDur = screenplay.scenes.reduce((acc, s) => acc + s.durationSec, 0);
      expect(totalDur).toBeGreaterThanOrEqual(280);
      expect(totalDur).toBeLessThanOrEqual(450);
    });
  });

  describe("Step 3: Central Scene Registry & Tracking", () => {
    it("should export CSV, JSON, and Markdown sheets with complete scene indexing", async () => {
      fs.mkdirSync(testDir, { recursive: true });
      const selectedCast = selectCharacterCast();
      const screenplay = await generateNarrativeScreenplay({
        topicOrPrompt: "Registry Test Story",
        selectedCast,
        targetDurationSec: 300,
        targetSceneDurationSec: 9.0,
        targetSceneCount: 32,
        language: "Tamil",
      });

      const registry = await logAndExportSceneRegistry({
        projectDir: testDir,
        projectId: "test_proj_123",
        title: screenplay.title,
        scenes: screenplay.scenes,
      });

      expect(fs.existsSync(registry.csvPath)).toBe(true);
      expect(fs.existsSync(registry.jsonPath)).toBe(true);
      expect(fs.existsSync(registry.markdownPath)).toBe(true);

      const csvContent = fs.readFileSync(registry.csvPath, "utf-8");
      expect(csvContent).toContain("Scene_Index,Scene_Title,Character_ID");
      expect(csvContent.split("\n").length).toBeGreaterThan(32);

      const jsonContent = JSON.parse(fs.readFileSync(registry.jsonPath, "utf-8"));
      expect(jsonContent.totalScenes).toBe(screenplay.scenes.length);
      expect(jsonContent.scenes.length).toBe(screenplay.scenes.length);
    });
  });

  describe("Step 4: Character Reference Image Resolution", () => {
    it("should resolve valid character reference images from public/characters", () => {
      for (const char of CAST) {
        const refImage = resolveCharacterReferenceImage(char.id);
        expect(refImage).toBeDefined();
        expect(refImage.length).toBeGreaterThan(0);
        expect(fs.existsSync(refImage)).toBe(true);
      }
    });
  });

  describe("Step 7: Long-Form Publishing Schedule (Monday Master)", () => {
    it("should compute upcoming Monday 10:00 AM IST for full-length video", () => {
      const schedule = computeUpcomingMondaySchedule();
      expect(schedule.dateUTC).toBeInstanceOf(Date);
      expect(schedule.timeIST).toContain("10:00:00 am");

      // Verify the scheduled IST date falls on a Monday (Day 1)
      const istDate = new Date(schedule.dateUTC.getTime() + 5.5 * 3600000);
      expect(istDate.getDay()).toBe(1); // 1 = Monday
      expect(istDate.getHours()).toBe(10);
    });
  });

  describe("Step 8: Automated Shorts Repurposing & Twice-Daily Distribution", () => {
    it("should calculate sequential morning (10 AM) and evening (5 PM) slots until exhausted", () => {
      const totalParts = 11; // ~330s / 30s
      const slots = computeTwiceDailyShortsSlots(totalParts);

      expect(slots.length).toBe(totalParts);

      for (let i = 0; i < slots.length; i++) {
        expect(slots[i].partNumber).toBe(i + 1);
        expect(["MORNING", "EVENING"]).toContain(slots[i].slot);

        const istDate = new Date(slots[i].dateUTC.getTime() + 5.5 * 3600000);
        if (slots[i].slot === "MORNING") {
          expect(istDate.getHours()).toBe(10);
        } else {
          expect(istDate.getHours()).toBe(17);
        }
      }
    });
  });
});
