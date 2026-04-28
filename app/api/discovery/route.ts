import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { fallbackDiscoveryRecipes } from "@/lib/cooking/discovery";
import {
  fetchDiscoveryMeals,
  filterFallbackRecipes,
  hydrateMeals,
} from "@/lib/cooking/themealdb";

function parseLimit(raw: string | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 12;
  return Math.min(24, Math.max(6, Math.floor(n)));
}

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const category = url.searchParams.get("category")?.trim() || undefined;
  const area = url.searchParams.get("area")?.trim() || undefined;
  const ingredient = url.searchParams.get("ingredient")?.trim() || undefined;
  const rawQuery = url.searchParams.get("query")?.trim() || undefined;
  const limit = parseLimit(url.searchParams.get("limit"));

  const { meals } = await fetchDiscoveryMeals({
    category,
    area,
    ingredient,
    query: rawQuery,
    limit,
  });

  if (!meals?.length) {
    return NextResponse.json({
      source: "local",
      recipes: filterFallbackRecipes(
        rawQuery ?? "weeknight dinner",
        category,
        area,
        ingredient,
        fallbackDiscoveryRecipes,
      ),
    });
  }

  const recipes = await hydrateMeals(meals);

  if (!recipes.length) {
    return NextResponse.json({
      source: "local",
      recipes: filterFallbackRecipes(
        rawQuery ?? "weeknight dinner",
        category,
        area,
        ingredient,
        fallbackDiscoveryRecipes,
      ),
    });
  }

  return NextResponse.json({
    source: "TheMealDB",
    recipes,
  });
}
