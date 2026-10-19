"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Sparkles,
  Volume2,
  Download,
  Film,
  Music,
  Tv,
  CheckCircle2,
  ExternalLink,
  Flame,
  Search,
  Copy,
  Check,
  RotateCcw,
  Eye,
} from "lucide-react";
import { TURNAROUND_PROMPTS } from "@/lib/characters/modelSheetPrompts";

interface CharacterData {
  id: string;
  name: string;
  nickname: string;
  role: string;
  catchphrase: string;
  personality: string;
  emoji: string;
  badgeColor: string;
  tags: string[];
}

const CHARACTERS: CharacterData[] = [
  {
    id: "senthil",
    name: "Scene Senthil",
    nickname: "Mass Hero",
    role: "Cinematic mass hero (age 28)",
    catchphrase: "Entry vera level!",
    personality:
      "Enters every room in slow motion like a cinematic mass hero, even when he is just stepping out to buy coriander leaves. Wind machine effect seems to follow him everywhere.",
    emoji: "🎬",
    badgeColor: "from-amber-500 to-yellow-600",
    tags: ["Mass Hero", "Slow Motion", "Tamil Cinema Swagger"],
  },
  {
    id: "govind",
    name: "Google Govind",
    nickname: "WhatsApp PhD",
    role: "Self-proclaimed expert (age 32)",
    catchphrase: "WhatsApp-la padichen bro, 100% accurate!",
    personality:
      "Supreme confidence, zero accuracy. Believes every WhatsApp forward he reads and lectures people with fake science facts delivered with absolute authority.",
    emoji: "📱",
    badgeColor: "from-blue-500 to-cyan-600",
    tags: ["WhatsApp University", "Fake Science", "Infinite Confidence"],
  },
  {
    id: "babu",
    name: "Battery Babu",
    nickname: "10 AM Dead Battery",
    role: "Human who crashes at 10 AM (age 25)",
    catchphrase: "Morning-la naan Superman! 10 AM-ku game over!",
    personality:
      "Starts the day at 200% energy bouncing off the walls, runs out of charge by 10 AM exactly, and can nap standing up against a street lamp post.",
    emoji: "⚡",
    badgeColor: "from-yellow-500 to-amber-600",
    tags: ["High Energy", "Instant Crash", "Lamp Post Napper"],
  },
  {
    id: "ganesan",
    name: "Gethu Ganesan",
    nickname: "Amma's Kitten",
    role: "Tough guy who melts at mom's voice (age 26)",
    catchphrase: "Naan bayapadamatein! ... Coming Amma!",
    personality:
      "Flexes heavy swagger, gold-plated chains, and tough dialogues in front of the gang, but starts shaking the second his mom shouts his real name — Ganapathy!",
    emoji: "🦁",
    badgeColor: "from-red-500 to-rose-600",
    tags: ["Tough Guy", "Gold Chains", "Mom's Boy"],
  },
  {
    id: "anand",
    name: "Aap-adicha Anand",
    nickname: "Master Plan Fail",
    role: "Elaborate plan backfire expert (age 29)",
    catchphrase: "Oru plan iruku... indha maari backfire aagaathu!",
    personality:
      "The master strategist whose elaborate shortcut plans to get rich or prank someone always backfire directly and spectacularly onto himself. Never learns.",
    emoji: "📋",
    badgeColor: "from-emerald-500 to-green-600",
    tags: ["Master Strategist", "Instant Karma", "Elaborate Schemes"],
  },
  {
    id: "mohan",
    name: "Mic Mohan",
    nickname: "Loud Speaker",
    role: "The man with no volume control (age 27)",
    catchphrase: "Psst! SECRET KONJAM KELAPPA!",
    personality:
      "Lacks an indoor voice. Even when trying to whisper a top-secret rumour, half the street and two entire neighborhoods can hear him word for word.",
    emoji: "📢",
    badgeColor: "from-purple-500 to-indigo-600",
    tags: ["Whisper Mega-Fail", "Sonic Shockwaves", "Zero Indoor Voice"],
  },
  {
    id: "pandi",
    name: "Parotta Pandi",
    nickname: "Salna Philosopher",
    role: "Food philosopher (age 31)",
    catchphrase: "Parotta + salna iruntha... naan ready!",
    personality:
      "The food philosopher. Will happily agree to any dangerous plan or compromise any moral principle as long as hot parotta and unlimited salna is promised at the end.",
    emoji: "🥙",
    badgeColor: "from-orange-500 to-amber-700",
    tags: ["Food Philosopher", "Salna Unlimited", "Bribable by Parotta"],
  },
  {
    id: "aarumugam",
    name: "Alappara Aarumugam",
    nickname: "International Drama King",
    role: "Resident drama king (age 30)",
    catchphrase: "International standard bro, ungalukku puriyaathu!",
    personality:
      "The resident drama king. Everything he does is an over-the-top spectacle, and he talks like an international boss despite having zero achievements.",
    emoji: "👑",
    badgeColor: "from-fuchsia-500 to-purple-700",
    tags: ["Drama King", "International Swagger", "Purple Velvet"],
  },
  {
    id: "balu",
    name: "Bullet Balu",
    nickname: "Tree Climber Hero",
    role: "Action hero until a dog barks (age 27)",
    catchphrase: "Mass hero-ku bayam illa... aiyo naai varudhu!",
    personality:
      "Thinks he is a mass cinematic action hero. Always sports aviator sunglasses and leather jackets in peak heat, but screams and climbs a tree if he spots a stray dog.",
    emoji: "🕶️",
    badgeColor: "from-stone-600 to-zinc-800",
    tags: ["Leather Jacket in 42°C", "Terrified of Puppies", "Tree Climber"],
  },
  {
    id: "sodamani",
    name: "Soda Mani",
    nickname: "Town Gossip 24x7",
    role: "Tea stall owner & gossip anchor (age 42)",
    catchphrase: "Tea kudi... hot breaking news solren!",
    personality:
      "Thick soda-bottle glasses, runs the local tea-and-snack corner, and serves as the town's live gossip broadcast network. Knows all news before it happens.",
    emoji: "👓",
    badgeColor: "from-teal-500 to-emerald-600",
    tags: ["Soda Bottle Lenses", "Cutting Chai", "Breaking Gossip"],
  },
  {
    id: "sundaram",
    name: "Sombu Sundaram",
    nickname: "Laziness Legend",
    role: "Champion of laziness (age 33)",
    catchphrase: "Thanni kudika 10 adi nadakanuma? Naliku paathukalam!",
    personality:
      "The champion of laziness. Capable of inventing 15 complex excuses just to avoid walking 10 feet to fetch water. Would rather dehydrate than stand up.",
    emoji: "🦥",
    badgeColor: "from-slate-500 to-gray-700",
    tags: ["Laziness Champion", "Brass Sombu", "Sleepy Genius"],
  },
  {
    id: "thangarasu",
    name: "Tension Thangarasu",
    nickname: "Walking Apocalypse",
    role: "High blood pressure & panic master (age 46)",
    catchphrase: "Aiyayo! Ellam pochu! Apocalypse vandhuruchu!",
    personality:
      "High blood pressure personified. Panics before anything even happens, convinced every minor problem is an impending apocalypse. Steam shoots from his ears.",
    emoji: "🚨",
    badgeColor: "from-rose-600 to-red-700",
    tags: ["Walking Apocalypse", "Steam from Ears", "Permanent Panic"],
  },
  {
    id: "dhandapani",
    name: "Dowlath Dhandapani",
    nickname: "Empty Wallet Crorepati",
    role: "Fake billionaire financial advisor (age 36)",
    catchphrase: "500 crore deal pesitruken... tea-ku 5 roova change kudu bro!",
    personality:
      "Empty wallet, royal attitude. Always gives unsolicited aggressive financial advice and talks about multi-crore deals while borrowing change for cutting tea.",
    emoji: "💸",
    badgeColor: "from-indigo-600 to-blue-800",
    tags: ["500 Crore Deals", "Zero Rupee Wallet", "Tea Loan King"],
  },
  {
    id: "soundarya",
    name: "Serial Soundarya",
    nickname: "Mega-Serial Twist Queen",
    role: "Drama & mega-serial queen (age 28)",
    catchphrase: "Idhu theriyama pochey! Mega twist aayiruchey!",
    personality:
      "High-voltage mega-serial addict. Treats every basic street conversation like an 800-episode soap opera climax. Turns three times in dramatic slow motion: Dhaam Dheem Dhaam!",
    emoji: "📺",
    badgeColor: "from-purple-600 to-fuchsia-700",
    tags: ["Mega Serial", "Dramatic Twist", "TV Remote Wand"],
  },
  {
    id: "kokila",
    name: "Kolaaru Kokila",
    nickname: "Gossip Confusion Queen",
    role: "Town confusion & live gossip broadcaster (age 34)",
    catchphrase: "Ketta shock aayiruveenga... naan sollavaa?!",
    personality:
      "The undisputed queen of confusion and rumors. Hears half a word, invents the remaining 95%, and broadcasts it across town in two minutes with her massive handbag.",
    emoji: "📻",
    badgeColor: "from-lime-500 to-green-700",
    tags: ["Live Gossip", "Confusion Queen", "Mega Handbag"],
  },
  {
    id: "padmini",
    name: "Pottu Padmini",
    nickname: "Area Boss Akka",
    role: "Undisputed street leader (age 40)",
    catchphrase: "Enna aaluku aalu alappara panreenga? Ozhunga nillu!",
    personality:
      "The undisputed boss of the neighborhood. Wears a giant maroon pottu (bindi) that commands instant obedience and respect. Solves every street dispute with a single glare.",
    emoji: "👑",
    badgeColor: "from-amber-600 to-red-700",
    tags: ["Area Boss Akka", "Giant Pottu", "Commanding Glare"],
  },
];

export default function CharactersPage() {
  const [selectedChar, setSelectedChar] = useState<CharacterData | null>(null);
  const [angle, setAngle] = useState<"front" | "left" | "right" | "sheet">("front");
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [search, setSearch] = useState("");
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const speakCatchphrase = (char: CharacterData) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setSpeakingId(char.id);

    const utterance = new SpeechSynthesisUtterance(char.catchphrase);
    utterance.lang = "ta-IN";
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    window.speechSynthesis.speak(utterance);
  };

  const filtered = CHARACTERS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.nickname.toLowerCase().includes(search.toLowerCase()) ||
      c.personality.toLowerCase().includes(search.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 space-y-8">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/30 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>OFFICIAL 3D ANIMATED CAST • 16 CHARACTERS</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>Happy Kuttu Song</span>
              <span className="text-amber-400">Cast</span>
            </h1>
            <p className="text-slate-300 max-w-2xl text-sm md:text-base leading-relaxed">
              Every video features strictly these 16 permanent comedy characters. 
              Zero 2D cartoon figures. Fully integrated with automated scripts, speech synthesis, and high-energy Tamil Kuthu dance breaks!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/characters/cast_poster_hd.png"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-bold hover:brightness-110 transition shadow-lg shadow-amber-500/20 text-sm"
              id="view-master-poster-btn"
            >
              <Flame className="w-4 h-4" />
              <span>View 3D Master Poster (HD)</span>
            </a>
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-white font-semibold transition text-sm"
            >
              <Film className="w-4 h-4 text-sky-400" />
              <span>Open Video Studio</span>
            </Link>
          </div>
        </div>

        {/* Pipeline Highlights Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">16 Characters</div>
              <div className="text-xs text-slate-400">13 Kings &amp; 3 Queens</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">2x Daily Shorts</div>
              <div className="text-xs text-slate-400">Morning &amp; Evening 30s</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">1x Full Story</div>
              <div className="text-xs text-slate-400">Weekly 5-6 min Comedy</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">Kuthu Dance</div>
              <div className="text-xs text-slate-400">30s Tamil Dance Break</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search characters by name, role, catchphrase..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm focus:outline-none focus:border-amber-500/50 text-slate-200 placeholder:text-slate-500"
            id="character-search-input"
          />
        </div>
        <div className="text-xs text-slate-400">
          Showing <span className="font-bold text-amber-400">{filtered.length}</span> of 16 official characters
        </div>
      </div>

      {/* Character Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((char) => {
          const isSpeaking = speakingId === char.id;
          return (
            <div
              key={char.id}
              className="group relative rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-amber-500/50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10 flex flex-col justify-between"
              id={`character-card-${char.id}`}
            >
              {/* Image Container */}
              <div className="relative aspect-square w-full overflow-hidden bg-slate-950">
                <img
                  src={`/characters/${char.id}.png`}
                  alt={char.name}
                  className="w-full h-full object-cover object-top transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                {/* Nickname pill */}
                <div className="absolute top-3 left-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider text-white bg-gradient-to-r ${char.badgeColor} shadow-md`}
                  >
                    <span>{char.emoji}</span>
                    <span>{char.nickname}</span>
                  </span>
                </div>

                {/* 3D Badge */}
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-amber-400 text-slate-950 tracking-wider">
                    3D Render
                  </span>
                </div>

                {/* Audio catchphrase trigger */}
                <button
                  onClick={() => speakCatchphrase(char)}
                  title="Listen to Tamil Catchphrase"
                  className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition shadow-lg ${
                    isSpeaking
                      ? "bg-amber-400 text-slate-950 scale-110 animate-pulse"
                      : "bg-slate-900/90 hover:bg-amber-400 hover:text-slate-950 text-amber-300 border border-amber-500/40"
                  }`}
                  id={`speak-btn-${char.id}`}
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition flex items-center justify-between">
                      <span>{char.name}</span>
                    </h3>
                    <p className="text-xs text-amber-400/90 font-medium">{char.role}</p>
                  </div>

                  {/* Catchphrase quote */}
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <p className="text-xs text-amber-200 font-semibold italic">
                      "{char.catchphrase}"
                    </p>
                  </div>

                  {/* Personality */}
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {char.personality}
                  </p>
                </div>

                {/* Tags & Actions */}
                <div className="pt-3 border-t border-slate-800/80 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {char.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800/70 text-slate-300 font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedChar(char)}
                      className="flex-1 py-2 text-xs font-semibold text-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                      id={`inspect-btn-${char.id}`}
                    >
                      Inspect Bio
                    </button>
                    <a
                      href={`/characters/${char.id}.png`}
                      download={`${char.id}_3d.png`}
                      title="Download 3D Asset"
                      className="p-2 rounded-lg bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-300 transition"
                      id={`download-btn-${char.id}`}
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal with 360° Multi-Angle Turnaround Viewer */}
      {selectedChar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 space-y-6 shadow-2xl my-8">
            <button
              onClick={() => {
                setSelectedChar(null);
                setAngle("front");
                setCopiedPrompt(false);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white text-lg font-bold w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center transition"
            >
              ✕
            </button>

            {/* Header info */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <span>{selectedChar.emoji}</span>
                  <span>{selectedChar.nickname}</span>
                </div>
                <h2 className="text-3xl font-black text-white flex items-center gap-3">
                  <span>{selectedChar.name}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20 font-semibold">
                    Turnaround Model Sheet
                  </span>
                </h2>
                <p className="text-xs text-slate-400">{selectedChar.role}</p>
              </div>

              {/* Angle View Selector Pill */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800">
                <button
                  onClick={() => setAngle("front")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    angle === "front"
                      ? "bg-amber-400 text-slate-950 shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Front</span>
                </button>
                <button
                  onClick={() => setAngle("left")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    angle === "left"
                      ? "bg-amber-400 text-slate-950 shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span>👈 3/4 Left</span>
                </button>
                <button
                  onClick={() => setAngle("right")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    angle === "right"
                      ? "bg-amber-400 text-slate-950 shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span>3/4 Right 👉</span>
                </button>
                <button
                  onClick={() => setAngle("sheet")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    angle === "sheet"
                      ? "bg-amber-400 text-slate-950 shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Full Sheet</span>
                </button>
              </div>
            </div>

            {/* Viewer Stage */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Image Preview Box */}
              <div className="lg:col-span-6 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="relative w-full max-h-[380px] flex items-center justify-center overflow-hidden rounded-xl">
                  <img
                    key={`${selectedChar.id}-${angle}`}
                    src={
                      angle === "sheet"
                        ? `/characters/sheets/${selectedChar.id}_sheet.png`
                        : `/characters/${selectedChar.id}_${angle}.png`
                    }
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `/characters/${selectedChar.id}.png`;
                    }}
                    alt={`${selectedChar.name} - ${angle} view`}
                    className="max-h-[360px] w-auto object-contain rounded-lg shadow-xl"
                  />
                </div>
                <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                  {selectedChar.id === "aarumugam" && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                  <span>
                    {angle === "sheet"
                      ? "Full 3-Angle Turnaround Model Sheet"
                      : `${angle.toUpperCase()} Pose Angle View`}
                  </span>
                  {selectedChar.id === "aarumugam" && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      Turnaround Ready
                    </span>
                  )}
                </div>
              </div>

              {/* Bio & Actions */}
              <div className="lg:col-span-6 space-y-4">
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-amber-300">Signature Catchphrase</span>
                    <p className="text-sm font-bold text-white">"{selectedChar.catchphrase}"</p>
                  </div>
                  <button
                    onClick={() => speakCatchphrase(selectedChar)}
                    className="p-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 transition"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-300">Comedy Personality</span>
                  <p className="text-xs text-slate-400 leading-relaxed">{selectedChar.personality}</p>
                </div>

                {/* Gemini Turnaround Prompt Box */}
                <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-bold text-purple-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>Gemini Multi-Angle Model Sheet Prompt</span>
                    </span>
                    <button
                      onClick={() => {
                        const promptText =
                          TURNAROUND_PROMPTS[selectedChar.id] ||
                          `A 3D Disney Pixar animated character turnaround model sheet. Bold 3D cartoon lettering centered at top: '${selectedChar.name.toUpperCase()}'. Three full-body poses side-by-side on a neutral light grey studio background with soft floor contact shadows. Character: ${selectedChar.name}, ${selectedChar.role}. ${selectedChar.personality}. Left pose: 3/4 front view; Center pose: Frontal confident stance; Right pose: 3/4 side profile view. High detail Pixar 3D animated character sheet.`;
                        navigator.clipboard.writeText(promptText);
                        setCopiedPrompt(true);
                        setTimeout(() => setCopiedPrompt(false), 2000);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold transition shadow"
                    >
                      {copiedPrompt ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedPrompt ? "Copied!" : "Copy Prompt"}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-purple-200/90 font-mono bg-purple-950/60 p-2.5 rounded-lg line-clamp-3 leading-relaxed border border-purple-500/20">
                    {TURNAROUND_PROMPTS[selectedChar.id] ||
                      `A 3D Disney Pixar animated character turnaround model sheet. Bold 3D cartoon lettering centered at top: '${selectedChar.name.toUpperCase()}'. Three full-body poses side-by-side on a neutral light grey studio background...`}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-purple-300/70 pt-0.5">
                    <span>💡 Calibrated to match the Alappara Aarumugam sheet layout</span>
                    <a
                      href="https://gemini.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-300 hover:text-white underline flex items-center gap-1"
                    >
                      <span>Open Gemini</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>

                {/* Download links */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <a
                    href={
                      angle === "sheet"
                        ? `/characters/sheets/${selectedChar.id}_sheet.png`
                        : `/characters/${selectedChar.id}_${angle}.png`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open High-Res</span>
                  </a>
                  <a
                    href={`/characters/${selectedChar.id}.png`}
                    download={`${selectedChar.id}_3d.png`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-semibold text-xs hover:bg-slate-700 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PNG</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
