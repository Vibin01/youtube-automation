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
  theme?: "cyber" | "sunset" | "emerald" | "crimson" | "dark";
}

export interface ThumbnailOptions {
  outputPath: string;
  title: string;
  hook?: string;
  badge?: string;
  format?: "SHORTS" | "LONG_FORM";
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
 * Generates a polished 1080p scene visual card.
 */
export async function generateSceneImage(options: SceneVisualOptions): Promise<string> {
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
        font-family="Arial, Helvetica, sans-serif"
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
      <text x="${(width * 0.8) / 2}" y="${isShorts ? 54 : 44}" font-family="Arial, Helvetica, sans-serif" font-size="${isShorts ? 24 : 20}" font-weight="600" fill="#94a3b8" text-anchor="middle">
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

    <!-- Corner Accents -->
    <rect x="40" y="40" width="${width - 80}" height="${height - 80}" rx="24" fill="none" stroke="#f43f5e" stroke-width="4" stroke-opacity="0.3" />

    <!-- Badge -->
    <g transform="translate(${width / 2 - 150}, ${isShorts ? 360 : 180})">
      <rect width="300" height="54" rx="27" fill="#e11d48" filter="url(#glow)" />
      <text x="150" y="36" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="3">
        ⚡ ${escapeXml(badge)}
      </text>
    </g>

    <!-- Giant Main Title -->
    <g filter="url(#glow)">
      <text x="${width / 2}" y="${isShorts ? height / 2 - 50 : height / 2 - 30}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${isShorts ? 72 : 68}"
        font-weight="900"
        fill="#facc15"
        text-anchor="middle"
        letter-spacing="-1">
        ${linesSvg}
      </text>
    </g>

    <!-- Hook Bottom Box -->
    ${
      options.hook
        ? `
    <g transform="translate(${width * 0.15}, ${height - (isShorts ? 400 : 240)})">
      <rect width="${width * 0.7}" height="${isShorts ? 100 : 80}" rx="20" fill="#000000" fill-opacity="0.75" stroke="#facc15" stroke-width="2" />
      <text x="${(width * 0.7) / 2}" y="${isShorts ? 60 : 50}" font-family="Arial, Helvetica, sans-serif" font-size="${isShorts ? 30 : 26}" font-weight="800" fill="#ffffff" text-anchor="middle">
        👀 ${escapeXml(options.hook.slice(0, 50))}
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
