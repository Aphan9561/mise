import { generateCookingText } from "@/lib/ai/cooking";
import type { CreateRecipeInput } from "@/lib/supabase/recipes";

type ImportedRecipe = Omit<CreateRecipeInput, "clerkUserId">;

type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdValue[]
  | { [key: string]: JsonLdValue };

type JsonLdObject = { [key: string]: JsonLdValue };

function decodeEntities(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripHtml(value: string) {
  return decodeEntities(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function parseDurationMinutes(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const hours = value.match(/(\d+)H/i)?.[1];
  const minutes = value.match(/(\d+)M/i)?.[1];

  return (Number(hours ?? 0) || 0) * 60 + (Number(minutes ?? 0) || 0) || null;
}

function asStringArray(value: JsonLdValue | undefined): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          return stripHtml(item);
        }

        if (item && typeof item === "object") {
          const object = item as JsonLdObject;
          const text = object.text ?? object.name;

          return typeof text === "string" ? stripHtml(text) : "";
        }

        return "";
      })
      .filter(Boolean);
  }

  return typeof value === "string" ? [stripHtml(value)] : [];
}

function findRecipeSchema(value: JsonLdValue): JsonLdObject | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findRecipeSchema(item);

      if (found) {
        return found;
      }
    }

    return null;
  }

  const object = value as JsonLdObject;
  const type = object["@type"];
  const types = Array.isArray(type) ? type : [type];

  if (
    types.some(
      (item) => typeof item === "string" && item.toLowerCase() === "recipe",
    )
  ) {
    return object;
  }

  return (
    findRecipeSchema(object["@graph"]) ??
    findRecipeSchema(object.mainEntity) ??
    findRecipeSchema(object.itemListElement)
  );
}

function parseJsonLdRecipe(html: string): ImportedRecipe | null {
  const scripts = html.match(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,
  );

  for (const script of scripts ?? []) {
    const jsonText = decodeEntities(
      script
        .replace(/^<script[^>]*>/i, "")
        .replace(/<\/script>$/i, "")
        .trim(),
    );

    try {
      const parsed = JSON.parse(jsonText) as JsonLdValue;
      const recipe = findRecipeSchema(parsed);

      if (!recipe) {
        continue;
      }

      const instructions = asStringArray(recipe.recipeInstructions);
      const ingredients = asStringArray(recipe.recipeIngredient);
      const title = typeof recipe.name === "string" ? stripHtml(recipe.name) : "";

      if (!title || ingredients.length === 0 || instructions.length === 0) {
        continue;
      }

      return {
        title,
        description:
          typeof recipe.description === "string"
            ? stripHtml(recipe.description)
            : "",
        cuisine:
          typeof recipe.recipeCuisine === "string"
            ? stripHtml(recipe.recipeCuisine)
            : "",
        prepMinutes:
          parseDurationMinutes(recipe.totalTime) ??
          parseDurationMinutes(recipe.cookTime) ??
          parseDurationMinutes(recipe.prepTime),
        ingredients,
        instructions,
        source: "url",
      };
    } catch {
      continue;
    }
  }

  return null;
}

function readJsonObject(value: string) {
  const trimmed = value.trim();
  const json = trimmed.match(/\{[\s\S]*\}/)?.[0] ?? trimmed;

  return JSON.parse(json) as {
    title?: string;
    description?: string;
    cuisine?: string;
    prepMinutes?: number;
    ingredients?: string[];
    instructions?: string[];
  };
}

async function extractWithAi(url: string, html: string): Promise<ImportedRecipe | null> {
  const pageText = stripHtml(html).slice(0, 14000);
  const result = await generateCookingText({
    json: true,
    maxTokens: 900,
    system:
      "Extract a cooking recipe from webpage text. Return only JSON with title, description, cuisine, prepMinutes, ingredients, and instructions. Ingredients and instructions must be arrays of strings.",
    prompt: `Recipe URL: ${url}\n\nPage text:\n${pageText}`,
  });

  if (!result) {
    return null;
  }

  try {
    const parsed = readJsonObject(result.text);

    if (
      !parsed.title ||
      !Array.isArray(parsed.ingredients) ||
      !Array.isArray(parsed.instructions)
    ) {
      return null;
    }

    return {
      title: parsed.title.trim(),
      description: parsed.description?.trim() ?? "",
      cuisine: parsed.cuisine?.trim() ?? "",
      prepMinutes: Number.isFinite(parsed.prepMinutes)
        ? Number(parsed.prepMinutes)
        : null,
      ingredients: parsed.ingredients.map(String).filter(Boolean),
      instructions: parsed.instructions.map(String).filter(Boolean),
      source: "url",
    };
  } catch {
    return null;
  }
}

export async function importRecipeFromUrl(url: string) {
  const parsedUrl = new URL(url);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(parsedUrl, {
      headers: {
        "User-Agent": "Mise recipe importer",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Could not fetch recipe URL: ${response.status}`);
    }

    const html = await response.text();
    const recipe = parseJsonLdRecipe(html) ?? (await extractWithAi(url, html));

    if (!recipe) {
      throw new Error(
        "Could not find a recipe on that page. Try a recipe page with ingredients and steps.",
      );
    }

    return {
      ...recipe,
      sourceUrl: parsedUrl.toString(),
    };
  } finally {
    clearTimeout(timeout);
  }
}
