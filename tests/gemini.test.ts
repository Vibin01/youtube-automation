import { describe, it, expect } from "vitest";
import { generateContentIdeas, generateFullScript } from "@/lib/gemini/client";
import { IdeaGenerationSchema, ScriptGenerationSchema } from "@/lib/validation";

describe("Gemini AI Content Engine", () => {
  it("should validate idea generation input schema correctly", () => {
    const valid = IdeaGenerationSchema.safeParse({
      niche: "Tech AI",
      category: "educational",
      format: "SHORTS",
      language: "English",
      count: 3,
    });
    expect(valid.success).toBe(true);

    const invalid = IdeaGenerationSchema.safeParse({
      niche: "X", // too short
      format: "INVALID_FORMAT",
    });
    expect(invalid.success).toBe(false);
  });

  it("should generate ideas with high quality fallback or API", async () => {
    const ideas = await generateContentIdeas({
      niche: "AI Tools 2026",
      category: "educational",
      format: "SHORTS",
      language: "English",
      targetAudience: "Creators",
      tone: "Punchy",
      count: 2,
    });

    expect(Array.isArray(ideas)).toBe(true);
    expect(ideas.length).toBeGreaterThan(0);
    expect(ideas[0]).toHaveProperty("title");
    expect(ideas[0]).toHaveProperty("hook");
    expect(ideas[0]).toHaveProperty("estimatedDuration");
  });

  it("should generate Tamil content ideas with proper localized tags", async () => {
    const ideas = await generateContentIdeas({
      niche: "Tamil AI Productivity",
      category: "educational",
      format: "SHORTS",
      language: "Tamil",
      targetAudience: "Tamil creators",
      tone: "Engaging",
      count: 2,
    });

    expect(ideas.length).toBeGreaterThan(0);
    expect(ideas[0].title).toBeDefined();
    expect(ideas[0].tags.some((t) => t.toLowerCase().includes("tamil"))).toBe(true);
  });

  it("should generate a complete script package with scene breakdown", async () => {
    const script = await generateFullScript({
      title: "5 AI Secrets for 2026",
      format: "SHORTS",
      language: "English",
      niche: "AI Tools",
      category: "educational",
      targetDurationSec: 45,
      tone: "High Energy",
    });

    expect(script.title).toBeDefined();
    expect(script.hook).toBeDefined();
    expect(script.body).toBeDefined();
    expect(script.callToAction).toBeDefined();
    expect(Array.isArray(script.scenes)).toBe(true);
    expect(script.scenes.length).toBeGreaterThan(1);
    expect(script.scenes[0]).toHaveProperty("narration");
    expect(script.scenes[0]).toHaveProperty("visualPrompt");
  });
});
