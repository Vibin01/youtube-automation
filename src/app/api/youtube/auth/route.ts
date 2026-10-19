import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/youtube/client";

export async function GET() {
  try {
    const url = getAuthUrl();
    return NextResponse.json({ success: true, url });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
