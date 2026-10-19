import sharp from "sharp";
import fs from "fs";
import path from "path";
import { CAST } from "./cast";

const charactersDir = path.join(process.cwd(), "public", "characters");

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Builds the official 3D Master Cast Poster using the real 3D character renders!
 */
export async function generate3DCastPoster(): Promise<string> {
  const width = 2560;
  const height = 1440;
  const posterPath = path.join(charactersDir, "cast_poster.png");

  console.log(`🎨 Generating 3D Master Cast Poster (${width}x${height})...`);

  // Row 1: 7 characters, Row 2: 6 characters
  const row1 = CAST.slice(0, 7);
  const row2 = CAST.slice(7, 13);

  const cardWidth = 320;
  const cardHeight = 440;

  // Calculate positions
  // Row 1 spacing
  const gap1 = 30;
  const totalW1 = 7 * cardWidth + 6 * gap1; // 2240 + 180 = 2420
  const startX1 = (width - totalW1) / 2;
  const startY1 = 260;

  // Row 2 spacing
  const gap2 = 48;
  const totalW2 = 6 * cardWidth + 5 * gap2; // 1920 + 240 = 2160
  const startX2 = (width - totalW2) / 2;
  const startY2 = 750;

  const compositeOperations: Array<{ input: Buffer | string; top: number; left: number }> = [];

  // Generate character card images and composite them
  const layout = [
    ...row1.map((c, i) => ({ c, x: Math.round(startX1 + i * (cardWidth + gap1)), y: startY1 })),
    ...row2.map((c, i) => ({ c, x: Math.round(startX2 + i * (cardWidth + gap2)), y: startY2 })),
  ];

  for (const item of layout) {
    const char3dPath = path.join(charactersDir, `${item.c.id}_3d.png`);
    if (!fs.existsSync(char3dPath)) {
      console.warn(`Missing 3D render for ${item.c.id} at ${char3dPath}`);
      continue;
    }

    // Prepare 3D character photo resized and rounded
    const photoH = 340;
    const photoW = cardWidth - 12;

    const charPhotoBuffer = await sharp(char3dPath)
      .resize(photoW, photoH, { fit: "cover", position: "north" })
      .toBuffer();

    // Card frame overlay (SVG border + gradient + text badge)
    const cardSvg = `
    <svg width="${cardWidth}" height="${cardHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cardBg_${item.c.id}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#1e1b4b" stop-opacity="0.85" />
          <stop offset="100%" stop-color="#090514" stop-opacity="0.95" />
        </linearGradient>
        <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#facc15" />
          <stop offset="50%" stop-color="#f59e0b" />
          <stop offset="100%" stop-color="#b45309" />
        </linearGradient>
        <filter id="badgeShadow">
          <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.8"/>
        </filter>
      </defs>
      <!-- Base Card Frame -->
      <rect x="0" y="0" width="${cardWidth}" height="${cardHeight}" rx="22" fill="url(#cardBg_${item.c.id})" stroke="url(#goldBorder)" stroke-width="3" />
      
      <!-- Bottom Name Banner -->
      <g transform="translate(10, ${cardHeight - 88})" filter="url(#badgeShadow)">
        <rect width="${cardWidth - 20}" height="76" rx="16" fill="#0f172a" fill-opacity="0.95" stroke="#334155" stroke-width="1.5" />
        <text x="${(cardWidth - 20) / 2}" y="28" font-family="'Segoe UI', Roboto, sans-serif" font-size="19" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="0.5">
          ${escapeXml(item.c.name)}
        </text>
        <text x="${(cardWidth - 20) / 2}" y="48" font-family="'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#facc15" text-anchor="middle">
          ${escapeXml(item.c.emoji)} ${escapeXml(item.c.nickname)}
        </text>
        <text x="${(cardWidth - 20) / 2}" y="65" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#94a3b8" text-anchor="middle" font-style="italic">
          "${escapeXml(item.c.catchphrase)}"
        </text>
      </g>
    </svg>`;

    // Compose photo into card
    const cardBuffer = await sharp(Buffer.from(cardSvg))
      .composite([
        {
          input: charPhotoBuffer,
          top: 6,
          left: 6,
        },
      ])
      .png()
      .toBuffer();

    compositeOperations.push({
      input: cardBuffer,
      top: item.y,
      left: item.x,
    });
  }

  // Base background with luxury cinematic styling
  const bgSvg = `
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="stageGlow" cx="50%" cy="30%" r="75%">
        <stop offset="0%" stop-color="#312e81" stop-opacity="0.8" />
        <stop offset="45%" stop-color="#1e103a" stop-opacity="0.9" />
        <stop offset="80%" stop-color="#0b0819" stop-opacity="1" />
        <stop offset="100%" stop-color="#030009" stop-opacity="1" />
      </radialGradient>
      <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#fef08a" />
        <stop offset="25%" stop-color="#facc15" />
        <stop offset="50%" stop-color="#fbbf24" />
        <stop offset="75%" stop-color="#f59e0b" />
        <stop offset="100%" stop-color="#ca8a04" />
      </linearGradient>
      <linearGradient id="titlePill" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#dc2626" />
        <stop offset="50%" stop-color="#e11d48" />
        <stop offset="100%" stop-color="#991b1b" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    <!-- Background -->
    <rect width="${width}" height="${height}" fill="url(#stageGlow)" />

    <!-- Ambient sparkle dots -->
    <circle cx="200" cy="180" r="3" fill="#facc15" opacity="0.6"/>
    <circle cx="500" cy="120" r="2" fill="#ffffff" opacity="0.7"/>
    <circle cx="2300" cy="190" r="3.5" fill="#facc15" opacity="0.6"/>
    <circle cx="2100" cy="130" r="2" fill="#ffffff" opacity="0.7"/>

    <!-- Header Box -->
    <g transform="translate(${width / 2 - 550}, 42)" filter="url(#glow)">
      <rect width="1100" height="96" rx="48" fill="url(#titlePill)" stroke="url(#goldGradient)" stroke-width="6"/>
      <text x="550" y="62" font-family="'Segoe UI', Roboto, Impact, sans-serif" font-size="48" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="3">
        🎬 HAPPY KUTTU SONG 🌟
      </text>
    </g>

    <text x="${width / 2}" y="195" font-family="'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="900" fill="url(#goldGradient)" text-anchor="middle" letter-spacing="2">
      ⚡ OFFICIAL 13 3D ANIMATED COMEDY CHARACTERS ⚡
    </text>
    <text x="${width / 2}" y="230" font-family="'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="600" fill="#cbd5e1" text-anchor="middle" letter-spacing="1">
      Permanent Pixar/DreamWorks Style Roster • Tamil Street Comedy &amp; High-Energy Kuthu Dance
    </text>

    <!-- Bottom Footer -->
    <g transform="translate(100, ${height - 75})">
      <rect width="${width - 200}" height="54" rx="27" fill="#0f172a" fill-opacity="0.9" stroke="#334155" stroke-width="2"/>
      <text x="${(width - 200) / 2}" y="34" font-family="'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700" fill="#e2e8f0" text-anchor="middle">
        🎭 100% 3D Character Automation Pipeline • Stored in /public/characters/ • Zero 2D Figures
      </text>
    </g>
  </svg>`;

  const bgBuffer = Buffer.from(bgSvg);

  await sharp(bgBuffer)
    .composite(compositeOperations)
    .png({ quality: 95 })
    .toFile(posterPath);

  // Also save a 1920x1080 version
  const hdPosterPath = path.join(charactersDir, "cast_poster_hd.png");
  await sharp(posterPath)
    .resize(1920, 1080, { fit: "cover" })
    .png({ quality: 90 })
    .toFile(hdPosterPath);

  console.log(`✅ 3D Master Cast Poster successfully created: ${posterPath}`);
  return posterPath;
}

if (process.argv[1]?.includes("generate3DPoster")) {
  generate3DCastPoster()
    .then((p) => console.log("🎉 Done! Poster saved to", p))
    .catch((e) => console.error("❌ Poster generation error:", e));
}
