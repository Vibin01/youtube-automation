import { NextRequest, NextResponse } from "next/server";
import { getAppSettings, updateAppSettings } from "@/lib/database/settings";
import { SettingsUpdateSchema } from "@/lib/validation";

export async function GET() {
  try {
    const settings = await getAppSettings();
    return NextResponse.json({
      success: true,
      data: {
        ...settings,
        hasGeminiApiKey: Boolean(settings.geminiApiKey && settings.geminiApiKey.length > 5),
        geminiApiKeyMasked: settings.geminiApiKey
          ? `${settings.geminiApiKey.slice(0, 4)}...${settings.geminiApiKey.slice(-4)}`
          : "",
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = SettingsUpdateSchema.parse(body);

    const updatePayload: Record<string, unknown> = { ...validated };
    if (!updatePayload.geminiApiKey || (updatePayload.geminiApiKey as string).trim() === "") {
      delete updatePayload.geminiApiKey; // don't wipe key if blank submitted
    }

    const updated = await updateAppSettings(updatePayload);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
