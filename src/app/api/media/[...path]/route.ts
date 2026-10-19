import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  if (!pathSegments || pathSegments.length === 0) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Prevent directory traversal attacks
  const safePath = pathSegments.join("/");
  if (safePath.includes("..") || path.isAbsolute(safePath)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const baseOutputDir = path.resolve(process.cwd(), "output");
  const fullFilePath = path.join(baseOutputDir, safePath);

  if (!fs.existsSync(fullFilePath)) {
    return new NextResponse("File Not Found", { status: 404 });
  }

  const ext = path.extname(fullFilePath).toLowerCase();
  let contentType = "application/octet-stream";
  if (ext === ".mp4") contentType = "video/mp4";
  else if (ext === ".png") contentType = "image/png";
  else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
  else if (ext === ".mp3") contentType = "audio/mpeg";
  else if (ext === ".vtt") contentType = "text/vtt";

  const stat = fs.statSync(fullFilePath);
  const fileSize = stat.size;
  const range = request.headers.get("range");

  if (range && ext === ".mp4") {
    // Support HTTP Range requests for smooth video scrubbing/seeking
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const fileStream = fs.createReadStream(fullFilePath, { start, end });

    return new NextResponse(fileStream as unknown as ReadableStream, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize.toString(),
        "Content-Type": contentType,
      },
    });
  }

  const fileStream = fs.createReadStream(fullFilePath);
  return new NextResponse(fileStream as unknown as ReadableStream, {
    status: 200,
    headers: {
      "Content-Length": fileSize.toString(),
      "Content-Type": contentType,
    },
  });
}
