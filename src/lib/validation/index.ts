import { z } from "zod";

export const IdeaGenerationSchema = z.object({
  niche: z.string().min(2, "Niche must be at least 2 characters").default("Tech & AI"),
  category: z.enum(["educational", "entertainment", "storytelling", "kids"]).default("educational"),
  format: z.enum(["SHORTS", "LONG_FORM"]).default("SHORTS"),
  language: z.enum(["English", "Tamil"]).default("English"),
  targetAudience: z.string().default("General Audience"),
  tone: z.string().default("Engaging & Punchy"),
  count: z.number().int().min(1).max(10).default(5),
});

export type IdeaGenerationInput = z.infer<typeof IdeaGenerationSchema>;

export const GeneratedIdeaItemSchema = z.object({
  title: z.string().min(3),
  hook: z.string().min(3),
  description: z.string(),
  targetAudience: z.string(),
  niche: z.string(),
  estimatedDuration: z.number().int().positive(),
  tags: z.array(z.string()),
});

export const GeneratedIdeasListSchema = z.object({
  ideas: z.array(GeneratedIdeaItemSchema),
});

export type GeneratedIdeaItem = z.infer<typeof GeneratedIdeaItemSchema>;

export const ScriptGenerationSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  hook: z.string().optional(),
  niche: z.string().default("Tech & AI"),
  format: z.enum(["SHORTS", "LONG_FORM"]).default("SHORTS"),
  language: z.enum(["English", "Tamil"]).default("English"),
  targetDurationSec: z.number().int().min(15).max(1800).default(60),
  category: z.enum(["educational", "entertainment", "storytelling", "kids"]).default("educational"),
  tone: z.string().default("Engaging & Informative"),
  contentIdeaId: z.string().optional(),
  additionalInstructions: z.string().optional(),
});

export type ScriptGenerationInput = z.infer<typeof ScriptGenerationSchema>;

export const SceneSchema = z.object({
  orderIndex: z.number().int().nonnegative(),
  narration: z.string().min(1),
  visualPrompt: z.string().min(1),
  captionText: z.string().default(""),
  duration: z.number().positive().default(5),
});

export const GeneratedScriptSchema = z.object({
  title: z.string().min(3),
  hook: z.string().min(3),
  body: z.string().min(10),
  callToAction: z.string().min(3),
  description: z.string().min(10),
  hashtags: z.array(z.string()),
  thumbnailIdeas: z.array(z.string()),
  scenes: z.array(SceneSchema),
});

export type GeneratedScriptOutput = z.infer<typeof GeneratedScriptSchema>;

export const VideoRenderSchema = z.object({
  videoProjectId: z.string().min(1),
  aspectRatio: z.enum(["9:16", "16:9"]).default("9:16"),
  resolution: z.string().optional(),
  includeSubtitles: z.boolean().default(true),
  voice: z.string().optional(),
});

export type VideoRenderInput = z.infer<typeof VideoRenderSchema>;

export const PublishingInputSchema = z.object({
  videoProjectId: z.string().min(1),
  channelId: z.string().optional(),
  title: z.string().min(3).max(100),
  description: z.string().max(5000),
  tags: z.array(z.string()).default([]),
  privacyStatus: z.enum(["private", "unlisted", "public"]).default("private"),
  scheduledPublishTime: z.string().datetime().optional().nullable(),
  madeForKids: z.boolean().default(false),
  humanApproved: z.boolean().refine((val) => val === true, {
    message: "Human approval is required before uploading or publishing to YouTube.",
  }),
});

export type PublishingInput = z.infer<typeof PublishingInputSchema>;

export const SettingsUpdateSchema = z.object({
  geminiApiKey: z.string().optional(),
  geminiModel: z.string().default("gemini-2.5-flash"),
  defaultLanguage: z.enum(["English", "Tamil"]).default("English"),
  defaultVideoFormat: z.enum(["SHORTS", "LONG_FORM"]).default("SHORTS"),
  defaultTone: z.string().default("Engaging"),
  defaultNiche: z.string().default("Tech & AI"),
  outputDir: z.string().default("./output"),
  autoApproveScripts: z.boolean().default(false),
  autoRender: z.boolean().default(false),
  autoPublish: z.boolean().default(false),
  defaultVisibility: z.enum(["private", "unlisted", "public"]).default("private"),
  maxRetries: z.number().int().min(0).max(10).default(3),
});

export type SettingsUpdateInput = z.infer<typeof SettingsUpdateSchema>;
