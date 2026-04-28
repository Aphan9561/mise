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

function asImageUrl(value: JsonLdValue | undefined): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const image = asImageUrl(item);

      if (image) {
        return image;
      }
    }
  }

  if (value && typeof value === "object") {
    const object = value as JsonLdObject;
    const url = object.url ?? object.contentUrl;

    return typeof url === "string" ? url : "";
  }

  return "";
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

function asFirstString(value: JsonLdValue | undefined): string {
  if (typeof value === "string") {
    return stripHtml(value);
  }

  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === "string");

    return typeof first === "string" ? stripHtml(first) : "";
  }

  return "";
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
  const scripts = [
    ...html.matchAll(
      /<script\b[^>]*type=["'][^"']*ld\+json[^"']*["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ].map((match) => match[1]);

  for (const script of scripts ?? []) {
    const jsonText = decodeEntities(script.trim());

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
          asFirstString(recipe.recipeCuisine) || asFirstString(recipe.cuisine),
        prepMinutes:
          parseDurationMinutes(recipe.totalTime) ??
          parseDurationMinutes(recipe.cookTime) ??
          parseDurationMinutes(recipe.prepTime),
        ingredients,
        instructions,
        imageUrl: asImageUrl(recipe.image) || null,
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
    imageUrl?: string;
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
      "Extract a cooking recipe from webpage text. Return only JSON with title, description, cuisine, prepMinutes, imageUrl, ingredients, and instructions. Ingredients and instructions must be arrays of strings.",
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
      imageUrl: parsed.imageUrl?.trim() ?? null,
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
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 MiseRecipeImporter/1.0",
      },
      redirect: "follow",
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
