import sharp from "sharp";
import fs from "fs";
import path from "path";
import { CAST } from "./cast";

const charactersDir = path.join(process.cwd(), "public", "characters");
const sheetsDir = path.join(charactersDir, "sheets");

/**
 * Automatically processes all character turnaround sheets in public/characters/sheets/
 * and slices each into:
 * - ${charId}_sheet.png
 * - ${charId}_front.png
 * - ${charId}_left.png
 * - ${charId}_right.png
 * - ${charId}_avatar.png
 * - ${charId}.png (primary front view)
 * - ${charId}_3d.png
 */
export async function processAllTurnaroundSheets() {
  if (!fs.existsSync(sheetsDir)) fs.mkdirSync(sheetsDir, { recursive: true });

  const files = fs.readdirSync(sheetsDir);
  console.log(`🔍 Scanning ${sheetsDir} for character model sheets... (${files.length} found)`);

  for (const c of CAST) {
    const sheetFile = files.find(
      (f) =>
        f.toLowerCase().includes(c.id) ||
        f.toLowerCase().includes(c.name.toLowerCase().replace(/\s+/g, "_")) ||
        f.toLowerCase().includes(c.name.toLowerCase().replace(/\s+/g, ""))
    );

    if (!sheetFile) {
      continue;
    }

    const srcPath = path.join(sheetsDir, sheetFile);
    try {
      const metadata = await sharp(srcPath).metadata();
      const width = metadata.width || 760;
      const height = metadata.height || 425;

      const topOffset = Math.round(height * 0.136); // skip top title banner
      const cropH = height - topOffset;

      // 1. Copy canonical full sheet
      const canonicalSheet = path.join(sheetsDir, `${c.id}_sheet.png`);
      if (srcPath !== canonicalSheet) {
        await sharp(srcPath).png().toFile(canonicalSheet);
      }

      // 2. Left 3/4 Pose
      const leftW = Math.round(width * 0.35);
      await sharp(srcPath)
        .extract({ left: Math.round(width * 0.025), top: topOffset, width: leftW, height: cropH })
        .png()
        .toFile(path.join(charactersDir, `${c.id}_left.png`));

      // 3. Center Front Pose
      const centerLeft = Math.round(width * 0.35);
      const centerW = Math.round(width * 0.36);
      await sharp(srcPath)
        .extract({ left: centerLeft, top: topOffset, width: centerW, height: cropH })
        .png()
        .toFile(path.join(charactersDir, `${c.id}_front.png`));

      // Also set as primary character render
      await sharp(srcPath)
        .extract({ left: centerLeft, top: topOffset, width: centerW, height: cropH })
        .png()
        .toFile(path.join(charactersDir, `${c.id}.png`));

      await sharp(srcPath)
        .extract({ left: centerLeft, top: topOffset, width: centerW, height: cropH })
        .png()
        .toFile(path.join(charactersDir, `${c.id}_3d.png`));

      // 4. Right Profile Pose
      const rightLeft = Math.round(width * 0.70);
      const rightW = width - rightLeft;
      await sharp(srcPath)
        .extract({ left: rightLeft, top: topOffset, width: rightW, height: cropH })
        .png()
        .toFile(path.join(charactersDir, `${c.id}_right.png`));

      // 5. Avatar Portrait
      const avatarLeft = Math.round(width * 0.44);
      const avatarSize = Math.round(height * 0.32);
      await sharp(srcPath)
        .extract({ left: avatarLeft, top: topOffset, width: avatarSize, height: avatarSize })
        .resize(512, 512)
        .png()
        .toFile(path.join(charactersDir, `${c.id}_avatar.png`));

      console.log(`  ✅ Successfully sliced turnaround sheet for: [${c.name}] (${c.id})`);
    } catch (err: any) {
      console.error(`  ❌ Error slicing sheet for ${c.id}:`, err.message);
    }
  }

  // Update manifest.json with multi-angle file paths
  const manifestPath = path.join(charactersDir, "manifest.json");
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      for (const char of manifest.characters || []) {
        const hasSheet = fs.existsSync(path.join(sheetsDir, `${char.id}_sheet.png`));
        const hasLeft = fs.existsSync(path.join(charactersDir, `${char.id}_left.png`));
        const hasRight = fs.existsSync(path.join(charactersDir, `${char.id}_right.png`));
        const hasFront = fs.existsSync(path.join(charactersDir, `${char.id}_front.png`));

        char.hasTurnaround = hasSheet;
        char.angles = {
          sheet: hasSheet ? `/characters/sheets/${char.id}_sheet.png` : null,
          front: hasFront ? `/characters/${char.id}_front.png` : `/characters/${char.id}.png`,
          left: hasLeft ? `/characters/${char.id}_left.png` : null,
          right: hasRight ? `/characters/${char.id}_right.png` : null,
        };
      }
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
      console.log("  ✅ Updated manifest.json with multi-angle turnaround paths!");
    } catch (err: any) {
      console.warn("Could not update manifest.json:", err.message);
    }
  }
}

if (process.argv[1]?.includes("processTurnaroundSheets")) {
  processAllTurnaroundSheets()
    .then(() => console.log("🎉 Turnaround processing complete!"))
    .catch((e) => console.error(e));
}
