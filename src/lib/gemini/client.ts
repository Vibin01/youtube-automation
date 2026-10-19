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
import { getCastSummaryForPrompt, KUTHU_DANCE_SONG } from "../characters/cast";

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
IMPORTANT CHANNEL CONTEXT — HAPPY KUTTU SONG:
This channel features a permanent cast of hilarious animated Tamil comedy characters. ALWAYS use these EXACT characters — no others:
${getCastSummaryForPrompt()}

- Genres: Tamil street comedy, hilarious neighborhood misunderstandings, witty banter, and energetic Kuthu dance breaks.
- Titles: Super catchy Tamil titles with emojis featuring characters (e.g. "அலப்பறை ஆறுமுகம் vs புல்லட் பாலு! 🤣🔥 Scene Senthil Comedy").
- Hook: Natural, fast-paced spoken colloquial Tamil punch dialogue.
- Tags: Always include ["HappyKuttuSong", "TamilComedy", "TamilAnimation", "TamilShorts", "KuthuDance", "TamilCartoon"].
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
== PERMANENT COMEDY CAST (ALWAYS use these characters, never create new ones) ==
${getCastSummaryForPrompt()}

DIALOGUE STYLE RULES:
- Write narration as NATURAL, FAST-PACED, HILARIOUS spoken colloquial Tamil — punchy, lively, dynamic.
- Each character MUST speak in their own iconic voice/personality with their signature catchphrase.
- Format character dialogue as: [செந்தில்]: "என்ட்ரி வேற லெவல்!" or [ஆறுமுகம்]: "இன்டர்நேஷனல் ஸ்டாண்டர்ட் புரோ!"
- Keep sentences short, fast-talking, comedy timing.

VISUAL RULES:
- "visualPrompt": Specify which characters appear by name (e.g. [Characters: senthil, aarumugam, balu]) plus their poses ([Pose: dancing/singing/pointing/thinking/surprised]).
- Set colorful comedy cartoon backgrounds: Soda Mani's tea stall, street corner bench, dusty road, coconut trees.
${
  input.format === "LONG_FORM"
    ? `
STORY STRUCTURE (5-6 minutes):
- Scenes 1-4: The Setup — Scene Senthil, Alappara Aarumugam, or Bullet Balu kick off a hilarious misunderstanding.
- Scenes 5-9: Chaos escalates — Soda Mani spreads gossip, Sombu Sundaram refuses to move, Tension Thangarasu screams apocalypse.
- Scenes 10-14: KUTHU DANCE BREAK (30 seconds) — ALL CHARACTERS break into high-energy KUTHU DANCE!
  Song title: "${KUTHU_DANCE_SONG.title}" (${KUTHU_DANCE_SONG.titleTamil}).
  Dance directions: ${KUTHU_DANCE_SONG.danceDirections.join(" | ")}.
  Dance lyrics (one line per dance scene captionText): ${KUTHU_DANCE_SONG.lyrics.join(" / ")}.
  Mark these scenes with isKuthuDance: true in visualPrompt.
- Scenes 15-18: Climax & Backfire — Anand's master plan backfires, Dhandapani asks for tea money, happy funny resolution!
- Scene 19+: Like & Subscribe CTA with the entire gang celebrating!
`
    : `
30-SECOND SHORT RULES:
- 4 to 5 quick scenes, each under 7 seconds.
- Pick 1-2 characters for a funny moment or energetic dance.
- End with a subscribe CTA scene.
`
}
- "captionText": Short, punchy Tamil phrase (3-5 words) for the speech bubble.
- "description": SEO description in Tamil & English with moral and subscribe CTA.
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
          title: "அலப்பறை ஆறுமுகம் vs புல்லட் பாலு! 🤣🔥 மாஸ் காமெடி | Happy Kuttu Song",
          hook: "இன்டர்நேஷனல் பாஸ் அலப்பறை ஆறுமுகமும், நாயை பார்த்து பயந்த புல்லட் பாலுவும் செஞ்ச வேலை பாருங்க!",
          description: "அலப்பறை ஆறுமுகம் மற்றும் புல்லட் பாலுவின் அதிரடி நகைச்சுவை கலாட்டா!\n\n#HappyKuttuSong #TamilComedy #TamilShorts #AnimationTamil",
          targetAudience: "Tamil comedy and family audience",
          niche: input.niche,
          estimatedDuration: isShorts ? 30 : 330,
          tags: ["HappyKuttuSong", "TamilComedy", "TamilAnimation", "TamilShorts", "KuthuDance"],
        },
        {
          title: "சோடா மணி டீக்கடையில் பிரேக்கிங் நியூஸ்! ☕ டென்ஷன் தங்கராசு அலப்பறை",
          hook: "டீக்கடை சோடா மணியின் 24 மணி நேர பிரேக்கிங் நியூஸும், தங்கராசுவின் உலக அழிவு பயமும்!",
          description: "சோடா மணி டீக்கடையில் நடக்கும் வினோதமான ஊர் வதந்திகள் மற்றும் டென்ஷன் தங்கராசுவின் பீதி!\n\n#HappyKuttuSong #TamilComedy #TamilCartoon",
          targetAudience: "Tamil animation and comedy lovers",
          niche: input.niche,
          estimatedDuration: isShorts ? 30 : 330,
          tags: ["HappyKuttuSong", "TamilComedy", "TamilCartoon", "TamilShorts", "TrendingTamil"],
        },
        {
          title: "தவுலத் தண்டபாணி 1000 கோடி டீல்! 💸 சோம்பு சுந்தரத்தின் தூக்கம்",
          hook: "வெறும் பாக்கெட்டில் 1000 கோடி டீல் பேசும் தண்டபாணியும், 10 அடி நடக்க சோம்பேறித்தனப்படும் சுந்தரமும்!",
          description: "தவுலத் தண்டபாணியின் உலக மகா பிசினஸ் அட்வைஸ் மற்றும் சோம்பு சுந்தரத்தின் அசாத்திய சோம்பல்!\n\n#HappyKuttuSong #TamilComedy #TamilShorts",
          targetAudience: "Tamil youth and families",
          niche: input.niche,
          estimatedDuration: isShorts ? 30 : 330,
          tags: ["HappyKuttuSong", "TamilComedy", "TamilShorts", "TamilAnimation"],
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
      if (isShorts) {
        return {
          title: input.title,
          hook: "[ஆறுமுகம்]: டேய் பாலு! இன்டர்நேஷனல் பாஸ் என்ட்ரி ஆகுறேன், வழி விடு!",
          body: "சீன் செந்தில், அலப்பறை ஆறுமுகம், புல்லட் பாலு மற்றும் டென்ஷன் தங்கராசுவின் அதிரடி காமெடி கலாட்டா! பிடித்திருந்தால் லைக் மற்றும் சப்ஸ்கிரைப் பண்ணுங்க!",
          callToAction: "மேலும் பல அதிரடி நகைச்சுவை காட்சிகளுக்கு Happy Kuttu Song சேனலை சப்ஸ்கிரைப் பண்ணுங்க!",
          description: `${input.title}\n\nஅலப்பறை ஆறுமுகம், புல்லட் பாலு மற்றும் சீன் செந்திலின் அதிரடி காமெடி ஷார்ட்ஸ்!\n\n#HappyKuttuSong #TamilComedy #TamilShorts #Animation`,
          hashtags: ["#HappyKuttuSong", "#TamilComedy", "#TamilShorts", "#Animation"],
          thumbnailIdeas: [
            "Text: அலப்பறை ஆறுமுகம் vs புல்லட் பாலு! 🤣 | Visual: Crown vs Sunglasses",
            "Text: நாய் பயத்தில் பாலு! 🐕 | Visual: Tree climbing panic",
          ],
          scenes: [
            {
              orderIndex: 0,
              narration: "[ஆறுமுகம்]: இன்டர்நேஷனல் பாஸ் அலப்பறை ஆறுமுகம் வரேன், எல்லாரும் அட்டென்ஷன்ல நில்லுங்க!",
              visualPrompt: "[Characters: aarumugam, balu] [Pose: pointing] Soda Mani tea stall background with dramatic entry sparkle",
              captionText: "இன்டர்நேஷனல் பாஸ் அலப்பறை ஆறுமுகம்!",
              duration: 6.0,
            },
            {
              orderIndex: 1,
              narration: "[பாலு]: டேய் ஆறுமுகம்! மாஸ் ஹீரோ புல்லட் பாலு முன்னாடி அலப்பறையா? லெதர் ஜாக்கெட் பவரை காட்டுறேன்!",
              visualPrompt: "[Characters: balu, aarumugam] [Pose: singing] Hot summer sun with aviator sunglasses and leather jacket swagger",
              captionText: "மாஸ் ஹீரோ புல்லட் பாலு!",
              duration: 6.0,
            },
            {
              orderIndex: 2,
              narration: "[குட்டி நாய்]: வௌ வௌ! [பாலு]: ஐயையோ! நாய் வருது! காப்பாத்துங்கடா! [மரத்தில் ஏறுகிறான்]",
              visualPrompt: "[Characters: balu, thangarasu] [Pose: surprised] Balu screaming and climbing a lamp post while puppy wags tail",
              captionText: "ஐயையோ! நாய் வருது! காப்பாத்துங்கடா!",
              duration: 6.0,
            },
            {
              orderIndex: 3,
              narration: "[தங்கராசு]: ஐயையோ! தெரு நாய்க்கு இவ்வளவு பீதியா?! பூகம்பம் வந்துருச்சுடா! எல்லாரும் ஓடுங்க!",
              visualPrompt: "[Characters: thangarasu, aarumugam] [Pose: surprised] Hands on head, steam shooting from ears, panic alert",
              captionText: "பூகம்பம் வந்துருச்சுடா! ஓடுங்க!",
              duration: 6.0,
            },
            {
              orderIndex: 4,
              narration: "[செந்தில்]: என்ட்ரி வேற லெவல்! மறக்காம Happy Kuttu Song சேனலை Subscribe பண்ணுங்க!",
              visualPrompt: "[Characters: senthil, aarumugam] [Pose: dancing] Hero sunglasses, confetti, subscribe button clicking",
              captionText: "Subscribe to Happy Kuttu Song! 🎬",
              duration: 6.0,
            },
          ],
        };
      }

      // Long-form story with Kuthu dance sequence
      return {
        title: input.title,
        hook: "வணக்கம் மக்களே! நம்ம ஊரு டீக்கடையில் இன்னைக்கு அலப்பறை ஆறுமுகமும், புல்லட் பாலுவும் செஞ்ச வேலை என்ன தெரியுமா?",
        body: "ஊர் டீக்கடையில் நடக்கும் வினோதமான நகைச்சுவை சம்பவங்கள், புல்லட் பாலுவின் நாய் பயம், டென்ஷன் தங்கராசுவின் பீதி, மற்றும் அதிரடி குத்து டான்ஸ் கொண்ட முழு நீள காமெடி வீடியோ!",
        callToAction: "இந்த முழு வீடியோ உங்களுக்கு பிடித்திருந்தால் மறக்காமல் Like செய்து Happy Kuttu Song சேனலை Subscribe பண்ணுங்க!",
        description: `${input.title}\n\nநம்ம ஊரு கேங் செந்தில், ஆறுமுகம், பாலு, மணி, சுந்தரம், தங்கராசு, தண்டபாணி எல்லாரும் சேர்ந்து போடும் அதிரடி குத்து ஆட்டம்!\n\n#HappyKuttuSong #TamilComedy #KuthuDance #TamilCartoon`,
        hashtags: ["#HappyKuttuSong", "#TamilComedy", "#KuthuDance", "#TamilCartoon", "#TamilShorts"],
        thumbnailIdeas: [
          "Text: டீக்கடை கலாட்டா! ☕🔥 | Visual: Soda Mani pouring tea while gang panics",
          "Text: வேற லெவல் குத்து ஆட்டம்! ⚡ | Visual: All 16 characters dancing on stage",
        ],
        scenes: [
          {
            orderIndex: 0,
            narration: "[செந்தில்]: சீன் செந்தில் என்ட்ரி வேற லெவல்! காத்து அடிக்குது, ஸ்லோ மோஷன்ல வரேன்!",
            visualPrompt: "[Characters: senthil, govind] [Pose: pointing] Slow motion cinematic mass entry with wind blowing hair",
            captionText: "சீன் செந்தில் என்ட்ரி வேற லெவல்!",
            duration: 14.0,
          },
          {
            orderIndex: 1,
            narration: "[சோடா மணி]: வாங்கப்பா வாங்க! இன்னைக்கு நம்ம ஊர்ல என்ன பிரேக்கிங் நியூஸ் தெரியுமா? ஆறுமுகம் புதுசா அலப்பறை ஆரம்பிச்சிருக்கான்!",
            visualPrompt: "[Characters: sodamani, velu] [Pose: singing] Soda Mani tea stall with thick glasses and steaming hot cutting chai",
            captionText: "சோடா மணி டீக்கடை பிரேக்கிங் நியூஸ்!",
            duration: 15.0,
          },
          {
            orderIndex: 2,
            narration: "[ஆறுமுகம்]: டேய் மணி! எனக்கு ஒரு இன்டர்நேஷனல் டீ போடு! அமெரிக்காவுல நான் எப்படி டீ குடிப்பேன் தெரியுமா?",
            visualPrompt: "[Characters: aarumugam, dhandapani] [Pose: pointing] Royal purple blazer, crown badge, dramatic boss gestures",
            captionText: "இன்டர்நேஷனல் டீ போடு மணி!",
            duration: 15.0,
          },
          {
            orderIndex: 3,
            narration: "[தண்டபாணி]: கரெக்டா சொன்ன ஆறுமுகம்! நானும் 500 கோடி போர்ட் மீட்டிங் போறேன்... ஆனா மணி, டீக்கு ஒரு 5 ரூவா சில்லறை தருவியா?",
            visualPrompt: "[Characters: dhandapani, sundaram] [Pose: thinking] Turned inside-out empty wallet showing 0 rupees with royal swagger",
            captionText: "டீக்கு 5 ரூவா சில்லறை தருவியா?",
            duration: 15.0,
          },
          {
            orderIndex: 4,
            narration: "[சுந்தரம்]: 5 ரூவா எடுக்க நான் 10 அடி நடக்கணும்! அதுக்கு பதில் நான் படுத்துக்கிட்டே தூங்குறேன், என்னை எழுப்பாதீங்க!",
            visualPrompt: "[Characters: sundaram, babu] [Pose: thinking] Sombu water tumbler lying out of reach, pillow, sleepy Zzz bubble",
            captionText: "என்னை யாரும் எழுப்பாதீங்க... ரெஸ்ட்!",
            duration: 15.0,
          },
          {
            orderIndex: 5,
            narration: "[பாலு]: லெதர் ஜாக்கெட் போட்டு மாஸ் ஹீரோவா வந்தா, இந்த சுந்தரம் தூங்குறான்! என் புல்லட் ஸ்பீடு உங்களுக்கு தெரியாது!",
            visualPrompt: "[Characters: balu, senthil] [Pose: pointing] Aviator sunglasses, sweat pouring down in heat, heavy leather swagger",
            captionText: "மாஸ் ஹீரோ புல்லட் பாலு என்ட்ரி!",
            duration: 15.0,
          },
          {
            orderIndex: 6,
            narration: "[குட்டி நாய்]: லொள் லொள்! [பாலு]: ஐயோ அம்மா! நாய் துரத்துது! மரத்துல ஏறிட்டேன், காப்பாத்துங்கடா!",
            visualPrompt: "[Characters: balu, thangarasu] [Pose: surprised] Screaming terrified Balu perched on a tree branch",
            captionText: "ஐயோ அம்மா! நாய் துரத்துது!",
            duration: 15.0,
          },
          {
            orderIndex: 7,
            narration: "[தங்கராசு]: நாய் குரைச்சா உலகமே அழியப்போகுதுன்னு அர்த்தம்! பிபி எகிறிடுச்சு! பூமி வெடிக்க போகுது! ஆம்புலன்ஸ் கூப்பிடுங்க!",
            visualPrompt: "[Characters: thangarasu, mohan] [Pose: surprised] Trembling hands on temples, steam shooting from ears, red alert",
            captionText: "பிபி 220! பூமி வெடிக்க போகுது!",
            duration: 15.0,
          },
          {
            orderIndex: 8,
            narration: "[மோகன்]: மைக் மோகன் ரகசியம் சொல்றேன்! எல்லாரும் பயப்படாதீங்க, அது சின்ன குட்டி நாய் தான்! [ஊரே கேட்கும்படி கத்துகிறான்]",
            visualPrompt: "[Characters: mohan, pandi] [Pose: singing] Cupped hands around mouth, vibrating sound waves shaking the shops",
            captionText: "ரகசியம் சொல்றேன்! அது சின்ன நாய் தான்!",
            duration: 15.0,
          },
          {
            orderIndex: 9,
            narration: "[பாண்டி]: அட பயத்தை விடுங்கடா! சூடான பரோட்டாவும் சால்னாவும் கிடைச்சா, நான் எந்த ஆபத்துக்கும் ரெடி!",
            visualPrompt: "[Characters: pandi, anand] [Pose: happy] Round tummy, napkin in collar, daydreaming about hot parotta and salna",
            captionText: "பரோட்டாவும் சால்னாவும் கிடைச்சா ரெடி!",
            duration: 15.0,
          },
          {
            orderIndex: 10,
            narration: "[டான்ஸ் - சீன் செந்தில்]: Scene Senthil slow motion-la vandhan! வேற லெவல் குத்து டான்ஸ் ஆரம்பம்!",
            visualPrompt: "[Characters: senthil, aarumugam] [Pose: dancing] Stage lights, disco background, slow motion swagger dance, isKuthuDance: true",
            captionText: "Scene Senthil slow motion-la vandhan!",
            duration: 7.0,
          },
          {
            orderIndex: 11,
            narration: "[டான்ஸ் - அலப்பறை ஆறுமுகம்]: Alappara Aarumugam international entry pottan! எல்லாரும் அதிரடியா ஆடுங்க!",
            visualPrompt: "[Characters: aarumugam, balu] [Pose: dancing] Royal crown sparkles, boss poses, energetic footwork, isKuthuDance: true",
            captionText: "Alappara Aarumugam international entry pottan!",
            duration: 7.0,
          },
          {
            orderIndex: 12,
            narration: "[டான்ஸ் - புல்லட் பாலு & சோடா மணி]: Bullet Balu marathula aadan! Soda Mani tea glass-oda aatam pottan!",
            visualPrompt: "[Characters: balu, sodamani] [Pose: dancing] Balu swinging from branch, Soda Mani tossing tea glass, isKuthuDance: true",
            captionText: "Soda Mani tea glass-oda aatam pottan!",
            duration: 8.0,
          },
          {
            orderIndex: 13,
            narration: "[டான்ஸ் - சுந்தரம் & தங்கராசு]: Sombu Sundaram rest edukitte aadaan! Tension Thangarasu panic aagi thullinaan!",
            visualPrompt: "[Characters: sundaram, thangarasu] [Pose: dancing] Sundaram waving arms from floor, Thangarasu jumping in panic, isKuthuDance: true",
            captionText: "Ellaarum serntha vera level kuthu aaduvoam!",
            duration: 8.0,
          },
          {
            orderIndex: 14,
            narration: "[ஆனந்த்]: மாஸ்டர் பிளான் ரெடி! இந்த குத்து டான்ஸ் முடிஞ்சதும் பரோட்டா கடைக்கு போகலாம்!",
            visualPrompt: "[Characters: anand, ganesan] [Pose: pointing] Anand showing notebook plan, Ganesan flexing gold chains",
            captionText: "மாஸ்டர் பிளான் ரெடி! பரோட்டா சாப்பிடலாம்!",
            duration: 15.0,
          },
          {
            orderIndex: 15,
            narration: "[கணேசன்]: பரோட்டா கடைக்கா? நான் வரேன்... [அம்மா குரல் கேட்கிறது: கணபதி!] ஐயோ அம்மா கூப்பிடுறாங்க! இதோ வரேன்ம்மா!",
            visualPrompt: "[Characters: ganesan, velu] [Pose: surprised] Tough guy crumbling in fear hearing mother call, running away",
            captionText: "அம்மா கூப்பிடுறாங்க! இதோ வரேன்ம்மா!",
            duration: 15.0,
          },
          {
            orderIndex: 16,
            narration: "[வேலு]: நான் பெஞ்ச்ல உட்கார்ந்து 20 வருஷமா அனுபவத்துல சொல்றேன்... அம்மா பேச்சை கேக்குறவன் என்னைக்குமே கெட்டுப்போக மாட்டான்!",
            visualPrompt: "[Characters: velu, selvam] [Pose: thinking] Folded arms on cement bench, steel tumbler of tea, wise nod",
            captionText: "அனுபவத்துல சொல்றேன்... அம்மா பேச்சு கேளுங்க!",
            duration: 15.0,
          },
          {
            orderIndex: 17,
            narration: "[செல்வம்]: என்ன ஒரு பாசம்! என்ன ஒரு சென்டிமென்ட்! என் கண்ணீரே நிக்க மாட்டேங்குதுடா! [வானத்தை பார்த்து அழுகிறான்]",
            visualPrompt: "[Characters: selvam, chandran] [Pose: surprised] Tears pouring, hand on chest, dramatic 80s film background melody",
            captionText: "என்ன ஒரு பாசம்! என்ன ஒரு சென்டிமென்ட்!",
            duration: 15.0,
          },
          {
            orderIndex: 18,
            narration: "[சந்திரன்]: இந்த சென்டிமென்ட் எல்லாம் என் சூப்பர்பைக் மெஷின் முன்னாடி நிக்காது! சைக்கிள்ல எல்லாரும் ஏறுங்க, டூர் போவோம்!",
            visualPrompt: "[Characters: chandran, senthil] [Pose: pointing] Rusted squeaky bicycle, biker helmet, ringing bell happily",
            captionText: "என் மெஷின்ல ஏறுங்க, டூர் போவோம்!",
            duration: 15.0,
          },
          {
            orderIndex: 19,
            narration: "[அனைவரும்]: இந்த கலாட்டா பிடிச்சிருந்தா உடனே Like பண்ணி, நம்ம Happy Kuttu Song சேனலை Subscribe பண்ணுங்க! அடுத்த வாரம் சந்திப்போம்!",
            visualPrompt: "[Characters: senthil, aarumugam, balu] [Pose: dancing] All characters celebrating with confetti, big red subscribe bell",
            captionText: "Like & Subscribe to Happy Kuttu Song! 🎬✨",
            duration: 15.0,
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
