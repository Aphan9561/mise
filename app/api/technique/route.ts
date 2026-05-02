import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { generateCookingText } from "@/lib/ai/cooking";
import { findTechniqueDefinition } from "@/lib/cooking/techniques";

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    term?: string;
    context?: string;
  };
  const term = body.term?.trim();

  if (!term) {
    return NextResponse.json({ error: "Missing term" }, { status: 400 });
  }

  const fallback = findTechniqueDefinition(term);

  const result = await generateCookingText({
    maxTokens: 180,
    system:
      "You are a concise cooking instructor. Explain a technique term to a home cook in two short sentences. Reply in plain text only — no markdown, no bold or italics, no headers, and no labels like 'Definition:' or 'The Cue:'. Do not add a separate cue line; only explain the technique.",
    prompt: `Explain "${term}" in this recipe context: ${body.context ?? "No context provided."}`,
  });

  if (!result) {
    return NextResponse.json({
      source: "local",
      explanation:
        fallback?.explanation ??
        `I could not reach the AI service, but "${term}" is usually a cooking method you can judge by texture, color, and aroma.`,
      cue: fallback?.cue ?? "Move slowly and watch for the recipe's visual cues.",
    });
  }

  return NextResponse.json({
    source: result.source,
    explanation: result.text,
    cue: fallback?.cue ?? "",
  });
}
