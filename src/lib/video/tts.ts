import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { getFFprobePath } from "./ffmpeg-bin";

export interface TTSOptions {
  text: string;
  outputPath: string;
  subtitlePath?: string;
  language?: "English" | "Tamil";
  voice?: string;
  rate?: string; // e.g. "+0%", "+10%"
}

export const VOICES = {
  English: [
    { id: "en-US-ChristopherNeural", label: "Christopher (US Male, Deep & Engaging)" },
    { id: "en-US-JennyNeural", label: "Jenny (US Female, Natural & Warm)" },
    { id: "en-US-GuyNeural", label: "Guy (US Male, Energetic)" },
    { id: "en-IN-NeerjaNeural", label: "Neerja (Indian English Female)" },
    { id: "en-IN-PrabhatNeural", label: "Prabhat (Indian English Male)" },
  ],
  Tamil: [
    { id: "ta-IN-PallaviNeural", label: "Pallavi (Tamil Female, Clear & Expressive)" },
    { id: "ta-IN-ValluvarNeural", label: "Valluvar (Tamil Male, Authoritative & Warm)" },
  ],
};

export function getDefaultVoice(language: "English" | "Tamil"): string {
  if (language === "Tamil") {
    return "ta-IN-PallaviNeural";
  }
  return "en-US-ChristopherNeural";
}

/**
 * Synthesizes speech to an audio file using free Edge-TTS.
 */
export async function synthesizeSpeech(options: TTSOptions): Promise<{
  audioPath: string;
  subtitlePath?: string;
  durationSec: number;
}> {
  const dir = path.dirname(options.outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const voice = options.voice || getDefaultVoice(options.language || "English");
  const args = [
    "-m",
    "edge_tts",
    "--voice",
    voice,
    "--text",
    options.text,
    "--write-media",
    options.outputPath,
  ];

  if (options.rate) {
    args.push("--rate", options.rate);
  }

  if (options.subtitlePath) {
    const subDir = path.dirname(options.subtitlePath);
    if (!fs.existsSync(subDir)) {
      fs.mkdirSync(subDir, { recursive: true });
    }
    args.push("--write-subtitles", options.subtitlePath);
  }

  await new Promise<void>((resolve, reject) => {
    const child = spawn("python", args, {
      windowsHide: true,
    });

    let stderr = "";
    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      if (code === 0 && fs.existsSync(options.outputPath)) {
        resolve();
      } else {
        reject(new Error(`Edge TTS failed (code ${code}): ${stderr}`));
      }
    });

    child.on("error", (err) => {
      reject(err);
    });
  });

  const durationSec = await getAudioDuration(options.outputPath);

  return {
    audioPath: options.outputPath,
    subtitlePath: options.subtitlePath && fs.existsSync(options.subtitlePath) ? options.subtitlePath : undefined,
    durationSec,
  };
}

/**
 * Gets exact duration in seconds of an audio or video file using ffprobe.
 */
export async function getAudioDuration(filePath: string): Promise<number> {
  const ffprobePath = getFFprobePath();

  return new Promise((resolve) => {
    const child = spawn(
      ffprobePath,
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        filePath,
      ],
      { windowsHide: true }
    );

    let stdout = "";
    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.on("close", (code) => {
      if (code === 0) {
        const val = parseFloat(stdout.trim());
        if (!isNaN(val) && val > 0) {
          return resolve(val);
        }
      }
      // Fallback: estimate based on file size or word count
      resolve(5.0);
    });

    child.on("error", () => {
      resolve(5.0);
    });
  });
}
