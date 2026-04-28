import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  fallbackDiscoveryRecipes,
  mapTheMealDbToDiscoveryRecipe,
  normalizeDiscoverySearchQuery,
  type DiscoveryRecipe,
  type TheMealDbMeal,
} from "@/lib/cooking/discovery";

const THEMEALDB_BASE = "https://www.themealdb.com/api/json/v1/1";

type MealDbListEntry = {
  idMeal: string;
  strMeal: string;
  strMealThumb?: string;
};

function mealHasFullDetail(meal: TheMealDbMeal): boolean {
  return Boolean(
    meal.strInstructions?.trim() || meal.strIngredient1?.trim(),
  );
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function searchMealsByName(term: string): Promise<TheMealDbMeal[] | null> {
  const data = await fetchJson<{ meals: TheMealDbMeal[] | null }>(
    `${THEMEALDB_BASE}/search.php?s=${encodeURIComponent(term)}`,
  );
  return data?.meals ?? null;
}

async function filterMealsByMainIngredient(
  ingredient: string,
): Promise<MealDbListEntry[] | null> {
  const normalized = ingredient.trim().toLowerCase().replace(/\s+/g, "_");
  const data = await fetchJson<{ meals: MealDbListEntry[] | null }>(
    `${THEMEALDB_BASE}/filter.php?i=${encodeURIComponent(normalized)}`,
  );
  return data?.meals ?? null;
}

async function lookupMeal(id: string): Promise<TheMealDbMeal | null> {
  const data = await fetchJson<{ meals: TheMealDbMeal[] | null }>(
    `${THEMEALDB_BASE}/lookup.php?i=${encodeURIComponent(id)}`,
  );
  return data?.meals?.[0] ?? null;
}

async function hydrateMeals(meals: TheMealDbMeal[]): Promise<DiscoveryRecipe[]> {
  const detailed = await Promise.all(
    meals.map(async (meal) => {
      if (mealHasFullDetail(meal)) {
        return mapTheMealDbToDiscoveryRecipe(meal);
      }
      const full = await lookupMeal(meal.idMeal);
      return full
        ? mapTheMealDbToDiscoveryRecipe(full)
        : mapTheMealDbToDiscoveryRecipe(meal);
    }),
  );
  return detailed.filter((r) => r.title);
}

function filterFallbackByQuery(
  query: string,
  recipes: DiscoveryRecipe[],
): DiscoveryRecipe[] {
  const q = query.toLowerCase();
  const narrowed = recipes.filter((recipe) => {
    const text = `${recipe.title} ${recipe.cuisine} ${recipe.ingredients.join(" ")}`;
    return text.toLowerCase().includes(q);
  });
  return narrowed.length > 0 ? narrowed : recipes;
}

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const rawQuery = url.searchParams.get("query")?.trim() || "weeknight dinner";
  const searchTerm = normalizeDiscoverySearchQuery(rawQuery);

  let meals: TheMealDbMeal[] | null = await searchMealsByName(searchTerm);

  if (!meals?.length) {
    const filtered = await filterMealsByMainIngredient(searchTerm);
    if (filtered?.length) {
      meals = filtered.map((m) => ({
        idMeal: m.idMeal,
        strMeal: m.strMeal,
        strMealThumb: m.strMealThumb,
      })) as TheMealDbMeal[];
    }
  }

  if (!meals?.length) {
    return NextResponse.json({
      source: "local",
      recipes: filterFallbackByQuery(rawQuery, fallbackDiscoveryRecipes),
    });
  }

  const slice = meals.slice(0, 6);
  const recipes = await hydrateMeals(slice);

  if (!recipes.length) {
    return NextResponse.json({
      source: "local",
      recipes: filterFallbackByQuery(rawQuery, fallbackDiscoveryRecipes),
    });
  }

  return NextResponse.json({
    source: "TheMealDB",
    recipes,
  });
}
