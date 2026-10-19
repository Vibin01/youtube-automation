import sharp from "sharp";
import fs from "fs";
import path from "path";

const srcFile = "C:/Users/DELL/.gemini/antigravity-ide/brain/9dca8cdf-12f5-49ae-bd58-5a60adbc0a37/.user_uploaded/media_1792426346344.png";
const outDir = path.join(process.cwd(), "public", "characters");
const sheetsDir = path.join(outDir, "sheets");

async function processAarumugamSheet() {
  if (!fs.existsSync(sheetsDir)) fs.mkdirSync(sheetsDir, { recursive: true });

  const metadata = await sharp(srcFile).metadata();
  const width = metadata.width || 760;
  const height = metadata.height || 425;

  const topOffset = 58;
  const h = height - topOffset;

  // 1. Save full model sheet
  await sharp(srcFile).png().toFile(path.join(sheetsDir, "aarumugam_sheet.png"));

  // 2. Left 3/4 pose (x: 20 to 280)
  await sharp(srcFile)
    .extract({ left: 20, top: topOffset, width: 260, height: h })
    .png()
    .toFile(path.join(outDir, "aarumugam_left.png"));

  // 3. Center Front Pose (x: 275 to 545)
  await sharp(srcFile)
    .extract({ left: 275, top: topOffset, width: 270, height: h })
    .png()
    .toFile(path.join(outDir, "aarumugam_front.png"));

  // Also primary
  await sharp(srcFile)
    .extract({ left: 275, top: topOffset, width: 270, height: h })
    .png()
    .toFile(path.join(outDir, "aarumugam.png"));
  await sharp(srcFile)
    .extract({ left: 275, top: topOffset, width: 270, height: h })
    .png()
    .toFile(path.join(outDir, "aarumugam_3d.png"));

  // 4. Right Profile Pose (x: 540 to 740)
  await sharp(srcFile)
    .extract({ left: 540, top: topOffset, width: width - 540, height: h })
    .png()
    .toFile(path.join(outDir, "aarumugam_right.png"));

  // 5. Avatar Portrait (face of center pose)
  await sharp(srcFile)
    .extract({ left: 345, top: topOffset, width: 135, height: 135 })
    .resize(512, 512)
    .png()
    .toFile(path.join(outDir, "aarumugam_avatar.png"));

  console.log("✅ Perfectly clean crop without text completed!");
}

processAarumugamSheet().catch(console.error);
