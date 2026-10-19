import { GoogleGenAI } from "@google/genai";
import { getAppSettings } from "../database/settings";
import {
  IdeaGenerationInput,
  GeneratedIdeasListSchema,
  GeneratedIdeaItem,
  ScriptGenerationInput,
  GeneratedScriptSchema,
  GeneratedScriptOutput,
} from "../validation";

/**
 * Returns an instance of GoogleGenAI using the active API key.
 * Throws a user-friendly error if API key is missing.
 */
export async function getGeminiClient() {
  const settings = await getAppSettings();
  const apiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    return { client: null, model: settings.geminiModel, hasKey: false };
  }

  const client = new GoogleGenAI({ apiKey });
  return { client, model: settings.geminiModel || "gemini-2.5-flash", hasKey: true };
}

/**
 * Generates video ideas based on niche, category, format, and language.
 */
export async function generateContentIdeas(
  input: IdeaGenerationInput
): Promise<GeneratedIdeaItem[]> {
  const { client, model, hasKey } = await getGeminiClient();

  if (!hasKey || !client) {
    return generateFallbackIdeas(input);
  }

  const prompt = `You are a viral YouTube content strategist and algorithm expert.
Generate ${input.count} high-performing, high-CTR YouTube video ideas for:
- Format: ${input.format === "SHORTS" ? "YouTube Shorts (under 60s, vertical 9:16)" : "Long-form Video (16:9)"}
- Language: ${input.language}
- Niche: ${input.niche}
- Category: ${input.category}
- Target Audience: ${input.targetAudience}
- Tone: ${input.tone}

Respond ONLY with a JSON object in this exact schema:
{
  "ideas": [
    {
      "title": "Compelling Title with Curiosity Gap",
      "hook": "First 3-second visual and spoken hook to stop scrolling",
      "description": "Brief description of why this will perform well",
      "targetAudience": "${input.targetAudience}",
      "niche": "${input.niche}",
      "estimatedDuration": ${input.format === "SHORTS" ? 45 : 480},
      "tags": ["tag1", "tag2", "tag3"]
    }
  ]
}`;

  try {
    const response = await client.models.generateContent({
      model: model || "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text?.trim() || "{}";
    const parsed = JSON.parse(rawText);
    const validated = GeneratedIdeasListSchema.safeParse(parsed);

    if (validated.success) {
      return validated.data.ideas;
    }

    console.warn("Gemini response did not strictly match schema, falling back to sanitization:", validated.error);
    return generateFallbackIdeas(input);
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error("Gemini API Error in generateContentIdeas:", err.message || error);
    // If quota limit or API key error, provide fallback ideas and warn
    if (err.status === 429 || err.message?.includes("quota") || err.message?.includes("API key")) {
      console.warn("Using high quality fallback ideas due to API restriction:", err.message);
      return generateFallbackIdeas(input);
    }
    throw new Error(`Failed to generate ideas: ${err.message || "Unknown error"}`);
  }
}

/**
 * Generates a full scene-by-scene script with visual instructions, captions, and metadata.
 */
export async function generateFullScript(
  input: ScriptGenerationInput
): Promise<GeneratedScriptOutput> {
  const { client, model, hasKey } = await getGeminiClient();

  if (!hasKey || !client) {
    return generateFallbackScript(input);
  }

  const targetDuration = input.targetDurationSec || (input.format === "SHORTS" ? 50 : 300);
  const estimatedScenesCount = Math.max(3, Math.round(targetDuration / (input.format === "SHORTS" ? 6 : 15)));

  const prompt = `You are a master YouTube scriptwriter and video director.
Write a complete, highly engaging video production package for:
- Title: ${input.title}
- Hook Idea: ${input.hook || "Create an irresistible hook"}
- Format: ${input.format} (${input.format === "SHORTS" ? "Vertical 9:16 Shorts" : "Horizontal 16:9 Long-form"})
- Language: ${input.language} (${input.language === "Tamil" ? "Write spoken narration in authentic Tamil script or clear Tanglish/Tamil, with matching English visual instructions" : "English"})
- Niche: ${input.niche}
- Category: ${input.category}
- Tone: ${input.tone}
- Target Duration: ${targetDuration} seconds
- Additional Instructions: ${input.additionalInstructions || "Keep pacing fast, high retention, no fluff."}

Divide the script into approximately ${estimatedScenesCount} distinct scenes.
For each scene, provide:
1. "orderIndex": sequential 0, 1, 2...
2. "narration": exactly what the voiceover says for this scene.
3. "visualPrompt": detailed description of what should be displayed on screen (images, graphic overlays, motions).
4. "captionText": short punchy subtitles to appear on screen during this scene.
5. "duration": duration in seconds (e.g. 5.0 to 10.0 seconds). Sum of scene durations must equal approximately ${targetDuration} seconds.

Respond ONLY with a JSON object in this exact schema:
{
  "title": "Optimized YouTube Title (under 80 chars)",
  "hook": "Irresistible 3-second opening hook",
  "body": "Full text of the entire script combined",
  "callToAction": "Natural CTA (subscribe, share, comment)",
  "description": "SEO optimized YouTube description with timestamps, summary, and links",
  "hashtags": ["#tag1", "#tag2", "#shorts"],
  "thumbnailIdeas": [
    "Text Overlay: BIG MISTAKE! | Visual: Shocked face pointing at glowing screen",
    "Text Overlay: 10X SECRET | Visual: High contrast split screen"
  ],
  "scenes": [
    {
      "orderIndex": 0,
      "narration": "Spoken words for scene 0",
      "visualPrompt": "Cinematic visual description for scene 0",
      "captionText": "On-screen caption for scene 0",
      "duration": 6.0
    }
  ]
}`;

  try {
    const response = await client.models.generateContent({
      model: model || "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text?.trim() || "{}";
    const parsed = JSON.parse(rawText);
    const validated = GeneratedScriptSchema.safeParse(parsed);

    if (validated.success) {
      return validated.data;
    }

    console.warn("Script schema parse failed, falling back to structured fallback:", validated.error);
    return generateFallbackScript(input);
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error("Gemini API Error in generateFullScript:", err.message || error);
    if (err.status === 429 || err.message?.includes("quota") || err.message?.includes("API key")) {
      console.warn("Using high quality fallback script due to API restriction:", err.message);
      return generateFallbackScript(input);
    }
    throw new Error(`Failed to generate script: ${err.message || "Unknown error"}`);
  }
}

/**
 * Fallback ideas generator when API key is missing or quota is restricted.
 */
function generateFallbackIdeas(input: IdeaGenerationInput): GeneratedIdeaItem[] {
  const isTamil = input.language === "Tamil";
  const isShorts = input.format === "SHORTS";

  if (isTamil) {
    return [
      {
        title: isShorts ? "இதை தெரிஞ்சிக்காம AI Use பண்ணாதீங்க! 😱" : "2026-ல் AI கொண்டு மாதம் ₹50,000 சம்பாதிக்க 5 வழிகள்",
        hook: isShorts ? "Stop! நீங்கள் செய்யும் இந்த ஒரு தப்பு உங்கள் போனை Slow பண்ணும்!" : "இன்று நாம் பார்க்கப்போவது உலகத்தையே மாற்றும் 5 AI கருவிகள்.",
        description: "Explore the newest practical AI productivity workflows designed specifically for Tamil tech audiences.",
        targetAudience: input.targetAudience || "Tamil youth and tech enthusiasts",
        niche: input.niche,
        estimatedDuration: isShorts ? 45 : 480,
        tags: ["TamilTech", "AIinTamil", "TamilShorts", "TechTamil"],
      },
      {
        title: isShorts ? "Google Maps-ல் இந்த Secret Trick தெரியுமா? 📍" : "YouTube சேனல் ஆரம்பிக்க சிறந்த 5 நிபுணத்துவ வழிகள்",
        hook: "இந்த சின்ன Settings மாத்துனா போதும், உங்கள் அனுபவமே மாறும்!",
        description: "Engaging step-by-step tech tips that drive massive saves and shares.",
        targetAudience: input.targetAudience || "General Tamil audience",
        niche: input.niche,
        estimatedDuration: isShorts ? 40 : 360,
        tags: ["TamilTips", "MobileTricks", "TamilTrending"],
      },
      {
        title: isShorts ? "ChatGPT-யை விட 10 மடங்கு வேகமான புது AI Tool! 🚀" : "தொழில்நுட்பத்தில் அடுத்த 5 ஆண்டுகளில் என்ன நடக்கும்?",
        hook: "இது உண்மையிலேயே இலவசமா? இதை பாருங்க!",
        description: "Showcasing cutting-edge free tools that save hours of manual work.",
        targetAudience: input.targetAudience || "Students and freelancers",
        niche: input.niche,
        estimatedDuration: isShorts ? 50 : 420,
        tags: ["AITamil", "FreeTools", "TamilGuide"],
      },
    ];
  }

  return [
    {
      title: isShorts ? "Stop Scrolling! 3 AI Tools That Feel Illegal to Know 🤖" : "The Complete Guide to Automating Your Workflow with Free AI in 2026",
      hook: isShorts ? "Do not close this video if you want to save 20 hours this week." : "What if you could automate 80% of your daily repetitive tasks starting today?",
      description: "A fast-paced, actionable breakdown of high-utility free AI applications for creators and students.",
      targetAudience: input.targetAudience || "Creators and tech enthusiasts",
      niche: input.niche,
      estimatedDuration: isShorts ? 45 : 450,
      tags: ["AIAutomation", "TechHacks", "Productivity", "Shorts"],
    },
    {
      title: isShorts ? "The 1 Habit That Made Me 10x More Productive ⚡" : "How to Build a Consistent Content Engine Without Burnout",
      hook: isShorts ? "I bet you have never seen this secret feature on your computer." : "Consistency is not about motivation; it is about having a reliable system.",
      description: "Proven principles for compounding output while staying energized.",
      targetAudience: input.targetAudience || "Ambitious self-improvers",
      niche: input.niche,
      estimatedDuration: isShorts ? 40 : 540,
      tags: ["ProductivityTips", "GrowthMindset", "LifeHacks"],
    },
    {
      title: isShorts ? "5 Free Websites That Will Save You Thousands of Dollars 💰" : "Top 10 Open Source Software You Should Be Using Right Now",
      hook: "Number 3 is so good, big companies do not want you to know it.",
      description: "Highlighting exceptional open source and zero-cost solutions replacing expensive subscriptions.",
      targetAudience: input.targetAudience || "Students, founders, and creators",
      niche: input.niche,
      estimatedDuration: isShorts ? 55 : 600,
      tags: ["FreeTools", "OpenSource", "MoneySavingHacks"],
    },
  ];
}

/**
 * Fallback script generator with rich scene breakdown.
 */
function generateFallbackScript(input: ScriptGenerationInput): GeneratedScriptOutput {
  const isTamil = input.language === "Tamil";
  const isShorts = input.format === "SHORTS";

  if (isTamil) {
    return {
      title: input.title,
      hook: isShorts ? "நில்லுங்கள்! இதை தெரிஞ்சிக்காம AI-யை தொடாதீங்க!" : "வணக்கம் நண்பர்களே! இந்த வீடியோவில் மிக முக்கியமான 3 விஷயங்களை பார்க்கப்போகிறோம்.",
      body: "AI தொழில்நுட்பம் இப்போது நம் வேலைகளை எவ்வளவு எளிதாக்கியுள்ளது தெரியுமா? சரியான கருவிகளை பயன்படுத்தினால் எந்த கட்டணமும் இல்லாமல் நாம் பெரிய வேலைகளை நிமிடங்களில் செய்து முடிக்கலாம். வீடியோ பிடித்திருந்தால் மறக்காமல் Like மற்றும் Subscribe செய்யுங்கள்!",
      callToAction: "இந்த தகவல் உங்களுக்கு பிடித்திருந்தால் இப்போதே Subscribe பண்ணி Notification-ஐ On செய்யுங்கள்!",
      description: `${input.title}\n\nஇந்த வீடியோவில் பயனுள்ள தகவல்களையும் தொழில்நுட்ப குறிப்புகளையும் விரிவாக விளக்கியுள்ளோம்.\n\n#TamilTech #AIinTamil #TechTamil #Shorts`,
      hashtags: ["#TamilTech", "#AIinTamil", "#Shorts", "#TechTamil"],
      thumbnailIdeas: [
        "Text: அதிர்ச்சி தரும் AI! | Visual: Glowing futuristic brain icon with bold yellow text",
        "Text: இதை செய்யாதீங்க! | Visual: Red warning badge with laptop screen",
      ],
      scenes: [
        {
          orderIndex: 0,
          narration: "நில்லுங்கள்! இந்த ஒரு ரகசிய AI முறையை தெரிஞ்சிக்காம இனி வீடியோ பார்க்காதீங்க!",
          visualPrompt: "Vibrant high-contrast title card with warning icon and bold futuristic typography",
          captionText: "நில்லுங்கள்! இந்த ஒரு ரகசிய AI முறை!",
          duration: 6.0,
        },
        {
          orderIndex: 1,
          narration: "முதல் விஷயம்: எந்த காசும் கொடுக்காமல் உங்களால் மிகச்சிறந்த முடிவுகளை எடுக்க முடியும்.",
          visualPrompt: "Dynamic dashboard animation showing productivity surge with glowing metrics",
          captionText: "முதல் விஷயம்: 100% இலவச கருவிகள்!",
          duration: 7.0,
        },
        {
          orderIndex: 2,
          narration: "இரண்டாவது விஷயம்: உங்கள் நேரத்தை சேமிக்க சரியான ஆட்டோமேஷன் அமைப்பை பயன்படுத்துங்கள்.",
          visualPrompt: "Clean minimal gear animation rotating smoothly with neon accents",
          captionText: "இரண்டாவது விஷயம்: நேரத்தை சேமிக்க ஆட்டோமேஷன்!",
          duration: 7.0,
        },
        {
          orderIndex: 3,
          narration: "இந்த தகவல் பிடித்திருந்தால் உடனே கீழே உள்ள Subscribe பட்டனை அழுத்துங்கள்!",
          visualPrompt: "Bright subscribe button animation with bell icon clicking and glowing confetti",
          captionText: "Subscribe செய்யுங்கள்!",
          duration: 5.0,
        },
      ],
    };
  }

  return {
    title: input.title,
    hook: isShorts ? "Stop scrolling right now! You need to see this." : "Welcome back! Today we are revealing the ultimate automation blueprint.",
    body: "Most people spend hours doing repetitive work that could easily be done in seconds. By using the right free tools, you can automate your research, scripting, and media production with zero upfront cost. If you find this valuable, hit that subscribe button right now!",
    callToAction: "Smash that subscribe button and leave a comment with what you want automated next!",
    description: `${input.title}\n\nIn this video, we break down actionable strategies to streamline your creation process using free and open tools.\n\n📌 Subscribe for weekly automation guides.\n\n#AIAutomation #Productivity #TechTips #Shorts`,
    hashtags: ["#AIAutomation", "#Productivity", "#TechTips", "#Shorts"],
    thumbnailIdeas: [
      "Text: STOP DOING THIS! | Visual: Red X over clock and green checkmark over robot icon",
      "Text: 10X FASTER | Visual: High-tech rocket launching with neon blue accents",
    ],
    scenes: [
      {
        orderIndex: 0,
        narration: "Stop scrolling right now! If you are not using AI automation, you are falling behind.",
        visualPrompt: "Vibrant high-energy hook with bold typography and digital HUD overlay",
        captionText: "Stop scrolling right now!",
        duration: 5.0,
      },
      {
        orderIndex: 1,
        narration: "First, you do not need expensive software. Free and open-source tools can do ninety percent of the work.",
        visualPrompt: "Modern SaaS dashboard view displaying smooth metrics and clean graphs",
        captionText: "Rule 1: Use 100% free open-source tools",
        duration: 6.0,
      },
      {
        orderIndex: 2,
        narration: "Second, automate your workflow end-to-end so your content engine runs while you sleep.",
        visualPrompt: "Abstract 3D network nodes connecting smoothly with radiant glowing pulses",
        captionText: "Rule 2: Automate your workflow end-to-end",
        duration: 6.0,
      },
      {
        orderIndex: 3,
        narration: "Make sure to hit subscribe so you never miss our newest automation strategies!",
        visualPrompt: "Polished bell notification and subscribe badge with subtle particle effects",
        captionText: "Subscribe for more automation secrets!",
        duration: 5.0,
      },
    ],
  };
}
