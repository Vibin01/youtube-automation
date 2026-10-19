import sharp from "sharp";
import fs from "fs";
import path from "path";
import { CAST, CharacterDefinition, getCharacter, KUTHU_DANCE_SONG } from "../characters/cast";

export interface SceneVisualOptions {
  outputPath: string;
  orderIndex: number;
  totalScenes: number;
  narration: string;
  visualPrompt?: string;
  captionText?: string;
  format: "SHORTS" | "LONG_FORM";
  theme?: "cyber" | "sunset" | "emerald" | "crimson" | "dark" | "cartoon";
  style?: "cartoon" | "gradient" | "tech";
  language?: "English" | "Tamil";
  characterPose?: "happy" | "dancing" | "singing" | "pointing" | "surprised" | "thinking";
  channelName?: string;
  /** Which character IDs to show in this scene (max 4) */
  activeCharacterIds?: string[];
  /** Is this a Kuthu dance scene? */
  isKuthuDanceScene?: boolean;
}

export interface ThumbnailOptions {
  outputPath: string;
  title: string;
  hook?: string;
  badge?: string;
  format?: "SHORTS" | "LONG_FORM";
  style?: "cartoon" | "gradient";
  language?: "English" | "Tamil";
}

const GRADIENT_PALETTES = [
  { start: "#0f172a", mid: "#1e1b4b", end: "#311042", accent: "#38bdf8" },
  { start: "#09090b", mid: "#18181b", end: "#27272a", accent: "#f59e0b" },
  { start: "#042f2e", mid: "#064e3b", end: "#022c22", accent: "#34d399" },
  { start: "#450a0a", mid: "#7f1d1d", end: "#1c1917", accent: "#f87171" },
  { start: "#172554", mid: "#1e3a8a", end: "#0f172a", accent: "#60a5fa" },
];

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text: string, maxCharsPerLine = 28): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length <= maxCharsPerLine) {
      cur = (cur + " " + w).trim();
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 4);
}

// ─────────────────────────────────────────────────────────────────────────────
// CHARACTER SVG RENDERER (ALL 16 CHARACTERS)
// ─────────────────────────────────────────────────────────────────────────────

function getCharacterAccessorySvg(c: CharacterDefinition): string {
  switch (c.id) {
    case "senthil":
      // Hero sunglasses + collar up + wind-blown dramatic hair
      return `
        <rect x="-42" y="-74" width="28" height="12" rx="6" fill="#0f0f0f" stroke="#374151" stroke-width="2"/>
        <rect x="14" y="-74" width="28" height="12" rx="6" fill="#0f0f0f" stroke="#374151" stroke-width="2"/>
        <line x1="-14" y1="-68" x2="14" y2="-68" stroke="#374151" stroke-width="3"/>
        <path d="M -20 5 Q 0 -8 20 5 Q 14 18 0 22 Q -14 18 -20 5 Z" fill="${c.shirtColor}" stroke="#111827" stroke-width="2"/>
        <text x="-85" y="-90" font-size="24" fill="#f59e0b" opacity="0.7">✨</text>
        <text x="65" y="-80" font-size="20" fill="#60a5fa" opacity="0.6">💨</text>`;
    case "govind":
      // Phone in hand + thick glasses + fake WhatsApp forward badge
      return `
        <rect x="-42" y="-72" width="26" height="14" rx="7" fill="none" stroke="#1e40af" stroke-width="4"/>
        <rect x="16" y="-72" width="26" height="14" rx="7" fill="none" stroke="#1e40af" stroke-width="4"/>
        <line x1="-16" y1="-65" x2="16" y2="-65" stroke="#1e40af" stroke-width="3"/>
        <line x1="-68" y1="-65" x2="-42" y2="-65" stroke="#1e40af" stroke-width="3"/>
        <line x1="42" y1="-65" x2="68" y2="-65" stroke="#1e40af" stroke-width="3"/>
        <rect x="58" y="-55" width="28" height="44" rx="5" fill="#1f2937" stroke="#4b5563" stroke-width="2"/>
        <rect x="62" y="-51" width="20" height="34" rx="3" fill="#3b82f6" opacity="0.8"/>
        <text x="72" y="-38" font-size="10" fill="#ffffff" text-anchor="middle">📱</text>`;
    case "babu":
      // Energy drink can + lightning bolt shirt + droopy eyes indicator
      return `
        <rect x="58" y="-60" width="22" height="36" rx="8" fill="#f59e0b" stroke="#d97706" stroke-width="2"/>
        <text x="69" y="-38" font-size="12" fill="#1c1917" text-anchor="middle" font-weight="900">⚡</text>
        <path d="M 8 20 L -2 40 L 6 40 L -6 60 L 16 38 L 8 38 L 20 20 Z" fill="#fbbf24" opacity="0.9"/>`;
    case "ganesan":
      // Three gold chains
      return `
        <ellipse cx="0" cy="15" rx="30" ry="4" fill="none" stroke="#d97706" stroke-width="5" opacity="0.9"/>
        <ellipse cx="0" cy="22" rx="26" ry="3.5" fill="none" stroke="#f59e0b" stroke-width="4" opacity="0.8"/>
        <ellipse cx="0" cy="28" rx="22" ry="3" fill="none" stroke="#fbbf24" stroke-width="4" opacity="0.7"/>
        <circle cx="0" cy="28" r="6" fill="#f59e0b" stroke="#d97706" stroke-width="2"/>`;
    case "anand":
      // Notebook + pencil behind ear
      return `
        <rect x="58" y="-50" width="34" height="44" rx="4" fill="#ecfdf5" stroke="#6b7280" stroke-width="2"/>
        <line x1="64" y1="-40" x2="86" y2="-40" stroke="#374151" stroke-width="2"/>
        <line x1="64" y1="-32" x2="86" y2="-32" stroke="#374151" stroke-width="2"/>
        <line x1="64" y1="-24" x2="78" y2="-24" stroke="#ef4444" stroke-width="2"/>
        <text x="75" y="-14" font-size="10" fill="#374151" text-anchor="middle">Plan!</text>
        <rect x="-46" y="-112" width="6" height="28" rx="2" fill="#fde68a" transform="rotate(-15, -43, -98)"/>
        <polygon points="-49,-84 -43,-84 -46,-76" fill="#f87171" transform="rotate(-15, -43, -80)"/>`;
    case "mohan":
      // Sound waves + cupped hands
      return `
        <text x="-95" y="-50" font-size="16" fill="#7c3aed" opacity="0.7">))</text>
        <text x="-108" y="-65" font-size="22" fill="#7c3aed" opacity="0.5">))</text>
        <text x="68" y="-50" font-size="16" fill="#7c3aed" opacity="0.7">((</text>
        <text x="74" y="-65" font-size="22" fill="#7c3aed" opacity="0.5">((</text>`;
    case "pandi":
      // Napkin in collar + round tummy + parotta bubble
      return `
        <path d="M -22 8 L 22 8 L 18 60 L 0 65 L -18 60 Z" fill="#ffffff" opacity="0.75" stroke="#e5e7eb" stroke-width="1"/>
        <text x="62" y="-90" font-size="22" fill="#ea580c" opacity="0.9">🥙</text>
        <circle cx="58" cy="-72" r="5" fill="#ea580c" opacity="0.4"/>
        <circle cx="54" cy="-60" r="3.5" fill="#ea580c" opacity="0.3"/>`;
    case "aarumugam":
      // Gold royal crown pin + dramatic popped purple lapels + international sparkle stars
      return `
        <!-- Crown pin on chest -->
        <path d="M -8 18 L -14 6 L -4 12 L 0 4 L 4 12 L 14 6 L 8 18 Z" fill="#facc15" stroke="#d97706" stroke-width="1.5"/>
        <circle cx="0" cy="18" r="3" fill="#ef4444"/>
        <!-- Dramatic puffed collar -->
        <path d="M -28 5 Q -40 -12 -24 -24 Q -12 -6 0 10 Q 12 -6 24 -24 Q 40 -12 28 5 Z" fill="#581c87" stroke="#3b0764" stroke-width="2"/>
        <!-- Sparkle drama stars -->
        <text x="-88" y="-95" font-size="22" fill="#facc15">✨</text>
        <text x="68" y="-95" font-size="22" fill="#facc15">👑</text>
        <text x="-76" y="-30" font-size="14" fill="#a855f7" opacity="0.8">Boss!</text>`;
    case "balu":
      // Aviator sunglasses + heavy leather fur collar + heat sweat drops + scared puppy icon
      return `
        <!-- Aviator sunglasses (tear-drop shape) -->
        <path d="M -40 -76 Q -26 -76 -26 -64 Q -26 -52 -33 -54 Q -40 -56 -40 -76 Z" fill="#18181b" stroke="#ca8a04" stroke-width="2"/>
        <path d="M 40 -76 Q 26 -76 26 -64 Q 26 -52 33 -54 Q 40 -56 40 -76 Z" fill="#18181b" stroke="#ca8a04" stroke-width="2"/>
        <line x1="-26" y1="-70" x2="26" y2="-70" stroke="#ca8a04" stroke-width="3"/>
        <!-- Leather jacket heavy collar with fur trim -->
        <path d="M -30 2 Q 0 -12 30 2 L 26 26 L -26 26 Z" fill="#78350f" stroke="#451a03" stroke-width="2"/>
        <!-- Heat sweat drops -->
        <ellipse cx="48" cy="-84" rx="4" ry="7" fill="#38bdf8" opacity="0.8"/>
        <ellipse cx="-48" cy="-84" rx="3.5" ry="6" fill="#38bdf8" opacity="0.8"/>
        <!-- Barking dog fear alert -->
        <text x="62" y="-45" font-size="18" fill="#ef4444">🐕❓</text>`;
    case "sodamani":
      // Massive round soda-bottle glasses with concentric circles + tea glass with steam
      return `
        <!-- Left soda glass lens (thick concentric rings) -->
        <circle cx="-25" cy="-75" r="23" fill="#e0f2fe" opacity="0.65" stroke="#047857" stroke-width="4"/>
        <circle cx="-25" cy="-75" r="16" fill="none" stroke="#059669" stroke-width="2" opacity="0.5"/>
        <circle cx="-25" cy="-75" r="8" fill="#111827"/>
        <circle cx="-27" cy="-78" r="3" fill="#ffffff"/>
        <!-- Right soda glass lens -->
        <circle cx="25" cy="-75" r="23" fill="#e0f2fe" opacity="0.65" stroke="#047857" stroke-width="4"/>
        <circle cx="25" cy="-75" r="16" fill="none" stroke="#059669" stroke-width="2" opacity="0.5"/>
        <circle cx="25" cy="-75" r="8" fill="#111827"/>
        <circle cx="23" cy="-78" r="3" fill="#ffffff"/>
        <line x1="-2" y1="-75" x2="2" y2="-75" stroke="#047857" stroke-width="5"/>
        <!-- Hot cutting chai tumbler in hand -->
        <rect x="58" y="24" width="22" height="34" rx="4" fill="#94a3b8" stroke="#475569" stroke-width="2"/>
        <rect x="60" y="26" width="18" height="12" fill="#b45309" opacity="0.85"/>
        <!-- Steam rising from tea -->
        <path d="M 64 20 Q 62 10 66 2" fill="none" stroke="#e2e8f0" stroke-width="2" opacity="0.75"/>
        <path d="M 72 22 Q 74 12 70 4" fill="none" stroke="#e2e8f0" stroke-width="2" opacity="0.75"/>
        <text x="-90" y="-30" font-size="12" fill="#047857" font-weight="700">News 24x7</text>`;
    case "sundaram":
      // Brass sombu tumbler just out of reach + sleepy Zzz bubble
      return `
        <!-- Floating sleep Zzz -->
        <text x="64" y="-95" font-size="20" fill="#94a3b8" font-weight="900">Z</text>
        <text x="76" y="-112" font-size="16" fill="#cbd5e1" font-weight="900">z</text>
        <text x="86" y="-124" font-size="12" fill="#e2e8f0" font-weight="900">z</text>
        <!-- Brass Sombu (water container) lying out of reach -->
        <ellipse cx="-65" cy="140" rx="18" ry="12" fill="#d97706" stroke="#b45309" stroke-width="2"/>
        <ellipse cx="-65" cy="132" rx="10" ry="4" fill="#fbbf24"/>
        <text x="-80" y="120" font-size="11" fill="#78350f" font-weight="bold">Sombu</text>`;
    case "thangarasu":
      // Hands clutching head + steam puffs from ears + red panic alert
      return `
        <!-- Steam clouds shooting from ears -->
        <ellipse cx="-72" cy="-75" rx="12" ry="7" fill="#fee2e2" opacity="0.85" stroke="#ef4444" stroke-width="1.5"/>
        <ellipse cx="-86" cy="-78" rx="8" ry="5" fill="#fecaca" opacity="0.7"/>
        <ellipse cx="72" cy="-75" rx="12" ry="7" fill="#fee2e2" opacity="0.85" stroke="#ef4444" stroke-width="1.5"/>
        <ellipse cx="86" cy="-78" rx="8" ry="5" fill="#fecaca" opacity="0.7"/>
        <!-- Panic alert exclamation symbols -->
        <text x="-76" y="-108" font-size="28" fill="#dc2626" font-weight="900">❗</text>
        <text x="60" y="-108" font-size="28" fill="#dc2626" font-weight="900">❗</text>
        <!-- High blood pressure pulse -->
        <text x="-30" y="-128" font-size="14" fill="#b91c1c" font-weight="bold">BP: 220!!</text>`;
    case "dhandapani":
      // Turned inside-out empty wallet showing 0 ₹ + multi-crore thought bubble
      return `
        <!-- Empty wallet inside-out with 0 rupee symbol -->
        <rect x="56" y="25" width="30" height="22" rx="4" fill="#451a03" stroke="#292524" stroke-width="2"/>
        <path d="M 58 35 Q 71 45 84 35" fill="none" stroke="#78350f" stroke-width="2"/>
        <text x="71" y="42" font-size="11" fill="#ef4444" font-weight="bold" text-anchor="middle">0 ₹</text>
        <!-- Cobweb inside wallet -->
        <line x1="60" y1="28" x2="68" y2="35" stroke="#d6d3d1" stroke-width="1" opacity="0.7"/>
        <line x1="68" y1="28" x2="60" y2="35" stroke="#d6d3d1" stroke-width="1" opacity="0.7"/>
        <!-- Multi-crore imagination bubble -->
        <rect x="-105" y="-120" width="76" height="28" rx="8" fill="#1e3a8a" stroke="#60a5fa" stroke-width="1.5"/>
        <text x="-67" y="-102" font-size="12" fill="#fbbf24" font-weight="bold" text-anchor="middle">₹1000 Cr!</text>
        <circle cx="-50" cy="-86" r="4" fill="#1e3a8a"/>
        <circle cx="-42" cy="-76" r="2.5" fill="#1e3a8a"/>`;
    case "velu":
      // Tea tumbler in hand + wisdom pose arms folded
      return `
        <rect x="55" y="30" width="22" height="30" rx="6" fill="#9ca3af" stroke="#6b7280" stroke-width="2"/>
        <rect x="55" y="30" width="22" height="8" rx="3" fill="#d1d5db"/>
        <path d="M 77 38 Q 87 38 87 50 Q 87 62 77 62" fill="none" stroke="#9ca3af" stroke-width="3"/>
        <text x="-100" y="-80" font-size="11" fill="#374151" opacity="0.6">Experience!</text>`;
    case "selvam":
      // Dramatic wet eyes + hand on chest + sky pointing
      return `
        <ellipse cx="-24" cy="-58" rx="4" ry="7" fill="#60a5fa" opacity="0.7"/>
        <ellipse cx="24" cy="-58" rx="4" ry="7" fill="#60a5fa" opacity="0.7"/>
        <text x="-100" y="-110" font-size="18" fill="#9f1239" opacity="0.5">🎵</text>
        <text x="72" y="-105" font-size="14" fill="#9f1239" opacity="0.4">♪</text>
        <text x="62" y="-88" font-size="20" fill="#f59e0b" opacity="0.6">☝️</text>`;
    case "chandran":
      // Helmet on top of head + visor
      return `
        <ellipse cx="0" cy="-118" rx="56" ry="32" fill="#0369a1" stroke="#0c4a6e" stroke-width="4"/>
        <ellipse cx="0" cy="-118" rx="44" ry="20" fill="#0ea5e9" opacity="0.4"/>
        <rect x="-22" y="-104" width="44" height="8" rx="4" fill="#0284c7" opacity="0.6"/>
        <path d="M -40 -112 Q 0 -100 40 -112 L 36 -104 Q 0 -94 -36 -104 Z" fill="#1e293b" opacity="0.7"/>`;
    default:
      return "";
  }
}

function renderCharacterBase(c: CharacterDefinition, pose: string): string {
  let armsSvg = "";
  let mouthSvg = "";
  let eyebrowsSvg = "";
  let extraFx = "";

  if (pose === "dancing") {
    armsSvg = `
      <path d="M -50 10 Q -90 -28 -84 -62 Q -73 -72 -63 -56 Q -64 -26 -40 22 Z" fill="${c.shirtColor}" />
      <circle cx="-79" cy="-66" r="15" fill="${c.skinColor}" />
      <path d="M 50 10 Q 90 -28 84 -62 Q 73 -72 63 -56 Q 64 -26 40 22 Z" fill="${c.shirtColor}" />
      <circle cx="79" cy="-66" r="15" fill="${c.skinColor}" />`;
    mouthSvg = `<path d="M -28 -42 Q 0 -28 28 -42 Q 24 -8 0 -8 Q -24 -8 -28 -42 Z" fill="#991b1b" stroke="#450a0a" stroke-width="3"/>
      <ellipse cx="0" cy="-18" rx="13" ry="7" fill="#fb7185"/>
      <path d="M -20 -41 Q 0 -35 20 -41 L 18 -37 Q 0 -31 -18 -37 Z" fill="#ffffff"/>`;
    eyebrowsSvg = `<path d="M -38 -110 Q -22 -120 -8 -110" stroke="${c.hairColor}" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M 8 -110 Q 22 -120 38 -110" stroke="${c.hairColor}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
    extraFx = `<text x="68" y="-100" font-size="30" fill="#f59e0b">🎵</text><text x="-92" y="-88" font-size="26" fill="#ec4899">✨</text>`;
  } else if (pose === "singing") {
    armsSvg = `
      <path d="M -50 10 Q -70 40 -54 70 Q -42 76 -38 60 Q -48 35 -32 20 Z" fill="${c.shirtColor}" />
      <circle cx="-48" cy="72" r="14" fill="${c.skinColor}" />
      <path d="M 50 10 Q 90 -16 84 -50 Q 73 -60 63 -46 Q 63 -16 40 22 Z" fill="${c.shirtColor}" />
      <circle cx="79" cy="-54" r="15" fill="${c.skinColor}" />
      <rect x="75" y="-88" width="10" height="36" rx="4" fill="#64748b"/>
      <circle cx="80" cy="-88" r="13" fill="#fbbf24" stroke="#d97706" stroke-width="2"/>`;
    mouthSvg = `<path d="M -24 -44 Q 0 -32 24 -44 Q 20 -4 0 -4 Q -20 -4 -24 -44 Z" fill="#991b1b" stroke="#450a0a" stroke-width="3"/>
      <ellipse cx="0" cy="-14" rx="12" ry="6" fill="#fb7185"/>`;
    eyebrowsSvg = `<path d="M -38 -112 Q -22 -122 -8 -112" stroke="${c.hairColor}" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M 8 -112 Q 22 -122 38 -112" stroke="${c.hairColor}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
    extraFx = `<text x="-96" y="-78" font-size="28" fill="#a78bfa">🎤</text>`;
  } else if (pose === "surprised" || c.id === "thangarasu") {
    armsSvg = `
      <path d="M -50 10 Q -84 -10 -78 -48 Q -68 -56 -58 -42 Q -56 -12 -40 22 Z" fill="${c.shirtColor}" />
      <circle cx="-74" cy="-52" r="14" fill="${c.skinColor}" />
      <path d="M 50 10 Q 84 -10 78 -48 Q 68 -56 58 -42 Q 56 -12 40 22 Z" fill="${c.shirtColor}" />
      <circle cx="74" cy="-52" r="14" fill="${c.skinColor}" />`;
    mouthSvg = `<ellipse cx="0" cy="-36" rx="16" ry="18" fill="#991b1b" stroke="#450a0a" stroke-width="3"/>
      <ellipse cx="0" cy="-32" rx="10" ry="12" fill="#7f1d1d"/>`;
    eyebrowsSvg = `<path d="M -40 -120 Q -22 -132 -8 -120" stroke="${c.hairColor}" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M 8 -120 Q 22 -132 40 -120" stroke="${c.hairColor}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
    extraFx = `<text x="-98" y="-105" font-size="28" fill="#f59e0b">😱</text>`;
  } else if (pose === "thinking") {
    armsSvg = `
      <path d="M -50 10 Q -72 36 -56 64 Q -44 68 -38 55 Q -48 30 -32 20 Z" fill="${c.shirtColor}" />
      <circle cx="-52" cy="66" r="14" fill="${c.skinColor}" />
      <path d="M 50 10 Q 76 2 52 -21 Q 42 -26 32 -17 Q 42 2 36 22 Z" fill="${c.shirtColor}" />
      <circle cx="30" cy="-24" r="14" fill="${c.skinColor}" />`;
    mouthSvg = `<path d="M -14 -38 Q 0 -26 14 -38" stroke="#713f12" stroke-width="4" stroke-linecap="round" fill="none"/>`;
    eyebrowsSvg = `<path d="M -38 -110 Q -22 -116 -8 -114" stroke="${c.hairColor}" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M 8 -122 Q 22 -128 38 -118" stroke="${c.hairColor}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
    extraFx = `<text x="56" y="-116" font-size="32" fill="#f59e0b">💡</text>`;
  } else {
    // Default: pointing / happy
    armsSvg = `
      <path d="M -50 10 Q -70 40 -54 70 Q -42 76 -38 60 Q -48 35 -32 20 Z" fill="${c.shirtColor}" />
      <circle cx="-48" cy="72" r="14" fill="${c.skinColor}" />
      <path d="M 50 10 Q 90 -36 70 -86 Q 60 -91 50 -76 Q 55 -26 40 22 Z" fill="${c.shirtColor}" />
      <circle cx="65" cy="-91" r="15" fill="${c.skinColor}" />
      <path d="M 65 -91 L 68 -119 L 76 -117 L 73 -89 Z" fill="${c.skinColor}"/>`;
    mouthSvg = `<path d="M -22 -44 Q 0 -32 22 -44 Q 18 -12 0 -12 Q -18 -12 -22 -44 Z" fill="#991b1b" stroke="#450a0a" stroke-width="3"/>
      <ellipse cx="0" cy="-22" rx="10" ry="6" fill="#fb7185"/>`;
    eyebrowsSvg = `<path d="M -38 -112 Q -22 -122 -8 -112" stroke="${c.hairColor}" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M 8 -112 Q 22 -122 38 -112" stroke="${c.hairColor}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
  }

  // ── Hair style per character ──
  let hairSvg = "";
  if (c.id === "velu" || c.id === "sodamani") {
    // Receding / short salt-and-pepper hair
    hairSvg = `<path d="M -55 -80 Q -44 -110 0 -112 Q 44 -110 55 -80 Q 36 -100 0 -98 Q -36 -100 -55 -80 Z" fill="${c.hairColor}" />`;
  } else if (c.id === "chandran") {
    // Helmet covers hair
    hairSvg = `<path d="M -60 -82 Q -62 -118 0 -120 Q 62 -118 60 -82 Q 44 -108 0 -104 Q -44 -108 -60 -82 Z" fill="${c.hairColor}" />`;
  } else if (c.id === "selvam") {
    // Slightly wavy dramatic hair
    hairSvg = `<path d="M -68 -82 Q -72 -148 0 -150 Q 72 -148 68 -82 Q 52 -120 24 -115 Q 0 -122 -24 -115 Q -52 -120 -68 -82 Z" fill="${c.hairColor}" />`;
  } else if (c.id === "thangarasu") {
    // Spiked panic hair standing upright from fear/tension
    hairSvg = `
      <path d="M -60 -80 L -72 -140 L -46 -115 L -26 -155 L -6 -120 L 14 -160 L 32 -122 L 56 -146 L 60 -80 Z" fill="${c.hairColor}" />`;
  } else if (c.id === "aarumugam") {
    // Extra tall puffed pompadour mass hero hair
    hairSvg = `
      <path d="M -68 -82 Q -80 -165 0 -170 Q 80 -165 68 -82 Q 48 -124 0 -125 Q -48 -124 -68 -82 Z" fill="${c.hairColor}" />
      <path d="M -40 -145 Q 0 -185 35 -145 Q 0 -155 -40 -145 Z" fill="${c.hairColor}" />`;
  } else if (c.id === "sundaram") {
    // Messy bed head hair
    hairSvg = `
      <path d="M -64 -80 Q -76 -130 -42 -126 Q -30 -145 0 -135 Q 30 -148 44 -128 Q 72 -132 64 -80 Z" fill="${c.hairColor}" />`;
  } else {
    // Standard hero / clean hair
    hairSvg = `<path d="M -68 -82 Q -72 -148 0 -150 Q 72 -148 68 -82 Q 48 -118 0 -118 Q -48 -118 -68 -82 Z" fill="${c.hairColor}" />
      <path d="M -36 -133 Q 0 -168 26 -138 Q 0 -144 -36 -133 Z" fill="${c.hairColor}" />`;
  }

  // ── Eyes per character ──
  const isSleepy = c.id === "babu" || c.id === "sundaram";
  const eyeY = isSleepy ? "-85" : "-78";
  let eyesSvg = `
    <ellipse cx="-24" cy="${eyeY}" rx="17" ry="21" fill="#ffffff" stroke="#0f172a" stroke-width="3"/>
    <ellipse cx="24" cy="${eyeY}" rx="17" ry="21" fill="#ffffff" stroke="#0f172a" stroke-width="3"/>
    <ellipse cx="-20" cy="${eyeY}" rx="10" ry="14" fill="#1e293b"/>
    <ellipse cx="28" cy="${eyeY}" rx="10" ry="14" fill="#1e293b"/>
    <circle cx="-22" cy="${parseInt(eyeY) - 5}" r="4" fill="#ffffff"/>
    <circle cx="-17" cy="${parseInt(eyeY) + 4}" r="2" fill="#ffffff"/>
    <circle cx="26" cy="${parseInt(eyeY) - 5}" r="4" fill="#ffffff"/>
    <circle cx="31" cy="${parseInt(eyeY) + 4}" r="2" fill="#ffffff"/>`;

  if (isSleepy) {
    // Half-closed sleepy eyelids
    eyesSvg += `
      <rect x="-41" width="34" height="${pose === "dancing" ? 8 : 12}" rx="4" fill="${c.hairColor}" opacity="0.65" y="-92"/>
      <rect x="7" width="34" height="${pose === "dancing" ? 8 : 12}" rx="4" fill="${c.hairColor}" opacity="0.65" y="-92"/>`;
  }

  // ── Bottom clothing ──
  let bottomClothing = "";
  if (c.id === "velu" || c.id === "sodamani" || c.id === "sundaram") {
    // Dhoti / Veshti / Lungi
    const borderCol = c.id === "sodamani" ? "#fbbf24" : "#9ca3af";
    bottomClothing = `
      <path d="M -52 72 L 52 72 L 58 134 L -58 134 Z" fill="${c.bottomColor}"/>
      <rect x="-52" y="68" width="104" height="10" rx="3" fill="${borderCol}" />`;
  } else {
    bottomClothing = `
      <path d="M -48 74 L 48 74 L 42 126 L 6 126 L 0 96 L -6 126 L -42 126 Z" fill="${c.bottomColor}" />
      <rect x="-48" y="70" width="96" height="10" rx="4" fill="${c.bottomColor}" />`;
  }

  // ── Body width / posture ──
  const bodyPath =
    c.id === "pandi"
      ? `<path d="M -64 0 Q -68 44 -58 78 L 58 78 Q 68 44 64 0 Z" fill="${c.shirtColor}" />`
      : `<path d="M -54 0 Q -58 40 -50 76 L 50 76 Q 58 40 54 0 Z" fill="${c.shirtColor}" />`;

  const neckRect = `<rect x="-16" y="-18" width="32" height="24" rx="6" fill="${c.skinColor}" />`;
  const headCircle = `<circle cx="0" cy="-75" r="70" fill="${c.skinColor}" />`;
  const cheeks = `
    <ellipse cx="-42" cy="-55" rx="13" ry="8" fill="#fb7185" opacity="${c.id === "thangarasu" ? "0.85" : "0.55"}"/>
    <ellipse cx="42" cy="-55" rx="13" ry="8" fill="#fb7185" opacity="${c.id === "thangarasu" ? "0.85" : "0.55"}"/>`;
  const nose = `<circle cx="0" cy="-58" r="5" fill="#c0683a" />`;
  const leftShoe = `<ellipse cx="-26" cy="180" rx="22" ry="13" fill="${c.shoeColor}" /><ellipse cx="-26" cy="188" rx="22" ry="6" fill="#ffffff" opacity="0.4"/>`;
  const rightShoe = `<ellipse cx="26" cy="180" rx="22" ry="13" fill="${c.shoeColor}" /><ellipse cx="26" cy="188" rx="22" ry="6" fill="#ffffff" opacity="0.4"/>`;
  const legs = `
    <rect x="-36" y="112" width="22" height="58" rx="10" fill="${c.skinColor}" />
    <rect x="14" y="112" width="22" height="58" rx="10" fill="${c.skinColor}" />`;

  const accessorySvg = getCharacterAccessorySvg(c);

  return `
    ${legs}
    ${leftShoe}
    ${rightShoe}
    ${bottomClothing}
    ${bodyPath}
    ${armsSvg}
    ${extraFx}
    ${neckRect}
    ${headCircle}
    ${cheeks}
    ${eyesSvg}
    ${eyebrowsSvg}
    ${nose}
    ${mouthSvg}
    ${hairSvg}
    ${accessorySvg}
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE BACKGROUNDS
// ─────────────────────────────────────────────────────────────────────────────

function buildSceneBackground(width: number, height: number, isKuthu = false): string {
  if (isKuthu) {
    return `
      <defs>
        <radialGradient id="stageBg" cx="50%" cy="60%" r="70%">
          <stop offset="0%" stop-color="#4f0082" />
          <stop offset="60%" stop-color="#1a0038" />
          <stop offset="100%" stop-color="#000000" />
        </radialGradient>
        <filter id="popShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000000" flood-opacity="0.4" />
        </filter>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#stageBg)" />
      <path d="M 0 ${height * 0.72} Q ${width / 2} ${height * 0.62} ${width} ${height * 0.72} L ${width} ${height} L 0 ${height} Z" fill="#2d0060" />
      <line x1="0" y1="${height * 0.72}" x2="${width}" y2="${height * 0.72}" stroke="#facc15" stroke-width="6" opacity="0.8" />
      <!-- Disco lights -->
      <polygon points="${width * 0.1},0 ${width * 0.28},${height} ${width * 0.38},${height} ${width * 0.14},0" fill="#ec4899" opacity="0.14" />
      <polygon points="${width * 0.9},0 ${width * 0.72},${height} ${width * 0.62},${height} ${width * 0.86},0" fill="#38bdf8" opacity="0.14" />
      <polygon points="${width * 0.5},0 ${width * 0.35},${height} ${width * 0.65},${height}" fill="#facc15" opacity="0.12" />
      <!-- Dance banner -->
      <g transform="translate(${width / 2 - 220}, 42)" filter="url(#popShadow)">
        <rect width="440" height="64" rx="32" fill="#dc2626" stroke="#facc15" stroke-width="4" />
        <text x="220" y="42" font-family="Arial,sans-serif" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle">
          ⚡ ${escapeXml(KUTHU_DANCE_SONG.titleTamil)} ⚡
        </text>
      </g>`;
  }

  // Outdoor comedic village / town street scene
  return `
    <defs>
      <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="60%" stop-color="#bae6fd" />
        <stop offset="100%" stop-color="#fef08a" />
      </linearGradient>
      <linearGradient id="groundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#4ade80" />
        <stop offset="10%" stop-color="#22c55e" />
        <stop offset="100%" stop-color="#15803d" />
      </linearGradient>
      <linearGradient id="roadGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#78716c" />
        <stop offset="100%" stop-color="#44403c" />
      </linearGradient>
      <filter id="popShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000000" flood-opacity="0.3" />
      </filter>
    </defs>
    <!-- Sky -->
    <rect width="${width}" height="${height * 0.68}" fill="url(#skyGrad)" />
    <!-- Sun -->
    <circle cx="${width * 0.88}" cy="${height * 0.18}" r="${width * 0.08}" fill="#facc15" opacity="0.9" />
    <circle cx="${width * 0.88}" cy="${height * 0.18}" r="${width * 0.11}" fill="#fef08a" opacity="0.3" />
    <!-- Distant hills / town buildings -->
    <path d="M 0 ${height * 0.58} Q ${width * 0.25} ${height * 0.44} ${width * 0.5} ${height * 0.56} Q ${width * 0.75} ${height * 0.46} ${width} ${height * 0.54} L ${width} ${height * 0.68} L 0 ${height * 0.68} Z" fill="#86efac" opacity="0.7" />
    <!-- Tea stall & shop roofs in background -->
    <rect x="${width * 0.04}" y="${height * 0.46}" width="${width * 0.22}" height="${height * 0.22}" fill="#fb923c" rx="8"/>
    <polygon points="${width * 0.02},${height * 0.46} ${width * 0.15},${height * 0.38} ${width * 0.28},${height * 0.46}" fill="#ea580c"/>
    <text x="${width * 0.15}" y="${height * 0.54}" font-family="Arial,sans-serif" font-size="${width * 0.016}" font-weight="900" fill="#ffffff" text-anchor="middle">☕ SODA MANI TEA</text>
    <!-- Ground / grass -->
    <rect y="${height * 0.68}" width="${width}" height="${height * 0.32}" fill="url(#groundGrad)" />
    <!-- Street road -->
    <path d="M 0 ${height * 0.78} L ${width} ${height * 0.78} L ${width} ${height} L 0 ${height} Z" fill="url(#roadGrad)" />
    <!-- Road center dashed line -->
    <line x1="0" y1="${height * 0.89}" x2="${width}" y2="${height * 0.89}" stroke="#facc15" stroke-width="6" stroke-dasharray="36,24" />
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE GENERATION
// ─────────────────────────────────────────────────────────────────────────────

export async function generateCartoonSceneVisual(options: SceneVisualOptions): Promise<string> {
  const dir = path.dirname(options.outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const isShorts = options.format === "SHORTS";
  const width = isShorts ? 1080 : 1920;
  const height = isShorts ? 1920 : 1080;
  const isKuthu = options.isKuthuDanceScene === true;

  // Parse character IDs from activeCharacterIds or visualPrompt
  const charIds =
    options.activeCharacterIds && options.activeCharacterIds.length > 0
      ? options.activeCharacterIds.slice(0, isShorts ? 2 : 4)
      : parseCharactersFromPrompt(options.visualPrompt, isShorts ? 2 : 3);

  const groundY = isShorts ? height * 0.74 : height * 0.78;
  const positions = getCharacterPositions(charIds, width, groundY, isShorts);

  const pose = isKuthu
    ? "dancing"
    : (options.characterPose ||
        (["dancing", "singing", "pointing", "thinking", "surprised"] as const)[options.orderIndex % 5]);

  const rawSpeech =
    options.captionText ||
    (isKuthu
      ? KUTHU_DANCE_SONG.lyrics[options.orderIndex % KUTHU_DANCE_SONG.lyrics.length]
      : options.narration);
  const wrappedSpeech = wrapText(rawSpeech, isShorts ? 18 : 26);

  const bubbleW = isShorts ? width * 0.86 : width * 0.50;
  const bubbleX = isShorts ? width * 0.07 : width * 0.06;
  const bubbleY = isShorts ? height * 0.17 : height * 0.22;

  const speechLinesSvg = wrappedSpeech
    .map((line, i) => `<tspan x="${bubbleW / 2}" dy="${i === 0 ? 0 : isShorts ? 54 : 48}">${escapeXml(line)}</tspan>`)
    .join("");

  const channelBadge = isKuthu ? `⚡ ${KUTHU_DANCE_SONG.title} 🎵` : `🎬 Happy Kuttu Song 🌟`;
  const bottomHint = isKuthu
    ? "👍 Like & Subscribe — More Comedy Episodes Coming!"
    : options.visualPrompt?.slice(0, 55) || "Like & Subscribe to Happy Kuttu Song!";

  const charsSvg = positions
    .map(({ x, y, scale, charId }) => {
      try {
        const c = getCharacter(charId);
        return `<g transform="translate(${x}, ${y}) scale(${scale})" filter="url(#popShadow)">
          ${renderCharacterBase(c, pose)}
          <g transform="translate(-64, 215)">
            <rect width="128" height="34" rx="17" fill="#000000" fill-opacity="0.75"/>
            <text x="64" y="23" font-family="Arial,sans-serif" font-size="15" font-weight="700" fill="#facc15" text-anchor="middle">${escapeXml(c.name)}</text>
          </g>
        </g>`;
      } catch {
        return "";
      }
    })
    .join("\n");

  const bg = buildSceneBackground(width, height, isKuthu);

  const svgContent = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    ${bg}
    ${charsSvg}
    <!-- Top channel badge -->
    <g transform="translate(${width / 2 - 250}, ${isShorts ? 84 : 38})" filter="url(#popShadow)">
      <rect width="500" height="54" rx="27" fill="${isKuthu ? '#7c3aed' : '#e11d48'}" stroke="#ffffff" stroke-width="3" />
      <text x="250" y="36" font-family="Arial,sans-serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">
        ${escapeXml(channelBadge)}
      </text>
    </g>
    <!-- Speech bubble -->
    <g transform="translate(${bubbleX}, ${bubbleY})" filter="url(#popShadow)">
      <rect width="${bubbleW}" height="${isShorts ? 234 : 198}" rx="30" fill="#ffffff" stroke="${isKuthu ? '#a855f7' : '#fbbf24'}" stroke-width="7" />
      <polygon points="${bubbleW * 0.5},${isShorts ? 234 : 198} ${bubbleW * 0.56},${isShorts ? 276 : 238} ${bubbleW * 0.62},${isShorts ? 234 : 198}" fill="#ffffff" stroke="${isKuthu ? '#a855f7' : '#fbbf24'}" stroke-width="7" stroke-linejoin="round" />
      <polygon points="${bubbleW * 0.5 + 2},${isShorts ? 232 : 196} ${bubbleW * 0.56},${isShorts ? 272 : 234} ${bubbleW * 0.62 - 2},${isShorts ? 232 : 196}" fill="#ffffff" />
      <text x="${bubbleW / 2}" y="${isShorts ? 74 : 62}"
        font-family="Arial,'Noto Sans Tamil','Latha',sans-serif"
        font-size="${isShorts ? 38 : 30}"
        font-weight="900"
        fill="${isKuthu ? '#4c1d95' : '#1e1b4b'}"
        text-anchor="middle">
        ${speechLinesSvg}
      </text>
    </g>
    <!-- Bottom bar -->
    <g transform="translate(${width * 0.04}, ${height - (isShorts ? 186 : 108)})" filter="url(#popShadow)">
      <rect width="${width * 0.92}" height="${isShorts ? 82 : 64}" rx="20" fill="#000000" fill-opacity="0.84" stroke="#facc15" stroke-width="3" />
      <text x="${(width * 0.92) / 2}" y="${isShorts ? 52 : 42}"
        font-family="Arial,sans-serif"
        font-size="${isShorts ? 28 : 22}"
        font-weight="800"
        fill="#fef08a"
        text-anchor="middle">
        ${escapeXml(bottomHint)}
      </text>
    </g>
  </svg>`;

  await sharp(Buffer.from(svgContent)).png().toFile(options.outputPath);
  return options.outputPath;
}

function parseCharactersFromPrompt(visualPrompt: string | undefined, maxCount: number): string[] {
  if (!visualPrompt) return [CAST[0].id, CAST[1].id].slice(0, maxCount);
  const match = visualPrompt.match(/\[Characters?:\s*([^\]]+)\]/i);
  if (match) {
    const rawTokens = match[1].split(",").map((s) => s.trim().toLowerCase());
    const valid: string[] = [];
    for (const token of rawTokens) {
      const found = CAST.find(
        (c) =>
          c.id === token ||
          c.name.toLowerCase().includes(token) ||
          c.nickname.toLowerCase().includes(token) ||
          token.includes(c.id)
      );
      if (found && !valid.includes(found.id)) {
        valid.push(found.id);
      }
    }
    if (valid.length > 0) return valid.slice(0, maxCount);
  }
  // Fallback: rotate through first characters
  return CAST.slice(0, maxCount).map((c) => c.id);
}

function getCharacterPositions(
  charIds: string[],
  width: number,
  groundY: number,
  isShorts: boolean
): Array<{ x: number; y: number; scale: number; charId: string }> {
  const count = charIds.length;
  if (count <= 1) {
    return [{ x: isShorts ? width / 2 : width * 0.65, y: groundY, scale: isShorts ? 1.2 : 1.05, charId: charIds[0] || CAST[0].id }];
  }
  if (count === 2) {
    return [
      { x: width * 0.35, y: groundY, scale: 0.92, charId: charIds[0] },
      { x: width * 0.68, y: groundY, scale: 0.92, charId: charIds[1] },
    ];
  }
  if (count === 3) {
    return [
      { x: width * 0.22, y: groundY, scale: 0.84, charId: charIds[0] },
      { x: width * 0.50, y: groundY, scale: 0.84, charId: charIds[1] },
      { x: width * 0.76, y: groundY, scale: 0.84, charId: charIds[2] },
    ];
  }
  return [
    { x: width * 0.16, y: groundY, scale: 0.76, charId: charIds[0] },
    { x: width * 0.38, y: groundY, scale: 0.76, charId: charIds[1] },
    { x: width * 0.62, y: groundY, scale: 0.76, charId: charIds[2] },
    { x: width * 0.84, y: groundY, scale: 0.76, charId: charIds[3] },
  ];
}

export async function generateSceneImage(options: SceneVisualOptions): Promise<string> {
  if (options.style === "cartoon" || options.theme === "cartoon" || options.language === "Tamil") {
    return generateCartoonSceneVisual(options);
  }
  const dir = path.dirname(options.outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const isShorts = options.format === "SHORTS";
  const width = isShorts ? 1080 : 1920;
  const height = isShorts ? 1920 : 1080;
  const palette = GRADIENT_PALETTES[options.orderIndex % GRADIENT_PALETTES.length];
  const wrappedLines = wrapText(options.captionText || options.visualPrompt || options.narration, isShorts ? 24 : 38);
  const linesSvg = wrappedLines
    .map((line, i) => `<tspan x="${width / 2}" dy="${i === 0 ? 0 : isShorts ? 64 : 56}" font-weight="800">${escapeXml(line)}</tspan>`)
    .join("");
  const svgContent = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${palette.start}" /><stop offset="50%" stop-color="${palette.mid}" /><stop offset="100%" stop-color="${palette.end}" />
      </linearGradient>
      <filter id="shadow"><feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.8" /></filter>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)" />
    <g filter="url(#shadow)">
      <text x="${width / 2}" y="${isShorts ? height / 2 - 40 : height / 2 - 20}" font-family="Arial,sans-serif" font-size="${isShorts ? 48 : 42}" fill="#ffffff" text-anchor="middle">${linesSvg}</text>
    </g>
  </svg>`;
  await sharp(Buffer.from(svgContent)).png().toFile(options.outputPath);
  return options.outputPath;
}

export async function generateThumbnail(options: ThumbnailOptions): Promise<string> {
  const dir = path.dirname(options.outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const isShorts = options.format === "SHORTS";
  const width = isShorts ? 1080 : 1920;
  const height = isShorts ? 1920 : 1080;

  if (options.style === "cartoon" || options.language === "Tamil") {
    const badge = options.badge || (options.language === "Tamil" ? "🎬 நகைச்சுவை காட்சி! 🔥" : "EPIC EPISODE 🔥");
    const titleLines = wrapText(options.title, isShorts ? 14 : 22).slice(0, 3);
    const linesSvg = titleLines
      .map((line, i) => `<tspan x="${(isShorts ? width * 0.88 : width * 0.54) / 2}" dy="${i === 0 ? 0 : isShorts ? 68 : 60}">${escapeXml(line)}</tspan>`)
      .join("");

    // Feature characters in thumbnail (e.g. Senthil + Aarumugam + Balu)
    const featuredCast = [CAST[0], CAST[7] || CAST[1], CAST[8] || CAST[2]];
    const thumbPositions = isShorts
      ? [
          { x: width * 0.28, y: height * 0.76 },
          { x: width * 0.72, y: height * 0.76 },
        ]
      : [
          { x: width * 0.65, y: height * 0.82 },
          { x: width * 0.84, y: height * 0.82 },
        ];

    const thumbCharsSvg = featuredCast
      .slice(0, isShorts ? 2 : 2)
      .map((c, i) => {
        const pos = thumbPositions[i];
        const scale = isShorts ? (i === 1 ? 1.0 : 0.82) : i === 0 ? 0.96 : 0.76;
        return `<g transform="translate(${pos.x}, ${pos.y}) scale(${scale})" filter="url(#popShadow)">${renderCharacterBase(c, "dancing")}</g>`;
      })
      .join("\n");

    const bg = buildSceneBackground(width, height, false);
    const svgContent = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      ${bg}
      ${thumbCharsSvg}
      <g transform="translate(${isShorts ? width / 2 - 220 : width * 0.05}, ${isShorts ? 126 : 68})" filter="url(#popShadow)">
        <rect width="${isShorts ? 440 : 460}" height="58" rx="29" fill="#e11d48" stroke="#ffffff" stroke-width="4" />
        <text x="${isShorts ? 220 : 230}" y="39" font-family="Arial,sans-serif" font-size="24" font-weight="900" fill="#ffffff" text-anchor="middle">
          ${escapeXml(badge)}
        </text>
      </g>
      <g transform="translate(${isShorts ? width * 0.06 : width * 0.05}, ${isShorts ? 214 : 154})" filter="url(#popShadow)">
        <rect width="${isShorts ? width * 0.88 : width * 0.54}" height="${isShorts ? 298 : 268}" rx="30" fill="#ffffff" stroke="#facc15" stroke-width="10" />
        <text x="${(isShorts ? width * 0.88 : width * 0.54) / 2}" y="${isShorts ? 88 : 82}"
          font-family="Arial,sans-serif" font-size="${isShorts ? 50 : 46}" font-weight="900" fill="#1e1b4b" text-anchor="middle">
          ${linesSvg}
        </text>
      </g>
      ${options.hook ? `
      <g transform="translate(${width * 0.05}, ${height - (isShorts ? 172 : 94)})" filter="url(#popShadow)">
        <rect width="${width * 0.9}" height="${isShorts ? 76 : 60}" rx="20" fill="#dc2626" stroke="#facc15" stroke-width="4" />
        <text x="${(width * 0.9) / 2}" y="${isShorts ? 48 : 38}" font-family="Arial,sans-serif" font-size="${isShorts ? 28 : 22}" font-weight="900" fill="#ffffff" text-anchor="middle">
          🔥 ${escapeXml(options.hook.slice(0, 44))} 🔥
        </text>
      </g>` : ""}
    </svg>`;
    await sharp(Buffer.from(svgContent)).png().toFile(options.outputPath);
    return options.outputPath;
  }

  // Fallback gradient thumbnail
  const titleLines = wrapText(options.title.toUpperCase(), isShorts ? 18 : 26).slice(0, 3);
  const linesSvg = titleLines
    .map((line, i) => `<tspan x="${width / 2}" dy="${i === 0 ? 0 : isShorts ? 92 : 84}">${escapeXml(line)}</tspan>`)
    .join("");
  const svgContent = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="tbg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#020617" /><stop offset="40%" stop-color="#1e1b4b" /><stop offset="100%" stop-color="#4c0519" />
      </linearGradient>
      <filter id="glow"><feDropShadow dx="0" dy="6" stdDeviation="16" flood-color="#000000" flood-opacity="0.9" /></filter>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#tbg)" />
    <g filter="url(#glow)">
      <text x="${width / 2}" y="${isShorts ? height / 2 - 50 : height / 2 - 30}" font-family="Arial,sans-serif" font-size="${isShorts ? 72 : 68}" font-weight="900" fill="#facc15" text-anchor="middle">${linesSvg}</text>
    </g>
  </svg>`;
  await sharp(Buffer.from(svgContent)).png().toFile(options.outputPath);
  return options.outputPath;
}
