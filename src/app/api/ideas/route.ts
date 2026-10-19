import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { generateContentIdeas } from "@/lib/gemini/client";
import { IdeaGenerationSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const format = searchParams.get("format");
    const language = searchParams.get("language");

    const where: Record<string, string> = {};
    if (status && status !== "ALL") where.status = status;
    if (format && format !== "ALL") where.format = format;
    if (language && language !== "ALL") where.language = language;

    const ideas = await prisma.contentIdea.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, data: ideas });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = IdeaGenerationSchema.parse(body);

    const generatedIdeas = await generateContentIdeas(validated);

    // Save to SQLite
    const savedRecords = await Promise.all(
      generatedIdeas.map((idea) =>
        prisma.contentIdea.create({
          data: {
            title: idea.title,
            hook: idea.hook,
            description: idea.description,
            targetAudience: idea.targetAudience,
            niche: idea.niche,
            format: validated.format,
            language: validated.language,
            category: validated.category,
            estimatedDuration: idea.estimatedDuration,
            tags: JSON.stringify(idea.tags),
            status: "GENERATED",
          },
        })
      )
    );

    return NextResponse.json({ success: true, data: savedRecords });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
