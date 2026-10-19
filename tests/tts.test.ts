import { describe, it, expect, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import { synthesizeSpeech, getDefaultVoice, VOICES } from "@/lib/video/tts";

describe("Edge-TTS Neural Narration Engine", () => {
  const testOutputDir = path.resolve(process.cwd(), "temp/test_output");

  afterAll(() => {
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  it("should have valid voices defined for English and Tamil", () => {
    expect(VOICES.English.length).toBeGreaterThan(0);
    expect(VOICES.Tamil.length).toBeGreaterThan(0);
    expect(getDefaultVoice("English")).toBe("en-US-ChristopherNeural");
    expect(getDefaultVoice("Tamil")).toBe("ta-IN-PallaviNeural");
  });

  it("should synthesize audio file for English narration", async () => {
    const audioPath = path.join(testOutputDir, "english_test.mp3");
    const result = await synthesizeSpeech({
      text: "Testing zero budget AI YouTube automation voice.",
      outputPath: audioPath,
      language: "English",
    });

    expect(fs.existsSync(audioPath)).toBe(true);
    expect(result.durationSec).toBeGreaterThan(0.5);
    const stat = fs.statSync(audioPath);
    expect(stat.size).toBeGreaterThan(1000);
  });
});
