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
  const rawKey = settings.geminiApiKey || process.env.GEMINI_API_KEY;
  const apiKey = rawKey?.trim().replace(/^["']|["']$/g, "");

  if (!apiKey || apiKey === "") {
    return { client: null, model: settings.geminiModel, hasKey: false };
  }

  const client = new GoogleGenAI({ apiKey });
  return { client, model: settings.geminiModel || "gemini-3.8-flash", hasKey: true };
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

  const isTamilKids =
    input.language === "Tamil" &&
    (input.category === "kids" ||
      input.niche.toLowerCase().includes("kids") ||
      input.niche.toLowerCase().includes("cartoon") ||
      input.niche.toLowerCase().includes("rhyme"));

  const prompt = `You are a viral YouTube content strategist and algorithm expert.
Generate ${input.count} high-performing, high-CTR YouTube video ideas for:
- Format: ${input.format === "SHORTS" ? "YouTube Shorts (under 60s, vertical 9:16)" : "Long-form Video (16:9)"}
- Language: ${input.language}
- Niche: ${input.niche}
- Category: ${input.category}
- Target Audience: ${input.targetAudience}
- Tone: ${input.tone}
${
  isTamilKids
    ? `
IMPORTANT CHANNEL CONTEXT (Happy Kuttu Song):
- This is for the animated Tamil kids cartoon channel "Happy Kuttu Song" starring "Kuttu", a cute and cheerful cartoon kid.
- Topics: Classic Tamil moral stories (பாட்டி சுட்ட வடை, சிங்கமும் சுண்டெலியும், ஆமை முயல், நரி மற்றும் காகம்), fun rhymes, and kid-friendly moral lessons.
- Titles: MUST be engaging, catchy Tamil titles with emojis (e.g. "குட்டி பாப்பா கதை: பாட்டி சுட்ட வடை! 🦊🌟 Kuttu Tamil Cartoon Stories").
- Hook: Natural, sweet spoken Tamil hook (e.g. "வணக்கம் குட்டீஸ்! ஒரு பாட்டி சுட்ட வடை கதையை குட்டு சொல்ல கேட்கலாமா?").
- Tags: Must include ["HappyKuttuSong", "TamilCartoon", "TamilStoriesForKids", "TamilRhymes", "KidsTamil", "MoralStoriesTamil", "Shorts"].
`
    : ""
}

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
      model: model || "gemini-3.8-flash",
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

  const targetDuration = input.targetDurationSec || (input.format === "SHORTS" ? 30 : 330);
  const estimatedScenesCount = Math.max(3, Math.round(targetDuration / (input.format === "SHORTS" ? 6 : 14)));

  const isTamilKids =
    input.language === "Tamil" &&
    (input.category === "kids" ||
      input.niche.toLowerCase().includes("kids") ||
      input.niche.toLowerCase().includes("cartoon") ||
      input.niche.toLowerCase().includes("rhyme"));

  const prompt = `You are a master YouTube scriptwriter and video director.
Write a complete, highly engaging video production package for:
- Title: ${input.title}
- Hook Idea: ${input.hook || "Create an irresistible hook"}
- Format: ${input.format} (${input.format === "SHORTS" ? "Vertical 9:16 Shorts (approx 30 seconds)" : "Horizontal 16:9 Long-form Story (5 to 6 minutes)"})
- Language: ${input.language} (${input.language === "Tamil" ? "Write spoken narration in authentic Tamil script, with matching English visual instructions" : "English"})
- Niche: ${input.niche}
- Category: ${input.category}
- Tone: ${input.tone}
- Target Duration: ${targetDuration} seconds
- Additional Instructions: ${input.additionalInstructions || "Keep pacing fast, high retention, no fluff."}
${
  isTamilKids
    ? `
SPECIAL ANIMATION GUIDELINES FOR "HAPPY KUTTU SONG":
- The video features "Kuttu", a cute and joyful animated cartoon character.
- "narration": MUST be written strictly in sweet, cheerful, rhythmic spoken Tamil script (Edge-TTS friendly).
- "visualPrompt": In each scene, describe Kuttu's pose ([Pose: dancing], [Pose: singing], [Pose: pointing], [Pose: curious]) in a colorful cartoon setting with sunny meadow, rainbow, smiling sun, flowers, or stars.
${
  input.format === "LONG_FORM"
    ? `- 5 TO 6 MINUTE STORY WITH DANCE: Divide into an engaging multi-part story. In the middle (Scenes 8-12), INCLUDE AN ENERGETIC TAMIL DANCE SONG where Kuttu sings and dances ([Pose: dancing]) to rhythmic beats! Ensure the dance sequence and climax can be cut into 30-second Shorts!`
    : `- 30-SECOND DANCE & VIRAL SHORT: Keep duration tightly to 30 seconds (4 to 5 quick scenes). Focus on a high-energy dance moment, cheerful song, or funny cartoon twist that hooks kids immediately!`
}
- "captionText": Short, punchy Tamil phrase (under 5-6 words) for the speech bubble.
- "description": Comprehensive SEO description in Tamil & English with moral takeaway and subscribe CTA for Happy Kuttu Song.
- "hashtags": ["#HappyKuttuSong", "#TamilCartoon", "#TamilStories", "#KidsRhymes", "#TamilShorts"].
`
    : ""
}

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
      model: model || "gemini-3.8-flash",
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
    if (
      input.category === "kids" ||
      input.niche.toLowerCase().includes("kids") ||
      input.niche.toLowerCase().includes("cartoon") ||
      input.niche.toLowerCase().includes("rhyme")
    ) {
      return [
        {
          title: "குட்டி பாப்பா கதை: பாட்டி சுட்ட வடை! 🦊🌟 Happy Kuttu Song",
          hook: "வணக்கம் குட்டீஸ்! ஒரு பாட்டி சுட்ட வடை கதையை குட்டு சொல்ல கேட்கலாமா?",
          description: "குட்டு சொல்லும் பாட்டி சுட்ட வடை கதை! குழந்தைகளுக்கான அழகான தமிழ் கார்ட்டூன் கதை மற்றும் பாட்டு.\n\n#HappyKuttuSong #TamilCartoon #TamilStories #Shorts",
          targetAudience: "Tamil kids and parents",
          niche: input.niche,
          estimatedDuration: isShorts ? 45 : 300,
          tags: ["HappyKuttuSong", "TamilCartoon", "TamilStoriesForKids", "TamilRhymes", "KidsTamil", "MoralStoriesTamil", "Shorts"],
        },
        {
          title: "சிங்கமும் சுண்டெலியும்! 🦁🐭 குட்டுவின் சுட்டி கார்ட்டூன் கதை",
          hook: "ஒரு பெரிய காட்டில் வாழ்ந்த சிங்கமும் சின்ன எலியும் என்ன ஆச்சு தெரியுமா?",
          description: "சிங்கமும் சுண்டெலியும் - ஆபத்தில் உதவிய சுண்டெலியின் நன்னெறி கதை.\n\n#HappyKuttuSong #TamilCartoon #TamilStories #Shorts",
          targetAudience: "Tamil kids and families",
          niche: input.niche,
          estimatedDuration: isShorts ? 45 : 300,
          tags: ["HappyKuttuSong", "TamilCartoon", "TamilStoriesForKids", "MoralStories", "Shorts"],
        },
        {
          title: "நிலா நிலா ஓடி வா! 🌙 குட்டுவுடன் அழகான தமிழ் பாப்பா பாட்டு",
          hook: "வானத்தில் இருக்கும் நிலாவை பார்த்து குட்டு என்ன பாடுறான் தெரியுமா?",
          description: "நிலா நிலா ஓடி வா நில்லாமல் ஓடி வா - குட்டு பாடும் மகிழ்ச்சியான தமிழ் மழலையர் பாடல்.\n\n#HappyKuttuSong #TamilRhymes #KidsTamil #Shorts",
          targetAudience: "Tamil kids and toddlers",
          niche: input.niche,
          estimatedDuration: isShorts ? 45 : 300,
          tags: ["HappyKuttuSong", "TamilRhymes", "TamilCartoon", "KidsSongsTamil", "Shorts"],
        },
      ];
    }

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
    if (
      input.category === "kids" ||
      input.niche.toLowerCase().includes("kids") ||
      input.niche.toLowerCase().includes("cartoon") ||
      input.niche.toLowerCase().includes("rhyme")
    ) {
      return {
        title: input.title,
        hook: "வணக்கம் நண்பர்களே! இன்னைக்கு குட்டுவுடன் ஒரு அருமையான கதை கேட்கலாம்!",
        body: "வணக்கம் நண்பர்களே! இன்னைக்கு நாம் பார்க்கப்போவது ஒரு சுவையான கதை. ஒரு அழகான கிராமத்தில் குட்டு என்ற சுட்டி பையன் இருந்தான். அவன் தினமும் பாடி ஆடி மகிழ்ந்தான். அனைவருக்கும் அன்போடு உதவி செய்து நல்ல நண்பனாக இருந்தான். வீடியோ பிடித்திருந்தால் மறக்காமல் Like மற்றும் Subscribe செய்யுங்கள்!",
        callToAction: "இந்த வீடியோ பிடித்திருந்தால் உடனே Happy Kuttu Song சேனலுக்கு Subscribe பண்ணுங்க குட்டீஸ்!",
        description: `${input.title}\n\nகுட்டு வழங்கும் மகிழ்ச்சியான தமிழ் கார்ட்டூன் கதை & பாடல்.\n\n🔔 Subscribe to Happy Kuttu Song for daily cartoon videos!\n\n#HappyKuttuSong #TamilCartoon #TamilStories #KidsTamil #Shorts`,
        hashtags: ["#HappyKuttuSong", "#TamilCartoon", "#TamilStories", "#KidsTamil", "#Shorts"],
        thumbnailIdeas: [
          "Text: குட்டுவின் கதை! | Visual: Smiling cartoon character Kuttu waving with vibrant rainbow",
          "Text: பாட்டி சுட்ட வடை! | Visual: Kuttu pointing to delicious vadas with sparkles",
        ],
        scenes: [
          {
            orderIndex: 0,
            narration: "வணக்கம் நண்பர்களே! இன்னைக்கு குட்டுவுடன் ஒரு அருமையான கதை கேட்கலாமா?",
            visualPrompt: "[Pose: waving] Kuttu waving happily in sunny green meadow with smiling sun and rainbow",
            captionText: "வணக்கம் நண்பர்களே! 🎈",
            duration: 6.0,
          },
          {
            orderIndex: 1,
            narration: "ஒரு அழகான கிராமத்தில் பாட்டி ஒருவர் சுடச்சுட வடை சுட்டுக்கொண்டு இருந்தார்.",
            visualPrompt: "[Pose: pointing] Kuttu pointing excitedly with bright sparkles around",
            captionText: "பாட்டி சுட்ட வடை! 🌟",
            duration: 6.0,
          },
          {
            orderIndex: 2,
            narration: "அப்போது அங்கே வந்த ஒரு தந்திர நரி அந்த வடையை எப்படியாவது சாப்பிட நினைத்தது.",
            visualPrompt: "[Pose: curious] Kuttu thinking with thought bubble and curious face",
            captionText: "அங்கே வந்த தந்திர நரி! 🦊",
            duration: 6.0,
          },
          {
            orderIndex: 3,
            narration: "ஆனால் புத்திசாலியான காகம் எச்சரிக்கையாக இருந்து நரியிடம் ஏமாறாமல் தப்பியது!",
            visualPrompt: "[Pose: dancing] Kuttu dancing joyfully with musical notes and flowers",
            captionText: "புத்திசாலி காகம்! 🐦",
            duration: 6.0,
          },
          {
            orderIndex: 4,
            narration: "இந்த கதை உங்களுக்கு பிடித்திருந்தால் உடனே Happy Kuttu Song சேனலை Subscribe செய்யுங்கள்!",
            visualPrompt: "[Pose: singing] Kuttu holding golden microphone singing happily with hearts and stars",
            captionText: "Subscribe பண்ணுங்க குட்டீஸ்! 🔔",
            duration: 6.0,
          },
        ],
      };
    }

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
