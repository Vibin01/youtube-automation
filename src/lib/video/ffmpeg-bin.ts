import path from "path";
import fs from "fs";

export function getFFmpegPath(): string {
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ffmpegStatic = require("ffmpeg-static");
    if (ffmpegStatic && fs.existsSync(ffmpegStatic)) {
      return ffmpegStatic;
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

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ffprobeStatic = require("ffprobe-static");
    if (ffprobeStatic?.path && fs.existsSync(ffprobeStatic.path)) {
      return ffprobeStatic.path;
    }
  } catch {
    // ignore
  }

  return "ffprobe";
}
