import sharp from "sharp";
import fs from "fs";
import path from "path";

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
  { start: "#0f172a", mid: "#1e1b4b", end: "#311042", accent: "#38bdf8" }, // Indigo / Violet
  { start: "#09090b", mid: "#18181b", end: "#27272a", accent: "#f59e0b" }, // Cyber Slate / Amber
  { start: "#042f2e", mid: "#064e3b", end: "#022c22", accent: "#34d399" }, // Emerald
  { start: "#450a0a", mid: "#7f1d1d", end: "#1c1917", accent: "#f87171" }, // Crimson Dark
  { start: "#172554", mid: "#1e3a8a", end: "#0f172a", accent: "#60a5fa" }, // Ocean Blue
];

/**
 * Escapes characters for safe SVG embedding.
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Splits text into wrapped lines for SVG.
 */
function wrapText(text: string, maxCharsPerLine: number = 32): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + " " + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.slice(0, 4);
}

/**
 * Builds the SVG markup for the animated cartoon character (Kuttu) with varying poses.
 */
function renderKuttuCharacter(pose: string = "dancing"): string {
  // Poses: dancing, singing, pointing, happy_wave, curious, surprised
  let leftArmSvg = "";
  let rightArmSvg = "";
  let extraAccessories = "";
  let mouthSvg = "";
  let eyebrowsSvg = "";

  if (pose === "singing") {
    // Left arm down/relaxed, Right arm holding microphone
    leftArmSvg = `<path d="M -50 15 Q -70 45 -55 75 Q -45 80 -40 65 Q -50 40 -35 25 Z" fill="#facc15" /><circle cx="-50" cy="78" r="14" fill="#fdba74" />`;
    rightArmSvg = `<path d="M 50 15 Q 90 -20 85 -55 Q 75 -65 65 -50 Q 65 -20 40 25 Z" fill="#facc15" /><circle cx="80" cy="-60" r="16" fill="#fdba74" />`;
    extraAccessories = `
      <!-- Golden Microphone -->
      <rect x="75" y="-95" width="10" height="40" rx="4" fill="#64748b" />
      <circle cx="80" cy="-95" r="14" fill="#fbbf24" stroke="#d97706" stroke-width="2" />
    `;
    mouthSvg = `
      <!-- Singing Mouth -->
      <path d="M -26 -45 Q 0 -35 26 -45 Q 22 -5 0 -5 Q -22 -5 -26 -45 Z" fill="#991b1b" stroke="#450a0a" stroke-width="3" />
      <ellipse cx="0" cy="-14" rx="12" ry="7" fill="#fb7185" />
      <path d="M -18 -44 Q 0 -38 18 -44 L 16 -40 Q 0 -34 -16 -40 Z" fill="#ffffff" />
    `;
    eyebrowsSvg = `
      <path d="M -40 -115 Q -25 -125 -12 -112" stroke="#1c1917" stroke-width="5" stroke-linecap="round" fill="none" />
      <path d="M 12 -112 Q 25 -125 40 -115" stroke="#1c1917" stroke-width="5" stroke-linecap="round" fill="none" />
    `;
  } else if (pose === "pointing") {
    // Left arm down, Right arm pointing up to speech bubble
    leftArmSvg = `<path d="M -50 15 Q -70 45 -55 75 Q -45 80 -40 65 Q -50 40 -35 25 Z" fill="#facc15" /><circle cx="-50" cy="78" r="14" fill="#fdba74" />`;
    rightArmSvg = `<path d="M 50 15 Q 90 -40 70 -90 Q 60 -95 50 -80 Q 55 -30 40 25 Z" fill="#facc15" /><circle cx="65" cy="-95" r="16" fill="#fdba74" />`;
    extraAccessories = `
      <!-- Pointing finger -->
      <path d="M 65 -95 L 68 -125 L 76 -123 L 73 -93 Z" fill="#fdba74" />
    `;
    mouthSvg = `
      <!-- Excited Talking Mouth -->
      <path d="M -24 -46 Q 0 -36 24 -46 Q 20 -15 0 -15 Q -20 -15 -24 -46 Z" fill="#991b1b" stroke="#450a0a" stroke-width="3" />
      <ellipse cx="0" cy="-22" rx="10" ry="6" fill="#fb7185" />
    `;
    eyebrowsSvg = `
      <path d="M -38 -118 Q -24 -128 -12 -116" stroke="#1c1917" stroke-width="5" stroke-linecap="round" fill="none" />
      <path d="M 12 -116 Q 24 -128 38 -118" stroke="#1c1917" stroke-width="5" stroke-linecap="round" fill="none" />
    `;
  } else if (pose === "curious" || pose === "thinking") {
    // Hand on chin, thoughtful look
    leftArmSvg = `<path d="M -50 15 Q -75 40 -60 70 Q -48 72 -42 60 Q -52 35 -35 20 Z" fill="#facc15" /><circle cx="-55" cy="72" r="14" fill="#fdba74" />`;
    rightArmSvg = `<path d="M 50 15 Q 75 0 50 -25 Q 40 -30 30 -20 Q 40 0 35 25 Z" fill="#facc15" /><circle cx="28" cy="-28" r="15" fill="#fdba74" />`;
    extraAccessories = `
      <!-- Floating Thought Sparkle -->
      <text x="65" y="-120" font-size="36" fill="#f59e0b">💡</text>
    `;
    mouthSvg = `
      <!-- Small cute smiling mouth -->
      <path d="M -16 -40 Q 0 -28 16 -40" stroke="#713f12" stroke-width="4" stroke-linecap="round" fill="none" />
    `;
    eyebrowsSvg = `
      <path d="M -40 -112 Q -25 -118 -10 -116" stroke="#1c1917" stroke-width="5" stroke-linecap="round" fill="none" />
      <path d="M 10 -124 Q 25 -130 40 -120" stroke="#1c1917" stroke-width="5" stroke-linecap="round" fill="none" />
    `;
  } else {
    // Default: Joyful Dancing Wave (both arms up)
    leftArmSvg = `<path d="M -50 15 Q -90 -20 -85 -55 Q -75 -65 -65 -50 Q -65 -20 -40 25 Z" fill="#facc15" /><circle cx="-80" cy="-60" r="16" fill="#fdba74" />`;
    rightArmSvg = `<path d="M 50 15 Q 90 -20 85 -55 Q 75 -65 65 -50 Q 65 -20 40 25 Z" fill="#facc15" /><circle cx="80" cy="-60" r="16" fill="#fdba74" />`;
    mouthSvg = `
      <!-- Wide joyful open smile -->
      <path d="M -30 -45 Q 0 -35 30 -45 Q 26 -10 0 -10 Q -26 -10 -30 -45 Z" fill="#991b1b" stroke="#450a0a" stroke-width="3" />
      <ellipse cx="0" cy="-18" rx="14" ry="8" fill="#fb7185" />
      <path d="M -22 -44 Q 0 -38 22 -44 L 20 -40 Q 0 -34 -20 -40 Z" fill="#ffffff" />
    `;
    eyebrowsSvg = `
      <path d="M -42 -112 Q -25 -122 -10 -112" stroke="#1c1917" stroke-width="5" stroke-linecap="round" fill="none" />
      <path d="M 10 -112 Q 25 -122 42 -112" stroke="#1c1917" stroke-width="5" stroke-linecap="round" fill="none" />
    `;
  }

  return `
    <!-- Legs & Sneakers -->
    <rect x="-38" y="110" width="24" height="65" rx="10" fill="#fdba74" />
    <rect x="14" y="110" width="24" height="65" rx="10" fill="#fdba74" />
    <!-- Red & White Sneakers -->
    <ellipse cx="-26" cy="180" rx="22" ry="14" fill="#ef4444" />
    <ellipse cx="-26" cy="188" rx="22" ry="6" fill="#ffffff" />
    <ellipse cx="26" cy="180" rx="22" ry="14" fill="#ef4444" />
    <ellipse cx="26" cy="188" rx="22" ry="6" fill="#ffffff" />

    <!-- Denim Shorts -->
    <path d="M -50 75 L 50 75 L 44 125 L 6 125 L 0 95 L -6 125 L -44 125 Z" fill="#2563eb" />
    <rect x="-50" y="70" width="100" height="12" rx="4" fill="#1d4ed8" />

    <!-- Yellow T-Shirt Body -->
    <path d="M -55 0 Q -58 40 -50 75 L 50 75 Q 58 40 55 0 Z" fill="#facc15" />
    <circle cx="0" cy="38" r="14" fill="#ea580c" />
    <text x="0" y="44" font-size="16" fill="#ffffff" text-anchor="middle">★</text>

    <!-- Arms -->
    ${leftArmSvg}
    ${rightArmSvg}
    ${extraAccessories}

    <!-- Neck -->
    <rect x="-18" y="-20" width="36" height="25" rx="6" fill="#fdba74" />

    <!-- Head -->
    <circle cx="0" cy="-75" r="72" fill="#fed7aa" />
    <!-- Cheeks Blush -->
    <ellipse cx="-44" cy="-55" rx="14" ry="8" fill="#fb7185" opacity="0.6" />
    <ellipse cx="44" cy="-55" rx="14" ry="8" fill="#fb7185" opacity="0.6" />

    <!-- Big Expressive Eyes -->
    <ellipse cx="-26" cy="-80" rx="18" ry="24" fill="#ffffff" stroke="#0f172a" stroke-width="3" />
    <ellipse cx="26" cy="-80" rx="18" ry="24" fill="#ffffff" stroke="#0f172a" stroke-width="3" />
    <!-- Pupils -->
    <ellipse cx="-22" cy="-80" rx="11" ry="16" fill="#1e293b" />
    <ellipse cx="30" cy="-80" rx="11" ry="16" fill="#1e293b" />
    <!-- Eye Sparkles -->
    <circle cx="-25" cy="-86" r="5" fill="#ffffff" />
    <circle cx="-19" cy="-76" r="2.5" fill="#ffffff" />
    <circle cx="27" cy="-86" r="5" fill="#ffffff" />
    <circle cx="33" cy="-76" r="2.5" fill="#ffffff" />

    <!-- Eyebrows -->
    ${eyebrowsSvg}

    <!-- Cute Button Nose -->
    <circle cx="0" cy="-60" r="5" fill="#ea580c" />

    <!-- Mouth -->
    ${mouthSvg}

    <!-- Hair -->
    <path d="M -72 -85 Q -75 -150 0 -150 Q 75 -150 72 -85 Q 50 -120 0 -120 Q -50 -120 -72 -85 Z" fill="#18181b" />
    <path d="M -40 -135 Q 0 -170 30 -140 Q 0 -145 -40 -135 Z" fill="#27272a" />
  `;
}

/**
 * Generates an animated cartoon scene card featuring Kuttu.
 */
export async function generateCartoonSceneVisual(options: SceneVisualOptions): Promise<string> {
  const dir = path.dirname(options.outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const isShorts = options.format === "SHORTS";
  const width = isShorts ? 1080 : 1920;
  const height = isShorts ? 1920 : 1080;

  // Select pose cycling through singing, dancing, pointing, curious
  const poses: Array<"dancing" | "singing" | "pointing" | "curious"> = [
    "singing",
    "dancing",
    "pointing",
    "curious",
  ];
  const activePose = options.characterPose || poses[options.orderIndex % poses.length];

  const charX = isShorts ? width / 2 : width * 0.72;
  const charY = isShorts ? height * 0.65 : height * 0.72;
  const scale = isShorts ? 1.3 : 1.15;

  const channelTitle = options.channelName || "HAPPY KUTTU SONG";
  const sceneBadgeText = `🌟 ${channelTitle} | காட்சி ${options.orderIndex + 1} / ${options.totalScenes} 🌟`;

  // Speech bubble text
  const rawSpeech = options.captionText || options.narration;
  const wrappedSpeech = wrapText(rawSpeech, isShorts ? 22 : 32);

  const speechLinesSvg = wrappedSpeech
    .map(
      (line, i) =>
        `<tspan x="${(width * (isShorts ? 0.84 : 0.52)) / 2}" dy="${i === 0 ? 0 : isShorts ? 58 : 50}">${escapeXml(
          line
        )}</tspan>`
    )
    .join("");

  // Subtitle / Visual hint
  const bottomHint = options.visualPrompt?.slice(0, 60) || "Like & Subscribe to Happy Kuttu Song!";

  const svgContent = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Sky Gradient -->
      <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="60%" stop-color="#bae6fd" />
        <stop offset="100%" stop-color="#fef08a" />
      </linearGradient>

      <!-- Hill Gradients -->
      <linearGradient id="hillGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#86efac" />
        <stop offset="100%" stop-color="#22c55e" />
      </linearGradient>
      <linearGradient id="hillGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#4ade80" />
        <stop offset="100%" stop-color="#15803d" />
      </linearGradient>

      <!-- Filters -->
      <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#0f172a" flood-opacity="0.25" />
      </filter>
      <filter id="popShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#000000" flood-opacity="0.35" />
      </filter>
    </defs>

    <!-- Sky Background -->
    <rect width="${width}" height="${height}" fill="url(#skyGrad)" />

    <!-- Smiling Sun with Rays -->
    <g transform="translate(${isShorts ? width * 0.8 : width * 0.15}, ${isShorts ? 180 : 120})">
      <circle cx="0" cy="0" r="70" fill="#facc15" filter="url(#popShadow)" />
      <circle cx="0" cy="0" r="85" stroke="#fde047" stroke-width="8" stroke-dasharray="16 16" fill="none" />
      <ellipse cx="-22" cy="-10" rx="6" ry="10" fill="#713f12" />
      <ellipse cx="22" cy="-10" rx="6" ry="10" fill="#713f12" />
      <circle cx="-20" cy="-12" r="2.5" fill="#ffffff" />
      <circle cx="24" cy="-12" r="2.5" fill="#ffffff" />
      <path d="M -24 16 Q 0 38 24 16" stroke="#713f12" stroke-width="5" stroke-linecap="round" fill="none" />
      <ellipse cx="-28" cy="12" rx="7" ry="4" fill="#f87171" opacity="0.6" />
      <ellipse cx="28" cy="12" rx="7" ry="4" fill="#f87171" opacity="0.6" />
    </g>

    <!-- Fluffy White Clouds -->
    <g fill="#ffffff" opacity="0.9" filter="url(#softShadow)">
      <g transform="translate(${isShorts ? width * 0.15 : width * 0.45}, ${isShorts ? 220 : 130})">
        <circle cx="0" cy="0" r="45" />
        <circle cx="40" cy="-15" r="55" />
        <circle cx="90" cy="0" r="45" />
        <rect x="0" y="0" width="90" height="40" />
      </g>
      <g transform="translate(${isShorts ? width * 0.55 : width * 0.8}, ${isShorts ? 320 : 160}) scale(0.75)">
        <circle cx="0" cy="0" r="45" />
        <circle cx="40" cy="-15" r="55" />
        <circle cx="90" cy="0" r="45" />
        <rect x="0" y="0" width="90" height="40" />
      </g>
    </g>

    <!-- Rainbow Arc -->
    <g opacity="0.4" transform="translate(${width / 2}, ${isShorts ? 400 : 320})">
      <ellipse cx="0" cy="100" rx="${width * 0.45}" ry="${width * 0.25}" fill="none" stroke="#f43f5e" stroke-width="12" />
      <ellipse cx="0" cy="100" rx="${width * 0.45 - 12}" ry="${width * 0.25 - 12}" fill="none" stroke="#fb923c" stroke-width="12" />
      <ellipse cx="0" cy="100" rx="${width * 0.45 - 24}" ry="${width * 0.25 - 24}" fill="none" stroke="#facc15" stroke-width="12" />
      <ellipse cx="0" cy="100" rx="${width * 0.45 - 36}" ry="${width * 0.25 - 36}" fill="none" stroke="#4ade80" stroke-width="12" />
      <ellipse cx="0" cy="100" rx="${width * 0.45 - 48}" ry="${width * 0.25 - 48}" fill="none" stroke="#38bdf8" stroke-width="12" />
    </g>

    <!-- Rolling Green Hills -->
    <path d="M -100 ${height * 0.65} Q ${width * 0.35} ${height * 0.52} ${width + 100} ${height * 0.65} L ${width + 100} ${height} L -100 ${height} Z" fill="url(#hillGrad1)" />
    <path d="M -100 ${height * 0.76} Q ${width * 0.65} ${height * 0.68} ${width + 100} ${height * 0.78} L ${width + 100} ${height} L -100 ${height} Z" fill="url(#hillGrad2)" />

    <!-- Cute Colorful Flowers on Ground -->
    <g transform="translate(140, ${height * 0.88})">
      <circle cx="-10" cy="0" r="8" fill="#f43f5e" />
      <circle cx="10" cy="0" r="8" fill="#f43f5e" />
      <circle cx="0" cy="-10" r="8" fill="#f43f5e" />
      <circle cx="0" cy="10" r="8" fill="#f43f5e" />
      <circle cx="0" cy="0" r="6" fill="#facc15" />
    </g>
    <g transform="translate(${width - 160}, ${height * 0.85})">
      <circle cx="-10" cy="0" r="8" fill="#a855f7" />
      <circle cx="10" cy="0" r="8" fill="#a855f7" />
      <circle cx="0" cy="-10" r="8" fill="#a855f7" />
      <circle cx="0" cy="10" r="8" fill="#a855f7" />
      <circle cx="0" cy="0" r="6" fill="#facc15" />
    </g>

    <!-- Floating Sparkles & Musical Notes -->
    <text x="${charX - (isShorts ? 280 : 380)}" y="${charY - 140}" font-size="48" fill="#f59e0b">✨</text>
    <text x="${charX + (isShorts ? 240 : 180)}" y="${charY - 180}" font-size="52" fill="#ec4899">🎵</text>
    <text x="${charX + (isShorts ? 280 : 220)}" y="${charY - 50}" font-size="44" fill="#3b82f6">🎶</text>
    <text x="${charX - (isShorts ? 260 : 320)}" y="${charY + 60}" font-size="40" fill="#eab308">⭐</text>

    <!-- CARTOON CHARACTER: KUTTU -->
    <g transform="translate(${charX}, ${charY}) scale(${scale})" filter="url(#popShadow)">
      ${renderKuttuCharacter(activePose)}
    </g>

    <!-- Top Channel & Scene Badge -->
    <g transform="translate(${width / 2 - 250}, ${isShorts ? 100 : 50})" filter="url(#popShadow)">
      <rect width="500" height="54" rx="27" fill="#e11d48" stroke="#ffffff" stroke-width="3" />
      <text x="250" y="36" font-family="'Noto Sans Tamil', 'Latha', Arial, sans-serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">
        ${escapeXml(sceneBadgeText)}
      </text>
    </g>

    <!-- COMIC SPEECH BUBBLE WITH TAMIL TEXT -->
    <g transform="translate(${isShorts ? width * 0.08 : width * 0.08}, ${isShorts ? height * 0.20 : height * 0.28})" filter="url(#popShadow)">
      <rect width="${width * (isShorts ? 0.84 : 0.52)}" height="${isShorts ? 260 : 220}" rx="32" fill="#ffffff" stroke="#fbbf24" stroke-width="8" />
      <!-- Speech Pointer pointing down towards Kuttu -->
      <polygon points="${(width * (isShorts ? 0.84 : 0.52)) * 0.5},${isShorts ? 260 : 220} ${(width * (isShorts ? 0.84 : 0.52)) * 0.55},${isShorts ? 305 : 260} ${(width * (isShorts ? 0.84 : 0.52)) * 0.6},${isShorts ? 260 : 220}" fill="#ffffff" stroke="#fbbf24" stroke-width="8" stroke-linejoin="round" />
      <polygon points="${(width * (isShorts ? 0.84 : 0.52)) * 0.5 + 2},${isShorts ? 258 : 218} ${(width * (isShorts ? 0.84 : 0.52)) * 0.55},${isShorts ? 300 : 255} ${(width * (isShorts ? 0.84 : 0.52)) * 0.6 - 2},${isShorts ? 258 : 218}" fill="#ffffff" />

      <!-- Tamil Text Inside Speech Bubble -->
      <text x="${(width * (isShorts ? 0.84 : 0.52)) / 2}" y="${isShorts ? 80 : 70}"
        font-family="'Noto Sans Tamil', 'Latha', 'Tamil Sangam MN', Arial, sans-serif"
        font-size="${isShorts ? 44 : 36}"
        font-weight="900"
        fill="#1e1b4b"
        text-anchor="middle">
        ${speechLinesSvg}
      </text>
    </g>

    <!-- Bottom Subscription Bar for High Conversion -->
    <g transform="translate(${width * 0.05}, ${height - (isShorts ? 200 : 120)})" filter="url(#popShadow)">
      <rect width="${width * 0.9}" height="${isShorts ? 90 : 70}" rx="20" fill="#000000" fill-opacity="0.82" stroke="#facc15" stroke-width="3" />
      <text x="${(width * 0.9) / 2}" y="${isShorts ? 58 : 46}"
        font-family="'Noto Sans Tamil', 'Latha', Arial, sans-serif"
        font-size="${isShorts ? 32 : 26}"
        font-weight="800"
        fill="#fef08a"
        text-anchor="middle">
        👉 ${escapeXml(bottomHint)}
      </text>
    </g>
  </svg>
  `;

  await sharp(Buffer.from(svgContent)).png().toFile(options.outputPath);
  return options.outputPath;
}

/**
 * Generates a polished 1080p scene visual card.
 * Automatically delegates to cartoon generator if style is 'cartoon' or language is 'Tamil'.
 */
export async function generateSceneImage(options: SceneVisualOptions): Promise<string> {
  const isCartoon =
    options.style === "cartoon" ||
    options.theme === "cartoon" ||
    options.language === "Tamil";

  if (isCartoon) {
    return generateCartoonSceneVisual(options);
  }

  const dir = path.dirname(options.outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const isShorts = options.format === "SHORTS";
  const width = isShorts ? 1080 : 1920;
  const height = isShorts ? 1920 : 1080;

  const palette = GRADIENT_PALETTES[options.orderIndex % GRADIENT_PALETTES.length];
  const displayText = options.captionText || options.visualPrompt || options.narration;
  const wrappedLines = wrapText(displayText, isShorts ? 24 : 38);

  const linesSvg = wrappedLines
    .map(
      (line, i) =>
        `<tspan x="${width / 2}" dy="${i === 0 ? 0 : isShorts ? 64 : 56}" font-weight="800">${escapeXml(
          line
        )}</tspan>`
    )
    .join("");

  const sceneBadgeText = `SCENE ${options.orderIndex + 1} OF ${options.totalScenes}`;

  const svgContent = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${palette.start}" />
        <stop offset="50%" stop-color="${palette.mid}" />
        <stop offset="100%" stop-color="${palette.end}" />
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="40%" r="50%">
        <stop offset="0%" stop-color="${palette.accent}" stop-opacity="0.25" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </radialGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.8" />
      </filter>
    </defs>

    <!-- Background -->
    <rect width="${width}" height="${height}" fill="url(#bg)" />
    <rect width="${width}" height="${height}" fill="url(#glow)" />

    <!-- Grid / HUD Accents -->
    <circle cx="${width / 2}" cy="${height / 2}" r="${isShorts ? 380 : 320}" stroke="${palette.accent}" stroke-opacity="0.12" stroke-width="2" fill="none" />
    <circle cx="${width / 2}" cy="${height / 2}" r="${isShorts ? 460 : 400}" stroke="${palette.accent}" stroke-opacity="0.08" stroke-dasharray="8 8" stroke-width="2" fill="none" />

    <!-- Scene Counter Badge -->
    <g transform="translate(${width / 2 - 110}, ${isShorts ? 300 : 160})">
      <rect width="220" height="44" rx="22" fill="#000000" fill-opacity="0.6" stroke="${palette.accent}" stroke-width="2" />
      <text x="110" y="28" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" fill="${palette.accent}" text-anchor="middle" letter-spacing="2">
        ${escapeXml(sceneBadgeText)}
      </text>
    </g>

    <!-- Main Message Box -->
    <g filter="url(#shadow)">
      <text x="${width / 2}" y="${isShorts ? height / 2 - 40 : height / 2 - 20}"
        font-family="'Noto Sans Tamil', 'Latha', Arial, Helvetica, sans-serif"
        font-size="${isShorts ? 48 : 42}"
        fill="#ffffff"
        text-anchor="middle"
        letter-spacing="-0.5">
        ${linesSvg}
      </text>
    </g>

    <!-- Bottom Hook / Prompt Bar -->
    <g transform="translate(${width * 0.1}, ${height - (isShorts ? 280 : 180)})">
      <rect width="${width * 0.8}" height="${isShorts ? 90 : 70}" rx="16" fill="#000000" fill-opacity="0.5" stroke="#ffffff" stroke-opacity="0.1" />
      <text x="${(width * 0.8) / 2}" y="${isShorts ? 54 : 44}" font-family="'Noto Sans Tamil', 'Latha', Arial, Helvetica, sans-serif" font-size="${isShorts ? 24 : 20}" font-weight="600" fill="#94a3b8" text-anchor="middle">
        💡 ${escapeXml(options.visualPrompt?.slice(0, 70) || "Engaging Visual Content")}
      </text>
    </g>
  </svg>
  `;

  await sharp(Buffer.from(svgContent)).png().toFile(options.outputPath);
  return options.outputPath;
}

/**
 * Generates an ultra-engaging, high-CTR YouTube thumbnail using Sharp.
 */
export async function generateThumbnail(options: ThumbnailOptions): Promise<string> {
  const dir = path.dirname(options.outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const isShorts = options.format === "SHORTS";
  const width = isShorts ? 1080 : 1920;
  const height = isShorts ? 1920 : 1080;

  const isCartoon = options.style === "cartoon" || options.language === "Tamil";

  if (isCartoon) {
    const titleLines = wrapText(options.title, isShorts ? 18 : 24).slice(0, 3);
    const badge = options.badge || "🌟 HAPPY KUTTU SONG 🌟";

    const linesSvg = titleLines
      .map(
        (line, i) =>
          `<tspan x="${isShorts ? width / 2 : width * 0.38}" dy="${i === 0 ? 0 : isShorts ? 84 : 76}">${escapeXml(
            line
          )}</tspan>`
      )
      .join("");

    const svgContent = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="thumbBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" />
          <stop offset="60%" stop-color="#fef08a" />
          <stop offset="100%" stop-color="#4ade80" />
        </linearGradient>
        <filter id="popShadow">
          <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000000" flood-opacity="0.4" />
        </filter>
      </defs>

      <rect width="${width}" height="${height}" fill="url(#thumbBg)" />

      <!-- Character in Thumbnail -->
      <g transform="translate(${isShorts ? width / 2 : width * 0.78}, ${isShorts ? height * 0.72 : height * 0.68}) scale(${isShorts ? 1.25 : 1.15})" filter="url(#popShadow)">
        ${renderKuttuCharacter("singing")}
      </g>

      <!-- Badge -->
      <g transform="translate(${isShorts ? width / 2 - 200 : width * 0.08}, ${isShorts ? 140 : 80})" filter="url(#popShadow)">
        <rect width="${isShorts ? 400 : 420}" height="56" rx="28" fill="#e11d48" stroke="#ffffff" stroke-width="4" />
        <text x="${isShorts ? 200 : 210}" y="38" font-family="'Noto Sans Tamil', 'Latha', Arial, sans-serif" font-size="24" font-weight="900" fill="#ffffff" text-anchor="middle">
          ${escapeXml(badge)}
        </text>
      </g>

      <!-- Huge Catchy Title Box -->
      <g transform="translate(${isShorts ? width * 0.06 : width * 0.06}, ${isShorts ? 240 : 180})" filter="url(#popShadow)">
        <rect width="${isShorts ? width * 0.88 : width * 0.62}" height="${isShorts ? 320 : 280}" rx="32" fill="#ffffff" stroke="#facc15" stroke-width="10" />
        <text x="${(isShorts ? width * 0.88 : width * 0.62) / 2}" y="${isShorts ? 90 : 85}"
          font-family="'Noto Sans Tamil', 'Latha', Arial, sans-serif"
          font-size="${isShorts ? 52 : 48}"
          font-weight="900"
          fill="#1e1b4b"
          text-anchor="middle">
          ${linesSvg}
        </text>
      </g>

      <!-- Bottom Hook Banner -->
      ${
        options.hook
          ? `
      <g transform="translate(${width * 0.05}, ${height - (isShorts ? 180 : 100)})" filter="url(#popShadow)">
        <rect width="${width * 0.9}" height="${isShorts ? 80 : 64}" rx="20" fill="#dc2626" stroke="#facc15" stroke-width="4" />
        <text x="${(width * 0.9) / 2}" y="${isShorts ? 52 : 42}" font-family="'Noto Sans Tamil', 'Latha', Arial, sans-serif" font-size="${isShorts ? 32 : 26}" font-weight="900" fill="#ffffff" text-anchor="middle">
          🔥 ${escapeXml(options.hook.slice(0, 45))} 🔥
        </text>
      </g>
      `
          : ""
      }
    </svg>
    `;

    await sharp(Buffer.from(svgContent)).png().toFile(options.outputPath);
    return options.outputPath;
  }

  // Fallback to high contrast tech/gradient thumbnail
  const titleLines = wrapText(options.title.toUpperCase(), isShorts ? 18 : 26).slice(0, 3);
  const badge = options.badge || "AI AUTOMATION";

  const linesSvg = titleLines
    .map(
      (line, i) =>
        `<tspan x="${width / 2}" dy="${i === 0 ? 0 : isShorts ? 92 : 84}">${escapeXml(line)}</tspan>`
    )
    .join("");

  const svgContent = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="thumbBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#020617" />
        <stop offset="40%" stop-color="#1e1b4b" />
        <stop offset="100%" stop-color="#4c0519" />
      </linearGradient>
      <radialGradient id="highlight" cx="50%" cy="30%" r="60%">
        <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.3" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </radialGradient>
      <filter id="glow">
        <feDropShadow dx="0" dy="6" stdDeviation="16" flood-color="#000000" flood-opacity="0.9" />
      </filter>
    </defs>

    <rect width="${width}" height="${height}" fill="url(#thumbBg)" />
    <rect width="${width}" height="${height}" fill="url(#highlight)" />

    <rect x="40" y="40" width="${width - 80}" height="${height - 80}" rx="24" fill="none" stroke="#f43f5e" stroke-width="4" stroke-opacity="0.3" />

    <g transform="translate(${width / 2 - 150}, ${isShorts ? 360 : 180})">
      <rect width="300" height="54" rx="27" fill="#e11d48" filter="url(#glow)" />
      <text x="150" y="36" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="3">
        ⚡ ${escapeXml(badge)}
      </text>
    </g>

    <g filter="url(#glow)">
      <text x="${width / 2}" y="${isShorts ? height / 2 - 50 : height / 2 - 30}"
        font-family="'Noto Sans Tamil', 'Latha', Arial, Helvetica, sans-serif"
        font-size="${isShorts ? 72 : 68}"
        font-weight="900"
        fill="#facc15"
        text-anchor="middle"
        letter-spacing="-1">
        ${linesSvg}
      </text>
    </g>

    ${
      options.hook
        ? `
    <g transform="translate(${width * 0.15}, ${height - (isShorts ? 360 : 200)})">
      <rect width="${width * 0.7}" height="${isShorts ? 84 : 64}" rx="18" fill="#18181b" stroke="#f43f5e" stroke-width="2" />
      <text x="${(width * 0.7) / 2}" y="${isShorts ? 52 : 40}" font-family="'Noto Sans Tamil', 'Latha', Arial, sans-serif" font-size="${isShorts ? 28 : 22}" font-weight="700" fill="#ffffff" text-anchor="middle">
        🔥 ${escapeXml(options.hook.slice(0, 45))}
      </text>
    </g>
    `
        : ""
    }
  </svg>
  `;

  await sharp(Buffer.from(svgContent)).png().toFile(options.outputPath);
  return options.outputPath;
}
