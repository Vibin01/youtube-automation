import { NextRequest, NextResponse } from "next/server";
import { handleOAuthCallback } from "@/lib/youtube/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(`${appUrl}/publishing?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/publishing?error=missing_code`);
  }

  try {
    await handleOAuthCallback(code);
    return NextResponse.redirect(`${appUrl}/publishing?connected=true`);
  } catch (err: unknown) {
    const errObj = err as Error;
    console.error("OAuth callback error:", errObj);
    return NextResponse.redirect(
      `${appUrl}/publishing?error=${encodeURIComponent(errObj.message || "oauth_failed")}`
    );
  }
}
