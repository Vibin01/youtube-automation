import { prisma } from "../database/prisma";
import { renderVideoProject } from "./renderer";
import { CAST, KUTHU_DANCE_SONG } from "../characters/cast";
import path from "path";
import fs from "fs";

/**
 * Creates and renders a full comedy episode featuring the official 16 characters
 * using their real 3D images and turnaround sheets.
 */
export async function createAndRenderComedyVideo(): Promise<{
  projectId: string;
  videoPath: string;
  thumbnailPath: string;
  durationSec: number;
}> {
  console.log("🎬 Creating brand new Tamil Comedy Episode project...");

  const title = "அலப்பறை ஆறுமுகம் vs புல்லட் பாலு! 🤣🔥 Kuthu Dance Comedy Episode";
  const description =
    "Happy Kuttu Song presents a hilarious comedy episode featuring Alappara Aarumugam, Bullet Balu, Soda Mani, Tension Thangarasu, Aap-adicha Anand, Scene Senthil, and Cycle Chandran! Watch Bullet Balu climb a lamp post when a puppy barks, while Anand's master shortcut plan backfires!";

  // 1. Create VideoProject first
  const project = await prisma.videoProject.create({
    data: {
      title,
      description,
      format: "SHORTS",
      language: "Tamil",
      status: "SCRIPT_READY",
      tags: JSON.stringify([
        "HappyKuttuSong",
        "TamilComedy",
        "AlapparaAarumugam",
        "BulletBalu",
        "SceneSenthil",
        "TamilAnimation",
        "KuthuDance",
        "TamilShorts",
      ]),
    },
  });

  console.log(`✅ Created Video Project: ${project.id} - "${title}"`);

  // 2. Create Script associated with VideoProject
  await prisma.script.create({
    data: {
      videoProjectId: project.id,
      title,
      description,
      body: description,
      hook: "அலப்பறை ஆறுமுகம் 500 கோடி டீல் பேசுறான்... ஆனா டீ குடிக்க 5 ரூபாய் கடன் கேக்குறான்!",
      callToAction: "லைக் பண்ணுங்க, சப்ஸ்கிரைப் பண்ணுங்க! அடுத்த எபிசோட் வேற லெவல்!",
      targetDurationSec: 45,
      isApproved: true,
      hashtags: JSON.stringify(["#HappyKuttuSong", "#TamilComedy", "#TamilShorts", "#KuthuDance"]),
    },
  });

  // 3. Define the Scenes using the 16 characters and their exact quirks
  const scenesData = [
    {
      orderIndex: 0,
      narration: "சோடா மணி டீக்கடை முன்னாடி அலப்பறை ஆறுமுகம் 500 கோடி இன்டர்நேஷனல் டீல் பேசிட்டு இருக்கான்!",
      visualPrompt: "[Characters: aarumugam, sodamani] Outdoor tea stall, Alappara Aarumugam talking like international boss while Soda Mani pours tea",
      captionText: "ஆறுமுகம்: 'இன்டர்நேஷனல் ஸ்டாண்டர்ட் ப்ரோ... டீ-க்கு 5 ரூபா கடன் கொடு!'",
      characterPose: "pointing",
      durationSec: 5,
    },
    {
      orderIndex: 1,
      narration: "அப்போ லெதர் ஜாக்கெட், கூலிங் கிளாஸ் போட்டு மாஸ் ஹீரோவா புல்லட் பாலு என்ட்ரி குடுக்கிறான்!",
      visualPrompt: "[Characters: balu, aarumugam] Bullet Balu arriving in slow motion with heavy sunglasses and leather jacket",
      captionText: "பாலு: 'மாஸ் ஹீரோ புல்லட் பாலுவுக்கு உலகத்துல எவனுக்குமே பயம் இல்லடா!'",
      characterPose: "happy",
      durationSec: 5,
    },
    {
      orderIndex: 2,
      narration: "திடீர்னு ஒரு சின்ன நாய் குட்டி 'லொள்'ன்னு குரைக்க, பாலு அலறி அடிச்சு டீக்கடை போஸ்ட் மேல ஏறிட்டான்!",
      visualPrompt: "[Characters: balu, sodamani] Bullet Balu screaming in terror clinging to a lamp post as tiny puppy looks up",
      captionText: "பாலு: 'ஐயையோ! நாய் வருது! காப்பாத்துங்கடா... நான் மரம் ஏறிட்டேன்!'",
      characterPose: "surprised",
      durationSec: 5,
    },
    {
      orderIndex: 3,
      narration: "ஆப்-அடிச்ச ஆனந்த் 'தி பிக் பிளான்' புளுபிரின்ட் எடுத்துட்டு பாலுவை காப்பாத்த திட்டம் போடுறான்!",
      visualPrompt: "[Characters: anand, balu] Aap-adicha Anand proudly showing his shortcut blueprint plan with pencil behind ear",
      captionText: "ஆனந்த்: 'ஒரு சூப்பர் பிளான் இருக்கு... இந்த வாட்டி பேக்ஃபயர் ஆகாது!'",
      characterPose: "thinking",
      durationSec: 5,
    },
    {
      orderIndex: 4,
      narration: "ஆனந்த் போட்ட பிளான்ல ஸ்பிரிங் பாக்ஸிங் க்ளவுஸ் ஆனந்த் முகத்துலயே படார்னு அடிச்சு பறக்க விட்டுருச்சு!",
      visualPrompt: "[Characters: anand, thangarasu] Anand with stars floating around head as spring contraption hits his head",
      captionText: "ஆனந்த்: 'அடடே... என் பிளான் எனக்கே ஆப் அடிச்சிருச்சே!'",
      characterPose: "surprised",
      durationSec: 5,
    },
    {
      orderIndex: 5,
      narration: "டென்ஷன் தங்கராசு காதுல இருந்து புகை விட்டு, உலகமே அழியப்போகுதுன்னு தலையில அடிச்சு பதறுறான்!",
      visualPrompt: "[Characters: thangarasu, govind] Tension Thangarasu clutching head with steam shooting from ears",
      captionText: "தங்கராசு: 'அய்யய்யோ! பிபி எகிறிடுச்சு! எல்லாரும் ஓடுங்க... அப்போகலிப்ஸ் வந்துருச்சு!'",
      characterPose: "surprised",
      durationSec: 5,
    },
    {
      orderIndex: 6,
      narration: "கொத்தமல்லி தழை வாங்கின சீன் செந்தில் ஸ்லோ மோஷன்ல காத்து பறக்க மாஸா உள்ள நுழையுறான்!",
      visualPrompt: "[Characters: senthil, chandran] Scene Senthil walking in epic slow motion with polythene bag and flying wind hair",
      captionText: "செந்தில்: 'என்ட்ரி வேற லெவல்! கொத்தமல்லி வாங்கினாலும் மாஸா வரணும்!'",
      characterPose: "happy",
      durationSec: 5,
    },
    {
      orderIndex: 7,
      narration: "எல்லா பஞ்சாயத்தும் முடிஞ்சு, பதினாறு பேரும் சேர்ந்து பட்டைய கெளப்பும் வேற லெவல் குத்து டான்ஸ் போடுறாங்க!",
      visualPrompt: "[Characters: aarumugam, balu, pandi] Vibrant dance party on colorful stage with disco lights",
      captionText: "⚡ வேற லெவல் குத்து! பரோட்டா பாண்டி சால்னாவோட டான்ஸ் ஆடுறான்! 💃🔥",
      characterPose: "dancing",
      durationSec: 6,
    },
  ];

  // 4. Insert Scenes into database
  for (const s of scenesData) {
    await prisma.scene.create({
      data: {
        videoProjectId: project.id,
        orderIndex: s.orderIndex,
        narration: s.narration,
        visualPrompt: `${s.visualPrompt} [Pose: ${s.characterPose}]`,
        captionText: s.captionText,
        duration: s.durationSec,
        status: "PENDING",
      },
    });
  }

  console.log(`✅ Inserted ${scenesData.length} scenes into project ${project.id}.`);

  // 5. Render Video Project using renderer.ts (which embeds the 3D character images!)
  console.log("🚀 Starting end-to-end rendering pipeline with FFmpeg & Tamil Edge-TTS...");
  const result = await renderVideoProject(project.id, (pct, msg) => {
    console.log(`  [Render Progress ${pct}%] ${msg}`);
  });

  console.log("🎉 VIDEO RENDER COMPLETED SUCCESSFULLY!");
  console.log(`📁 Video Output Path: ${result.outputPath}`);
  console.log(`🖼️ Thumbnail Path: ${result.thumbnailPath}`);
  console.log(`⏱️ Duration: ${result.durationSec.toFixed(1)}s | Size: ${(result.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB`);

  return {
    projectId: project.id,
    videoPath: result.outputPath,
    thumbnailPath: result.thumbnailPath,
    durationSec: result.durationSec,
  };
}

if (process.argv[1]?.includes("generateComedyVideo")) {
  createAndRenderComedyVideo()
    .then((res) => {
      console.log("✅ Finished successfully! Project ID:", res.projectId);
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Video Generation Failed:", err);
      process.exit(1);
    });
}
