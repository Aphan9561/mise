import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import {
  fallbackDiscoveryRecipes,
  type DiscoveryRecipe,
} from "@/lib/cooking/discovery";

type SpoonacularRecipe = {
  id: number;
  title: string;
  cuisines?: string[];
  readyInMinutes?: number;
  summary?: string;
  image?: string;
  extendedIngredients?: { original?: string; name?: string }[];
  analyzedInstructions?: { steps?: { step?: string }[] }[];
};

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function mapSpoonacularRecipe(recipe: SpoonacularRecipe): DiscoveryRecipe {
  return {
    id: String(recipe.id),
    title: recipe.title,
    cuisine: recipe.cuisines?.[0] ?? "Recommended",
    readyInMinutes: recipe.readyInMinutes ?? 30,
    summary: stripHtml(recipe.summary ?? "A recommended recipe to try."),
    imageUrl: recipe.image ?? "",
    ingredients:
      recipe.extendedIngredients
        ?.map((ingredient) => ingredient.original ?? ingredient.name ?? "")
        .filter(Boolean)
        .slice(0, 8) ?? [],
    instructions:
      recipe.analyzedInstructions?.[0]?.steps
        ?.map((step) => step.step ?? "")
        .filter(Boolean)
        .slice(0, 6) ?? [],
  };
}

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("query")?.trim() || "weeknight dinner";

  if (!serverEnv.spoonacularApiKey) {
    return NextResponse.json({
      source: "local",
      recipes: fallbackDiscoveryRecipes.filter((recipe) => {
        const text = `${recipe.title} ${recipe.cuisine} ${recipe.ingredients.join(" ")}`;
        return text.toLowerCase().includes(query.toLowerCase()) || query === "weeknight dinner";
      }),
    });
  }

  const spoonacularUrl = new URL(
    "https://api.spoonacular.com/recipes/complexSearch",
  );
  spoonacularUrl.searchParams.set("apiKey", serverEnv.spoonacularApiKey);
  spoonacularUrl.searchParams.set("query", query);
  spoonacularUrl.searchParams.set("number", "6");
  spoonacularUrl.searchParams.set("addRecipeInformation", "true");
  spoonacularUrl.searchParams.set("fillIngredients", "true");

  const response = await fetch(spoonacularUrl);

  if (!response.ok) {
    return NextResponse.json({
      source: "local",
      recipes: fallbackDiscoveryRecipes,
    });
  }

  const data = (await response.json()) as {
    results?: SpoonacularRecipe[];
  };

  return NextResponse.json({
    source: "spoonacular",
    recipes: data.results?.map(mapSpoonacularRecipe) ?? [],
  });
}
