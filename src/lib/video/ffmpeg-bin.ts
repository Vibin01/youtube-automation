import path from "path";
import fs from "fs";

export function getFFmpegPath(): string {
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }

  // 1. Direct workspace node_modules resolution (fixes Next.js Turbopack ENOENT)
  const isWin = process.platform === "win32";
  const ffmpegName = isWin ? "ffmpeg.exe" : "ffmpeg";
  const cwdFfmpeg = path.join(process.cwd(), "node_modules", "ffmpeg-static", ffmpegName);
  if (fs.existsSync(cwdFfmpeg)) {
    return cwdFfmpeg;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ffmpegStatic = require("ffmpeg-static");
    const resolved = typeof ffmpegStatic === "string" ? ffmpegStatic : ffmpegStatic?.default;
    if (resolved && fs.existsSync(resolved)) {
      return resolved;
    }
  } catch {
    // ignore
  }

  return "ffmpeg";
}

export function getFFprobePath(): string {
  if (process.env.FFPROBE_PATH && fs.existsSync(process.env.FFPROBE_PATH)) {
    return process.env.FFPROBE_PATH;
  }

  // 1. Direct workspace node_modules resolution
  const isWin = process.platform === "win32";
  const ffprobeName = isWin ? "ffprobe.exe" : "ffprobe";
  const archDir = process.arch === "ia32" ? "ia32" : "x64";
  const platformDir = isWin ? "win32" : process.platform;
  const cwdFfprobe = path.join(
    process.cwd(),
    "node_modules",
    "ffprobe-static",
    "bin",
    platformDir,
    archDir,
    ffprobeName
  );
  if (fs.existsSync(cwdFfprobe)) {
    return cwdFfprobe;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ffprobeStatic = require("ffprobe-static");
    const resolved = ffprobeStatic?.path || ffprobeStatic?.default?.path;
    if (resolved && fs.existsSync(resolved)) {
      return resolved;
    }
  } catch {
    // ignore
  }

  return "ffprobe";
}
