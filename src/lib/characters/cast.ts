/**
 * HAPPY KUTTU SONG — Permanent Cast Registry (16 Characters)
 *
 * These 16 fixed characters appear consistently across EVERY video.
 * All stories must be fresh comedic episodes featuring this exact cast.
 * DO NOT add or remove characters — this is the final cast.
 */

export interface CharacterDefinition {
  /** Unique character ID used in rendering and prompts */
  id: string;
  /** Tamil/English name as shown on screen */
  name: string;
  /** TTS-friendly romanized name */
  nameTts: string;
  /** Comic nickname */
  nickname: string;
  /** Age / role description */
  role: string;
  /** Full personality description for AI prompts */
  personality: string;
  /** Signature catchphrase */
  catchphrase: string;
  /** Primary skin tone (hex) */
  skinColor: string;
  /** Shirt / top color */
  shirtColor: string;
  /** Hair color */
  hairColor: string;
  /** Bottom (pants/dhoti/shorts) color */
  bottomColor: string;
  /** Shoe/feet color */
  shoeColor: string;
  /** Visual accessory description */
  accessory: string;
  /** Emoji icon for this character */
  emoji: string;
  /** TTS voice to use for this character's dialogue */
  ttsVoice: string;
}

export const CAST: CharacterDefinition[] = [
  {
    id: "senthil",
    name: "Scene Senthil",
    nameTts: "Scene Senthil",
    nickname: "Mass Hero",
    role: "Cinematic mass hero (age 28)",
    personality:
      "Enters every room in dramatic slow motion like a mass hero — even when buying coriander leaves. Wind machine effect seems to follow him. Treats mundane tasks as blockbuster movie moments. Zero self-awareness about how ridiculous it looks.",
    catchphrase: "Entry vera level!",
    skinColor: "#c68642",
    shirtColor: "#1a1a2e",
    hairColor: "#0f0f0f",
    bottomColor: "#2c2c54",
    shoeColor: "#1a1a1a",
    accessory: "Dark hero sunglasses, collar-up black shirt, dramatic wind-blown hair",
    emoji: "🎬",
    ttsVoice: "ta-IN-ValluvarNeural",
  },
  {
    id: "govind",
    name: "Google Govind",
    nameTts: "Google Govind",
    nickname: "WhatsApp PhD",
    role: "Self-proclaimed expert (age 32)",
    personality:
      "Supreme confidence, zero accuracy. Believes every WhatsApp forward he reads and lectures people with completely fake science facts delivered with 100% authority. Never admits he is wrong. Quotes imaginary research papers.",
    catchphrase: "WhatsApp-la padichen bro, 100% accurate!",
    skinColor: "#d4a056",
    shirtColor: "#4285f4",
    hairColor: "#2d1b00",
    bottomColor: "#1a237e",
    shoeColor: "#ffffff",
    accessory: "Always has phone in hand, thick framed glasses, Google t-shirt",
    emoji: "📱",
    ttsVoice: "ta-IN-ValluvarNeural",
  },
  {
    id: "babu",
    name: "Battery Babu",
    nameTts: "Battery Babu",
    nickname: "10 AM Dead Battery",
    role: "Human who crashes at 10 AM (age 25)",
    personality:
      "Starts the day at 200% explosive energy — bouncing off walls, making plans, screaming motivation. But runs completely out of charge by 10 AM exactly and can nap standing up against a lamp post. By noon he is a philosophical zombie.",
    catchphrase: "Morning-la naan Superman! 10 AM-ku game over!",
    skinColor: "#e8c99a",
    shirtColor: "#f59e0b",
    hairColor: "#1c0f00",
    bottomColor: "#7c3aed",
    shoeColor: "#f97316",
    accessory: "Energy drink can in hand, lightning bolt design on shirt, increasingly drooping eyes as day goes on",
    emoji: "⚡",
    ttsVoice: "ta-IN-ValluvarNeural",
  },
  {
    id: "ganesan",
    name: "Gethu Ganesan",
    nameTts: "Gethu Ganesan",
    nickname: "Amma's Kitten",
    role: "Tough guy who melts at mom's voice (age 26)",
    personality:
      "Flexes heavy swagger, gold-plated chains, and tough intimidating dialogues in front of the gang. But the moment his mom shouts his real name — Ganapathy — from a distance, he instantly crumbles into a terrified child saying 'Coming Amma!'",
    catchphrase: "Naan bayapadamatein! ... Coming Amma!",
    skinColor: "#c8913f",
    shirtColor: "#dc2626",
    hairColor: "#1a0800",
    bottomColor: "#1e3a5f",
    shoeColor: "#d97706",
    accessory: "Three thick gold chains, red vest, tough guy scowl — until mom calls",
    emoji: "🦁",
    ttsVoice: "ta-IN-ValluvarNeural",
  },
  {
    id: "anand",
    name: "Aap-adicha Anand",
    nameTts: "Aap-adicha Anand",
    nickname: "Master Plan Fail",
    role: "Elaborate plan backfire expert (age 29)",
    personality:
      "The master strategist and shortcut genius. Devises incredibly elaborate, multi-step plans to get rich quickly or pull off legendary pranks. Every single plan backfires directly, spectacularly, and exclusively onto himself. Never learns.",
    catchphrase: "Oru plan iruku... indha maari backfire aagaathu!",
    skinColor: "#d4956a",
    shirtColor: "#16a34a",
    hairColor: "#1c1c1c",
    bottomColor: "#065f46",
    shoeColor: "#6b7280",
    accessory: "Always holding a notebook full of 'plans', pencil behind ear, suspiciously nervous smile",
    emoji: "📋",
    ttsVoice: "ta-IN-ValluvarNeural",
  },
  {
    id: "mohan",
    name: "Mic Mohan",
    nameTts: "Mic Mohan",
    nickname: "Loud Speaker",
    role: "The man with no volume control (age 27)",
    personality:
      "Completely lacks an indoor voice. Even when trying to whisper the most top-secret rumour in confidence, half the street, two shops, and an old couple three streets away can hear him word for word. Has no idea he is loud.",
    catchphrase: "Psst! SECRET KONJAM KELAPPA!",
    skinColor: "#e2a96f",
    shirtColor: "#7c3aed",
    hairColor: "#0f0f0f",
    bottomColor: "#4c1d95",
    shoeColor: "#a78bfa",
    accessory: "Cupped hands around mouth when 'whispering', startles everyone around him, vibrating sound waves",
    emoji: "📢",
    ttsVoice: "ta-IN-ValluvarNeural",
  },
  {
    id: "pandi",
    name: "Parotta Pandi",
    nameTts: "Parotta Pandi",
    nickname: "Salna Philosopher",
    role: "Food philosopher (age 31)",
    personality:
      "Wise, principled, philosophical — but only when it comes to food. Will agree to any dangerous plan, compromise any moral, or walk 10 km in rain as long as hot parotta and unlimited salna is promised at the end. Cannot be bribed any other way.",
    catchphrase: "Parotta + salna iruntha... naan ready!",
    skinColor: "#d4a56a",
    shirtColor: "#ea580c",
    hairColor: "#1a1000",
    bottomColor: "#78350f",
    shoeColor: "#92400e",
    accessory: "Always thinking about food, round tummy, napkin tucked in shirt collar, dreamy food-vision eyes",
    emoji: "🥙",
    ttsVoice: "ta-IN-ValluvarNeural",
  },
  {
    id: "aarumugam",
    name: "Alappara Aarumugam",
    nameTts: "Alappara Aarumugam",
    nickname: "International Drama King",
    role: "Resident drama king & fake international boss (age 30)",
    personality:
      "The resident drama king. Everything he does is an over-the-top spectacle, and he talks like an international boss despite having zero achievements. Makes buying a bus ticket sound like signing a high-level United Nations treaty.",
    catchphrase: "International standard bro, ungalukku puriyaathu!",
    skinColor: "#d49a60",
    shirtColor: "#7e22ce",
    hairColor: "#18181b",
    bottomColor: "#3b0764",
    shoeColor: "#581c87",
    accessory: "Golden crown pin, dramatic puffed collar, international boss hand gestures, sparkle stars",
    emoji: "👑",
    ttsVoice: "ta-IN-ValluvarNeural",
  },
  {
    id: "balu",
    name: "Bullet Balu",
    nameTts: "Bullet Balu",
    nickname: "Tree Climber Hero",
    role: "Mass action hero until a dog barks (age 27)",
    personality:
      "Thinks he is a mass cinematic action hero. Always sports aviator sunglasses and leather jackets in peak 42°C heat, but screams in high-pitch panic and climbs the nearest tree or lamp post if he spots even a puppy or stray dog.",
    catchphrase: "Mass hero-ku bayam illa... aiyo naai varudhu!",
    skinColor: "#c88242",
    shirtColor: "#451a03",
    hairColor: "#0f0f0f",
    bottomColor: "#1e293b",
    shoeColor: "#78350f",
    accessory: "Aviator sunglasses, heavy leather jacket, sweat drops from heat, terrified jumping reaction",
    emoji: "🕶️",
    ttsVoice: "ta-IN-ValluvarNeural",
  },
  {
    id: "sodamani",
    name: "Soda Mani",
    nameTts: "Soda Mani",
    nickname: "Town Gossip 24x7",
    role: "Tea stall owner & town gossip network (age 42)",
    personality:
      "Thick soda-bottle glasses that magnify his eyes 5x. Runs the local tea-and-snack corner and serves as the town's live gossip broadcast network. Knows who bought soap, who failed exams, and who is visiting whom before it even happens.",
    catchphrase: "Tea kudi... hot breaking news solren!",
    skinColor: "#cda068",
    shirtColor: "#059669",
    hairColor: "#374151",
    bottomColor: "#f3f4f6",
    shoeColor: "#4b5563",
    accessory: "Massive round soda-bottle glasses with concentric thick lenses, tea glass in hand with steam",
    emoji: "👓",
    ttsVoice: "ta-IN-ValluvarNeural",
  },
  {
    id: "sundaram",
    name: "Sombu Sundaram",
    nameTts: "Sombu Sundaram",
    nickname: "Laziness Legend",
    role: "Champion of laziness (age 33)",
    personality:
      "The undisputed champion of laziness. Capable of inventing 15 complex philosophical and scientific excuses just to avoid walking 10 feet to fetch water. Would rather dehydrate than stand up from his bench or mat.",
    catchphrase: "Thanni kudika 10 adi nadakanuma? Naliku paathukalam!",
    skinColor: "#d4a373",
    shirtColor: "#64748b",
    hairColor: "#1c1917",
    bottomColor: "#94a3b8",
    shoeColor: "#cbd5e1",
    accessory: "A brass sombu (water pot) resting just out of reach, comfy pillow, floating Zzz sleep bubble",
    emoji: "🦥",
    ttsVoice: "ta-IN-ValluvarNeural",
  },
  {
    id: "thangarasu",
    name: "Tension Thangarasu",
    nameTts: "Tension Thangarasu",
    nickname: "Walking Apocalypse",
    role: "High blood pressure & panic master (age 46)",
    personality:
      "High blood pressure personified. Panics before anything even happens, convinced every minor problem — a dropped coin, a cloudy sky, a slight sneeze — is an impending apocalypse. Screams clutching both sides of his head.",
    catchphrase: "Aiyayo! Ellam pochu! Apocalypse vandhuruchu!",
    skinColor: "#e07a5f",
    shirtColor: "#dc2626",
    hairColor: "#3d1308",
    bottomColor: "#450a0a",
    shoeColor: "#991b1b",
    accessory: "Trembling hands gripping temples, steam puffs shooting from ears, red exclamation alerts",
    emoji: "🚨",
    ttsVoice: "ta-IN-ValluvarNeural",
  },
  {
    id: "dhandapani",
    name: "Dowlath Dhandapani",
    nameTts: "Dowlath Dhandapani",
    nickname: "Empty Wallet Crorepati",
    role: "Fake billionaire financial advisor (age 36)",
    personality:
      "Completely empty wallet, royal aristocratic attitude. Always gives unsolicited aggressive financial advice and talks casually about multi-crore deals while borrowing change for cutting tea.",
    catchphrase: "500 crore deal pesitruken... tea-ku 5 roova change kudu bro!",
    skinColor: "#c89255",
    shirtColor: "#1e3a8a",
    hairColor: "#111827",
    bottomColor: "#1e293b",
    shoeColor: "#0f172a",
    accessory: "Turned inside-out empty wallet showing 0 ₹, multi-crore thought bubble, royal swagger pose",
    emoji: "💸",
    ttsVoice: "ta-IN-ValluvarNeural",
  },
  {
    id: "soundarya",
    name: "Serial Soundarya",
    nameTts: "Serial Soundarya",
    nickname: "Mega-Serial Twist Queen",
    role: "Drama & mega-serial queen (age 28)",
    personality:
      "High-voltage mega-serial addict. Treats every basic street conversation like an 800-episode soap opera climax. If someone drops a tea tumbler, she gasps in dramatic slow motion with imaginary lightning strikes and turns three times: Dhaam Dheem Dhaam!",
    catchphrase: "Idhu theriyama pochey! Mega twist aayiruchey!",
    skinColor: "#d49a60",
    shirtColor: "#9333ea",
    hairColor: "#18181b",
    bottomColor: "#581c87",
    shoeColor: "#facc15",
    accessory: "Purple silk saree, gold jhumkas, TV remote held like a magic wand, dramatic soap opera shock expressions",
    emoji: "📺",
    ttsVoice: "ta-IN-PallaviNeural",
  },
  {
    id: "kokila",
    name: "Kolaaru Kokila",
    nameTts: "Kolaaru Kokila",
    nickname: "Gossip Confusion Queen",
    role: "Town confusion & live gossip broadcaster (age 34)",
    personality:
      "The undisputed queen of confusion and rumors. Never listens to a complete sentence — hears half a word, invents the remaining 95%, and broadcasts it across town in two minutes with her massive handbag. Partners with or competes against Soda Mani.",
    catchphrase: "Ketta shock aayiruveenga... naan sollavaa?!",
    skinColor: "#cda068",
    shirtColor: "#16a34a",
    hairColor: "#1f2937",
    bottomColor: "#14532d",
    shoeColor: "#dc2626",
    accessory: "Bright parrot-green saree, oversized sunglasses perched on head, enormous gossip handbag, knowing gossiping smirk",
    emoji: "📻",
    ttsVoice: "ta-IN-PallaviNeural",
  },
  {
    id: "padmini",
    name: "Pottu Padmini",
    nameTts: "Pottu Padmini",
    nickname: "Area Boss Akka",
    role: "Undisputed street leader (age 40)",
    personality:
      "The undisputed boss of the neighborhood. Wears a giant maroon pottu (bindi) that commands instant obedience and respect. Even tough guy Gethu Ganesan stands with folded hands and Bullet Balu stops trembling when she speaks. Solves every street dispute with a single glare.",
    catchphrase: "Enna aaluku aalu alappara panreenga? Ozhunga nillu!",
    skinColor: "#c88242",
    shirtColor: "#f59e0b",
    hairColor: "#18181b",
    bottomColor: "#991b1b",
    shoeColor: "#b45309",
    accessory: "Regal yellow/red Kanchipuram silk saree, giant maroon round bindi, folded hands with gold bangles, jasmine flowers wreath",
    emoji: "👑",
    ttsVoice: "ta-IN-PallaviNeural",
  },
];

/** Get a character by ID */
export function getCharacter(id: string): CharacterDefinition {
  const c = CAST.find((ch) => ch.id === id);
  if (!c) throw new Error(`Character '${id}' not found in cast`);
  return c;
}

/** Returns full cast summary for Gemini AI prompts */
export function getCastSummaryForPrompt(): string {
  return CAST.map(
    (c) =>
      `- ${c.name} (ID: ${c.id}) aka "${c.nickname}": ${c.role}.\n  Personality: ${c.personality}\n  Catchphrase: "${c.catchphrase}"`
  ).join("\n");
}

/** Returns a compact cast list for short prompt sections */
export function getCastNamesForPrompt(): string {
  return CAST.map((c) => `${c.name} (${c.nickname})`).join(", ");
}

/**
 * Original Kuthu dance song for the weekly dance break (16 Official Characters).
 */
export const KUTHU_DANCE_SONG = {
  title: "Vera Level Kuthu!",
  titleTamil: "வேற லெவல் குத்து!",
  danceDirections: [
    "Scene Senthil enters in dramatic slow motion — wind machine on full blast",
    "Google Govind lectures wrong dance steps with 100% confidence",
    "Battery Babu dances at 200% energy then suddenly snoozes on a post",
    "Gethu Ganesan flexes gold chains until mom calls 'Ganapathy!'",
    "Aap-adicha Anand tries an elaborate jump move that backfires hilariously",
    "Mic Mohan screams the dance steps so loud speakers rattle",
    "Parotta Pandi dances holding a plate of flaky parotta and hot salna",
    "Alappara Aarumugam poses in purple velvet like an international king",
    "Bullet Balu dances in leather jacket, then spots a puppy and climbs a tree",
    "Soda Mani tosses tea glasses while shouting town gossip",
    "Sombu Sundaram dances lying down to save maximum energy",
    "Tension Thangarasu panics clutching his head that the floor is collapsing",
    "Dowlath Dhandapani dances royal swagger while borrowing 5 rupees for chai",
    "Serial Soundarya gasps at the dance steps like a mega-serial dramatic twist",
    "Kolaaru Kokila broadcasts live gossip updates while doing fast kuthu steps",
    "Pottu Padmini commands the entire dance floor with full area boss swagger",
  ],
  lyrics: [
    "Scene Senthil slow motion-la vandhan!",
    "Google Govind wrong steps teach pannaan!",
    "Battery Babu full energy-la thaandaan!",
    "Gethu Ganesan Amma call-la nindhan!",
    "Anand plan pottan, backfire aachan!",
    "Mic Mohan loud-a announce pannaan!",
    "Parotta Pandi parotta paathu vandhan!",
    "Alappara Aarumugam international entry pottan!",
    "Bullet Balu naaiku bayandhu maram erinaan!",
    "Soda Mani tea glass-oda aatam pottan!",
    "Sombu Sundaram rest edukitte aadaan!",
    "Tension Thangarasu panic aagi thullinaan!",
    "Dowlath Dhandapani tea kaasu kettan!",
    "Serial Soundarya mega twist-la aadinaa!",
    "Kolaaru Kokila breaking news-oda thullinaa!",
    "Pottu Padmini boss entry pottu aadinaa!",
    "Padhinaaru perum serntha vera level kuthu aaduvoam!",
  ],
};

export default CAST;
