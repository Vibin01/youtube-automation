import sharp from "sharp";
import fs from "fs";
import path from "path";
import { CAST, CharacterDefinition } from "./cast";
import { renderCharacterBase } from "../video/visuals";

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Generates a full-body transparent PNG for a character in a specific pose.
 * Dimensions: 600 x 800 (crisp high-DPI transparent asset).
 */
export async function generateCharacterPosePng(
  c: CharacterDefinition,
  pose: string,
  outputPath: string
): Promise<string> {
  const width = 600;
  const height = 800;

  // Center character around (width / 2, height * 0.68)
  const centerX = width / 2;
  const centerY = height * 0.68;
  const scale = 1.65;

  const svg = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="charDropShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="12" stdDeviation="10" flood-color="#000000" flood-opacity="0.3" />
      </filter>
    </defs>
    <!-- Character vector scaled and centered -->
    <g transform="translate(${centerX}, ${centerY}) scale(${scale})" filter="url(#charDropShadow)">
      ${renderCharacterBase(c, pose)}
    </g>
  </svg>`;

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  await sharp(Buffer.from(svg)).png().toFile(outputPath);
  return outputPath;
}

/**
 * Generates a square 512x512 avatar portrait badge for UI cards, previews, and thumbnails.
 */
export async function generateCharacterAvatarPng(
  c: CharacterDefinition,
  outputPath: string
): Promise<string> {
  const size = 512;
  const cx = size / 2;

  const svg = `
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="avatarBg_${c.id}" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="${c.shirtColor}" stop-opacity="0.85" />
        <stop offset="65%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#020617" />
      </radialGradient>
      <filter id="avatarGlow">
        <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#000000" flood-opacity="0.6" />
      </filter>
      <clipPath id="avatarClip_${c.id}">
        <circle cx="${cx}" cy="${size * 0.44}" r="${size * 0.38}" />
      </clipPath>
    </defs>

    <!-- Outer card background -->
    <rect width="${size}" height="${size}" rx="48" fill="#090d16" stroke="#1e293b" stroke-width="4" />

    <!-- Circular portrait container -->
    <circle cx="${cx}" cy="${size * 0.44}" r="${size * 0.38}" fill="url(#avatarBg_${c.id})" stroke="${c.shirtColor}" stroke-width="6" />

    <!-- Character bust clipped inside circle -->
    <g clip-path="url(#avatarClip_${c.id})">
      <g transform="translate(${cx}, ${size * 0.65}) scale(1.68)" filter="url(#avatarGlow)">
        ${renderCharacterBase(c, "happy")}
      </g>
    </g>

    <!-- Border highlight on circle -->
    <circle cx="${cx}" cy="${size * 0.44}" r="${size * 0.38}" fill="none" stroke="#facc15" stroke-width="4" stroke-opacity="0.6" />

    <!-- Top-right Emoji sticker badge -->
    <g transform="translate(${size - 90}, 36)" filter="url(#avatarGlow)">
      <circle cx="28" cy="28" r="28" fill="#1e1b4b" stroke="#facc15" stroke-width="3" />
      <text x="28" y="38" font-size="28" text-anchor="middle">${c.emoji}</text>
    </g>

    <!-- Bottom character name plate -->
    <g transform="translate(36, ${size - 100})" filter="url(#avatarGlow)">
      <rect width="${size - 72}" height="76" rx="20" fill="#0f172a" stroke="#334155" stroke-width="3" />
      <rect width="${size - 72}" height="6" y="0" rx="3" fill="${c.shirtColor}" />
      <text x="${(size - 72) / 2}" y="36"
        font-family="Arial,sans-serif" font-size="22" font-weight="900" fill="#f8fafc" text-anchor="middle">
        ${escapeXml(c.name)}
      </text>
      <text x="${(size - 72) / 2}" y="58"
        font-family="Arial,sans-serif" font-size="14" font-weight="700" fill="#facc15" text-anchor="middle">
        "${escapeXml(c.nickname)}" • ${escapeXml(c.role.split("(")[0].trim())}
      </text>
    </g>
  </svg>`;

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  await sharp(Buffer.from(svg)).png().toFile(outputPath);
  return outputPath;
}

/**
 * Generates a full 1920x1080 cast showcase poster featuring all 16 characters.
 */
export async function generateCastPosterPng(outputPath: string): Promise<string> {
  const width = 1920;
  const height = 1080;

  // Arrange in 2 rows of 8 characters
  const cols = 8;
  const rows = 2;
  const colWidth = width / cols;
  const rowHeight = 360;

  const charactersSvg = CAST.map((c, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * colWidth + colWidth / 2;
    const y = 330 + row * rowHeight;
    const scale = 0.72;

    return `
      <g transform="translate(${x}, ${y}) scale(${scale})" filter="url(#posterShadow)">
        ${renderCharacterBase(c, i % 2 === 0 ? "dancing" : "happy")}
        <g transform="translate(-80, 215)">
          <rect width="160" height="42" rx="21" fill="#000000" fill-opacity="0.85" stroke="#facc15" stroke-width="2"/>
          <text x="80" y="22" font-family="Arial,sans-serif" font-size="15" font-weight="900" fill="#ffffff" text-anchor="middle">${escapeXml(c.name)}</text>
          <text x="80" y="36" font-family="Arial,sans-serif" font-size="11" font-weight="700" fill="#facc15" text-anchor="middle">${escapeXml(c.emoji)} ${escapeXml(c.nickname)}</text>
        </g>
      </g>
    `;
  }).join("\n");

  const svg = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="posterBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#090514" />
        <stop offset="35%" stop-color="#1e103a" />
        <stop offset="70%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>
      <filter id="posterShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000000" flood-opacity="0.5" />
      </filter>
    </defs>

    <!-- Background -->
    <rect width="${width}" height="${height}" fill="url(#posterBg)" />

    <!-- Top Banner -->
    <g transform="translate(${width / 2 - 450}, 38)" filter="url(#posterShadow)">
      <rect width="900" height="84" rx="42" fill="#e11d48" stroke="#facc15" stroke-width="6" />
      <text x="450" y="54" font-family="Arial,sans-serif" font-size="42" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2">
        🎬 HAPPY KUTTU SONG 🌟
      </text>
    </g>

    <text x="${width / 2}" y="160" font-family="Arial,sans-serif" font-size="24" font-weight="800" fill="#facc15" text-anchor="middle" letter-spacing="1">
      ⚡ OFFICIAL 16 ANIMATED COMEDY CHARACTERS ⚡
    </text>

    <!-- Grid of all 16 characters -->
    ${charactersSvg}

    <!-- Bottom footer banner -->
    <g transform="translate(60, ${height - 70})">
      <rect width="${width - 120}" height="50" rx="25" fill="#0f172a" fill-opacity="0.9" stroke="#334155" stroke-width="2"/>
      <text x="${(width - 120) / 2}" y="32" font-family="Arial,sans-serif" font-size="18" font-weight="700" fill="#cbd5e1" text-anchor="middle">
        🎭 Tamil Street Comedy &amp; Kuthu Dance YouTube Automation • Stored in /public/characters/
      </text>
    </g>
  </svg>`;

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  await sharp(Buffer.from(svg)).png().toFile(outputPath);
  return outputPath;
}

export interface CharacterManifestItem {
  id: string;
  name: string;
  nickname: string;
  role: string;
  catchphrase: string;
  emoji: string;
  files: {
    default: string;
    dancing: string;
    surprised: string;
    thinking: string;
    singing: string;
    avatar: string;
  };
}

/**
 * Main function: Generates all character assets and writes them to public/characters/
 */
export async function generateAllCharacterAssets(outputDir?: string): Promise<{
  totalCharacters: number;
  generatedFiles: string[];
  manifestPath: string;
  posterPath: string;
}> {
  const targetDir = outputDir || path.join(process.cwd(), "public", "characters");
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  const generatedFiles: string[] = [];
  const manifestItems: CharacterManifestItem[] = [];

  console.log(`🎨 Starting character asset generation for ${CAST.length} characters in '${targetDir}'...`);

  for (const c of CAST) {
    console.log(`  -> Generating assets for [${c.name}] (${c.id})...`);

    // 1. Default pose
    const defaultPath = path.join(targetDir, `${c.id}.png`);
    await generateCharacterPosePng(c, "happy", defaultPath);
    generatedFiles.push(defaultPath);

    // 2. Dancing pose (for Kuthu dance sequence)
    const dancingPath = path.join(targetDir, `${c.id}_dancing.png`);
    await generateCharacterPosePng(c, "dancing", dancingPath);
    generatedFiles.push(dancingPath);

    // 3. Surprised pose
    const surprisedPath = path.join(targetDir, `${c.id}_surprised.png`);
    await generateCharacterPosePng(c, "surprised", surprisedPath);
    generatedFiles.push(surprisedPath);

    // 4. Thinking pose
    const thinkingPath = path.join(targetDir, `${c.id}_thinking.png`);
    await generateCharacterPosePng(c, "thinking", thinkingPath);
    generatedFiles.push(thinkingPath);

    // 5. Singing pose
    const singingPath = path.join(targetDir, `${c.id}_singing.png`);
    await generateCharacterPosePng(c, "singing", singingPath);
    generatedFiles.push(singingPath);

    // 6. Avatar square card
    const avatarPath = path.join(targetDir, `${c.id}_avatar.png`);
    await generateCharacterAvatarPng(c, avatarPath);
    generatedFiles.push(avatarPath);

    manifestItems.push({
      id: c.id,
      name: c.name,
      nickname: c.nickname,
      role: c.role,
      catchphrase: c.catchphrase,
      emoji: c.emoji,
      files: {
        default: `/characters/${c.id}.png`,
        dancing: `/characters/${c.id}_dancing.png`,
        surprised: `/characters/${c.id}_surprised.png`,
        thinking: `/characters/${c.id}_thinking.png`,
        singing: `/characters/${c.id}_singing.png`,
        avatar: `/characters/${c.id}_avatar.png`,
      },
    });
  }

  // 7. Master 3D cast poster
  console.log(`  -> Generating master 13-character 3D cast poster...`);
  const { generate3DCastPoster } = await import("./generate3DPoster");
  const posterPath = await generate3DCastPoster();
  generatedFiles.push(posterPath);

  // 8. Write manifest.json
  const manifestPath = path.join(targetDir, "manifest.json");
  const manifestData = {
    channel: "Happy Kuttu Song",
    version: "3.0.0",
    style: "3D Disney Pixar / DreamWorks Animated Style",
    generatedAt: new Date().toISOString(),
    totalCharacters: CAST.length,
    poster: "/characters/cast_poster.png",
    posterHd: "/characters/cast_poster_hd.png",
    characters: CAST.map((c) => ({
      id: c.id,
      name: c.name,
      nickname: c.nickname,
      role: c.role,
      catchphrase: c.catchphrase,
      emoji: c.emoji,
      files: {
        default: `/characters/${c.id}.png`,
        avatar: `/characters/${c.id}_avatar.png`,
        threeD: `/characters/${c.id}_3d.png`,
      },
      has3D: true,
    })),
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2), "utf8");
  generatedFiles.push(manifestPath);

  console.log(`✅ Finished generating ${generatedFiles.length} character assets in ${targetDir}!`);

  return {
    totalCharacters: CAST.length,
    generatedFiles,
    manifestPath,
    posterPath,
  };
}

// Allow direct execution: npx tsx src/lib/characters/generator.ts
if (process.argv[1]?.includes("generator")) {
  generateAllCharacterAssets()
    .then((res) => {
      console.log(`🎉 Success: Generated ${res.generatedFiles.length} assets for ${res.totalCharacters} characters.`);
    })
    .catch((err) => {
      console.error("❌ Error generating character assets:", err);
      process.exit(1);
    });
}
