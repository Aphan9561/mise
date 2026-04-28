import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { generateCookingText } from "@/lib/ai/cooking";
import type { UserRecipe } from "@/lib/supabase/recipes";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function fallbackAnswer(question: string, recipe?: Partial<UserRecipe>) {
  const lowerQuestion = question.toLowerCase();

  if (lowerQuestion.includes("substitute") || lowerQuestion.includes("instead")) {
    return "A good substitution depends on the ingredient's job. Match fat for fat, acid for acid, and liquid for liquid, then adjust seasoning after tasting.";
  }

  if (lowerQuestion.includes("thin") || lowerQuestion.includes("watery")) {
    return "Simmer it uncovered to reduce extra liquid. If it still needs body, whisk a small spoonful of starch with cold water and add it gradually.";
  }

  if (lowerQuestion.includes("burn") || lowerQuestion.includes("too dark")) {
    return "Lower the heat, move the food to a cooler part of the pan, and taste before adding more seasoning because browned bits can turn bitter quickly.";
  }

  return recipe?.title
    ? `For ${recipe.title}, focus on the next instruction and use visual cues before timing alone. If something smells harsh or looks too dark, lower the heat and slow down.`
    : "Use heat control first: lower the heat if things are moving too fast, add small amounts of liquid if food sticks, and taste before making a big adjustment.";
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    question?: string;
    recipe?: Partial<UserRecipe>;
    messages?: ChatMessage[];
  };
  const question = body.question?.trim();

  if (!question) {
    return NextResponse.json({ error: "Missing question" }, { status: 400 });
  }

  const recipeContext = body.recipe
    ? [
        `Recipe: ${body.recipe.title}`,
        `Notes: ${body.recipe.notes ?? "No notes."}`,
        `Ingredients: ${(body.recipe.ingredients ?? []).join(", ")}`,
        `Steps: ${(body.recipe.instructions ?? []).join(" | ")}`,
      ].join("\n")
    : "No selected recipe.";
  const recentMessages = (body.messages ?? [])
    .slice(-6)
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n");

  const result = await generateCookingText({
    maxTokens: 260,
    system:
      "You are Mise, a calm cooking assistant for home cooks. Give concise, practical answers that can be used while cooking. Prioritize safety, texture, timing, substitutions, and sensory cues.",
    prompt: `${recipeContext}\n\nRecent conversation:\n${recentMessages || "No previous messages."}\n\nCurrent question: ${question}`,
  });

  if (!result) {
    return NextResponse.json({
      source: "local",
      answer: fallbackAnswer(question, body.recipe),
    });
  }

  return NextResponse.json({
    source: result.source,
    answer: result.text,
  });
}
