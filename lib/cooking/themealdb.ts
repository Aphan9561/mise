import {
  fallbackDiscoveryRecipes,
  mapTheMealDbToDiscoveryDetail,
  mapTheMealDbToDiscoveryRecipe,
  normalizeDiscoverySearchQuery,
  type DiscoveryRecipe,
  type DiscoveryRecipeDetail,
  type TheMealDbMeal,
  fallbackRecipeToDetail,
} from "@/lib/cooking/discovery";

export const THEMEALDB_BASE = "https://www.themealdb.com/api/json/v1/1";

type MealDbListEntry = {
  idMeal: string;
  strMeal: string;
  strMealThumb?: string;
};

export function mealHasFullDetail(meal: TheMealDbMeal): boolean {
  return Boolean(
    meal.strInstructions?.trim() || meal.strIngredient1?.trim(),
  );
}

export async function fetchThemealdbJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function searchMealsByName(
  term: string,
): Promise<TheMealDbMeal[] | null> {
  const data = await fetchThemealdbJson<{ meals: TheMealDbMeal[] | null }>(
    `${THEMEALDB_BASE}/search.php?s=${encodeURIComponent(term)}`,
  );
  return data?.meals ?? null;
}

export async function filterMealsByMainIngredient(
  ingredient: string,
): Promise<MealDbListEntry[] | null> {
  const normalized = ingredient.trim().toLowerCase().replace(/\s+/g, "_");
  const data = await fetchThemealdbJson<{ meals: MealDbListEntry[] | null }>(
    `${THEMEALDB_BASE}/filter.php?i=${encodeURIComponent(normalized)}`,
  );
  return data?.meals ?? null;
}

export async function filterMealsByCategory(
  category: string,
): Promise<MealDbListEntry[] | null> {
  const data = await fetchThemealdbJson<{ meals: MealDbListEntry[] | null }>(
    `${THEMEALDB_BASE}/filter.php?c=${encodeURIComponent(category.trim())}`,
  );
  return data?.meals ?? null;
}

export async function filterMealsByArea(
  area: string,
): Promise<MealDbListEntry[] | null> {
  const data = await fetchThemealdbJson<{ meals: MealDbListEntry[] | null }>(
    `${THEMEALDB_BASE}/filter.php?a=${encodeURIComponent(area.trim())}`,
  );
  return data?.meals ?? null;
}

export async function lookupMeal(id: string): Promise<TheMealDbMeal | null> {
  const data = await fetchThemealdbJson<{ meals: TheMealDbMeal[] | null }>(
    `${THEMEALDB_BASE}/lookup.php?i=${encodeURIComponent(id)}`,
  );
  return data?.meals?.[0] ?? null;
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));
}

export async function listTheMealDbCategories(): Promise<string[]> {
  const data = await fetchThemealdbJson<{
    meals: { strCategory: string }[] | null;
  }>(`${THEMEALDB_BASE}/list.php?c=list`);
  return uniqueSorted(data?.meals?.map((m) => m.strCategory) ?? []);
}

export async function listTheMealDbAreas(): Promise<string[]> {
  const data = await fetchThemealdbJson<{
    meals: { strArea: string }[] | null;
  }>(`${THEMEALDB_BASE}/list.php?a=list`);
  return uniqueSorted(data?.meals?.map((m) => m.strArea) ?? []);
}

export async function hydrateMeals(
  meals: TheMealDbMeal[],
): Promise<DiscoveryRecipe[]> {
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

function listEntriesToPartialMeals(
  entries: MealDbListEntry[],
): TheMealDbMeal[] {
  return entries.map(
    (m) =>
      ({
        idMeal: m.idMeal,
        strMeal: m.strMeal,
        strMealThumb: m.strMealThumb,
      }) as TheMealDbMeal,
  );
}

export async function fetchDiscoveryMeals(options: {
  category?: string | null;
  area?: string | null;
  ingredient?: string | null;
  query?: string | null;
  limit: number;
}): Promise<{ meals: TheMealDbMeal[] | null }> {
  const { category, area, ingredient, query, limit } = options;

  if (category?.trim()) {
    const filtered = await filterMealsByCategory(category);
    return {
      meals: filtered?.length
        ? listEntriesToPartialMeals(filtered.slice(0, limit))
        : null,
    };
  }

  if (area?.trim()) {
    const filtered = await filterMealsByArea(area);
    return {
      meals: filtered?.length
        ? listEntriesToPartialMeals(filtered.slice(0, limit))
        : null,
    };
  }

  if (ingredient?.trim()) {
    const filtered = await filterMealsByMainIngredient(ingredient);
    return {
      meals: filtered?.length
        ? listEntriesToPartialMeals(filtered.slice(0, limit))
        : null,
    };
  }

  const rawQuery = query?.trim() || "weeknight dinner";
  const searchTerm = normalizeDiscoverySearchQuery(rawQuery);
  let meals: TheMealDbMeal[] | null = await searchMealsByName(searchTerm);

  if (!meals?.length) {
    const filtered = await filterMealsByMainIngredient(searchTerm);
    if (filtered?.length) {
      meals = listEntriesToPartialMeals(filtered.slice(0, limit));
    }
  } else {
    meals = meals.slice(0, limit);
  }

  return { meals };
}

export function filterFallbackRecipes(
  query: string,
  category: string | undefined,
  area: string | undefined,
  ingredient: string | undefined,
  recipes: DiscoveryRecipe[],
): DiscoveryRecipe[] {
  const q = query.toLowerCase();
  const cat = category?.toLowerCase().trim();
  const ar = area?.toLowerCase().trim();
  const ing = ingredient?.toLowerCase().trim();

  const narrowed = recipes.filter((recipe) => {
    const blob = `${recipe.title} ${recipe.cuisine} ${recipe.ingredients.join(" ")}`.toLowerCase();
    if (cat && !blob.includes(cat)) return false;
    if (ar && !recipe.cuisine.toLowerCase().includes(ar)) return false;
    if (ing && !blob.includes(ing.replace(/_/g, " "))) return false;
    if (q && q !== "weeknight dinner" && !blob.includes(q)) return false;
    return true;
  });

  return narrowed.length > 0 ? narrowed : recipes;
}

export async function getDiscoveryPageInitialData(): Promise<{
  recipes: DiscoveryRecipe[];
  source: string;
}> {
  const { meals } = await fetchDiscoveryMeals({
    query: "weeknight dinner",
    limit: 12,
  });
  if (!meals?.length) {
    return {
      source: "local",
      recipes: fallbackDiscoveryRecipes,
    };
  }
  const recipes = await hydrateMeals(meals);
  if (!recipes.length) {
    return {
      source: "local",
      recipes: fallbackDiscoveryRecipes,
    };
  }
  return { source: "TheMealDB", recipes };
}

export async function getDiscoveryRecipeDetail(
  id: string,
): Promise<DiscoveryRecipeDetail | null> {
  if (id.startsWith("fallback-")) {
    const recipe = fallbackDiscoveryRecipes.find((r) => r.id === id);
    return recipe ? fallbackRecipeToDetail(recipe) : null;
  }
  const meal = await lookupMeal(id);
  return meal ? mapTheMealDbToDiscoveryDetail(meal) : null;
}
