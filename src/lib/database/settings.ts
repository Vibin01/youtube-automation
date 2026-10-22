import { prisma } from "./prisma";

export interface SystemSettings {
  geminiApiKey: string;
  geminiModel: string;
  defaultLanguage: "English" | "Tamil";
  defaultVideoFormat: "SHORTS" | "LONG_FORM";
  defaultTone: string;
  defaultNiche: string;
  outputDir: string;
  autoApproveScripts: boolean;
  autoRender: boolean;
  autoPublish: boolean;
  defaultVisibility: "private" | "unlisted" | "public";
  maxRetries: number;
  aiVideoProvider: "gemini_browser" | "replicate" | "luma" | "fal" | "procedural" | "auto";
  replicateApiToken: string;
  replicateModel: string;
  lumaApiKey: string;
  falApiKey: string;
}

export async function getAppSettings(): Promise<SystemSettings> {
  let settings = await prisma.appSettings.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    settings = await prisma.appSettings.create({
      data: {
        id: "default",
        geminiApiKey: process.env.GEMINI_API_KEY || "",
        geminiModel: process.env.GEMINI_MODEL || "gemini-3.8-flash",
        defaultLanguage: "English",
        defaultVideoFormat: "SHORTS",
        defaultTone: "Engaging",
        defaultNiche: "Tech & AI",
        outputDir: process.env.OUTPUT_DIR || "./output",
        autoApproveScripts: false,
        autoRender: false,
        autoPublish: false,
        defaultVisibility: "private",
        maxRetries: 3,
        aiVideoProvider: (process.env.AI_VIDEO_PROVIDER as any) || "procedural",
        replicateApiToken: process.env.REPLICATE_API_TOKEN || "",
        replicateModel: process.env.REPLICATE_MODEL || "minimax/video-01",
        lumaApiKey: process.env.LUMA_API_KEY || "",
        falApiKey: process.env.FAL_KEY || "",
      },
    });
  }

  // Combine database settings with process.env if db value is empty
  return {
    geminiApiKey: settings.geminiApiKey || process.env.GEMINI_API_KEY || "",
    geminiModel: settings.geminiModel || process.env.GEMINI_MODEL || "gemini-3.8-flash",
    defaultLanguage: (settings.defaultLanguage as "English" | "Tamil") || "English",
    defaultVideoFormat: (settings.defaultVideoFormat as "SHORTS" | "LONG_FORM") || "SHORTS",
    defaultTone: settings.defaultTone || "Engaging",
    defaultNiche: settings.defaultNiche || "Tech & AI",
    outputDir: settings.outputDir || process.env.OUTPUT_DIR || "./output",
    autoApproveScripts: settings.autoApproveScripts,
    autoRender: settings.autoRender,
    autoPublish: settings.autoPublish,
    defaultVisibility: (settings.defaultVisibility as "private" | "unlisted" | "public") || "private",
    maxRetries: settings.maxRetries ?? 3,
    aiVideoProvider: ((settings as any).aiVideoProvider || process.env.AI_VIDEO_PROVIDER || "procedural") as any,
    replicateApiToken: (settings as any).replicateApiToken || process.env.REPLICATE_API_TOKEN || "",
    replicateModel: (settings as any).replicateModel || process.env.REPLICATE_MODEL || "minimax/video-01",
    lumaApiKey: (settings as any).lumaApiKey || process.env.LUMA_API_KEY || "",
    falApiKey: (settings as any).falApiKey || process.env.FAL_KEY || "",
  };
}

export async function updateAppSettings(data: Partial<SystemSettings>) {
  return prisma.appSettings.upsert({
    where: { id: "default" },
    update: data,
    create: {
      id: "default",
      ...data,
    },
  });
}
