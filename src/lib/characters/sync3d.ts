import sharp from "sharp";
import fs from "fs";
import path from "path";

const brainDir = "C:/Users/DELL/.gemini/antigravity-ide/brain/9dca8cdf-12f5-49ae-bd58-5a60adbc0a37";
const outDir = path.join(process.cwd(), "public", "characters");

const mapping = [
  { prefix: "alappara_aarumugam_3d", id: "aarumugam", name: "Alappara Aarumugam" },
  { prefix: "bullet_balu_3d", id: "balu", name: "Bullet Balu" },
  { prefix: "soda_mani_3d", id: "sodamani", name: "Soda Mani" },
  { prefix: "sombu_sundaram_3d", id: "sundaram", name: "Sombu Sundaram" },
  { prefix: "tension_thangarasu_3d", id: "thangarasu", name: "Tension Thangarasu" },
  { prefix: "dowlath_dhandapani_3d", id: "dhandapani", name: "Dowlath Dhandapani" },
  { prefix: "scene_senthil_3d", id: "senthil", name: "Scene Senthil" },
  { prefix: "google_govind_3d", id: "govind", name: "Google Govind" },
  { prefix: "parotta_pandi_3d", id: "pandi", name: "Parotta Pandi" },
  { prefix: "battery_babu_3d", id: "babu", name: "Battery Babu" },
  { prefix: "gethu_ganesan_3d", id: "ganesan", name: "Gethu Ganesan" },
  { prefix: "aapadicha_anand_3d", id: "anand", name: "Aap-adicha Anand" },
  { prefix: "mic_mohan_3d", id: "mohan", name: "Mic Mohan" },
];

export async function sync3DCharacterAssets() {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  if (!fs.existsSync(brainDir)) {
    console.warn("Brain directory not found:", brainDir);
    return;
  }

  const files = fs.readdirSync(brainDir);
  console.log(`🔍 Scanning brain directory for 3D character renders...`);

  for (const m of mapping) {
    const match = files.find((f) => f.startsWith(m.prefix) && f.endsWith(".jpg"));
    if (match) {
      const srcPath = path.join(brainDir, match);
      const destPng3D = path.join(outDir, `${m.id}_3d.png`);
      const destPngPrimary = path.join(outDir, `${m.id}.png`);
      const destAvatar = path.join(outDir, `${m.id}_avatar.png`);

      await sharp(srcPath).png().toFile(destPng3D);
      await sharp(srcPath).png().toFile(destPngPrimary);
      await sharp(srcPath).resize(512, 512, { fit: "cover" }).png().toFile(destAvatar);
      console.log(`  ✅ Synced 3D asset for: [${m.name}] -> ${m.id}.png & ${m.id}_3d.png`);
    } else {
      console.log(`  ℹ️ No 3D render file for ${m.id} yet, keeping SVG asset.`);
    }
  }

  // Update manifest.json with 3D flags
  const manifestPath = path.join(outDir, "manifest.json");
  if (fs.existsSync(manifestPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      for (const char of data.characters || []) {
        const has3D = fs.existsSync(path.join(outDir, `${char.id}_3d.png`));
        char.has3D = has3D;
        if (has3D) {
          char.files.threeD = `/characters/${char.id}_3d.png`;
        }
      }
      fs.writeFileSync(manifestPath, JSON.stringify(data, null, 2), "utf8");
      console.log("  ✅ Updated manifest.json with 3D asset paths!");
    } catch (e) {
      console.warn("Could not update manifest.json:", e);
    }
  }
}

if (process.argv[1]?.includes("sync3d")) {
  sync3DCharacterAssets()
    .then(() => console.log("🎉 3D Character sync completed!"))
    .catch((err) => console.error("❌ Sync error:", err));
}
