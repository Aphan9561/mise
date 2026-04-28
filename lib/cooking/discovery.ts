export type DiscoveryRecipe = {
  id: string;
  title: string;
  cuisine: string;
  readyInMinutes: number;
  summary: string;
  imageUrl?: string;
  ingredients: string[];
  instructions: string[];
};

/** Shape returned by TheMealDB search.php and lookup.php (dynamic ingredient fields). */
export type TheMealDbMeal = {
  idMeal: string;
  strMeal: string;
  strArea?: string | null;
  strCategory?: string | null;
  strInstructions?: string | null;
  strMealThumb?: string | null;
} & Record<string, string | null | undefined>;

const THEMEALDB_DEFAULT_SEARCH = "chicken";

export function normalizeDiscoverySearchQuery(query: string): string {
  const trimmed = query.trim();
  if (!trimmed || trimmed.toLowerCase() === "weeknight dinner") {
    return THEMEALDB_DEFAULT_SEARCH;
  }
  return trimmed;
}

function extractTheMealDbIngredients(meal: TheMealDbMeal): string[] {
  const out: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`]?.trim();
    if (!ing) continue;
    const meas = meal[`strMeasure${i}`]?.trim();
    out.push(meas ? `${meas} ${ing}` : ing);
  }
  return out;
}

function extractTheMealDbInstructionSteps(
  text: string | null | undefined,
  maxLines?: number,
): string[] {
  if (!text) return [];
  const lines = text
    .split(/\r\n|\n/)
    .map((line) =>
      line
        .replace(/^(step\s*\d+[:.)-]?\s*)/i, "")
        .trim(),
    )
    .filter(Boolean);
  if (maxLines != null) return lines.slice(0, maxLines);
  return lines;
}

function theMealDbSummary(meal: TheMealDbMeal): string {
  const instructions = meal.strInstructions?.replace(/\s+/g, " ").trim() ?? "";
  if (instructions.length <= 220) {
    return instructions || "A recipe from TheMealDB.";
  }
  const area = meal.strArea?.trim();
  const category = meal.strCategory?.trim();
  if (area && category) {
    return `${category} from ${area}. ${instructions.slice(0, 180)}…`;
  }
  return `${instructions.slice(0, 200)}…`;
}

export function mapTheMealDbToDiscoveryRecipe(meal: TheMealDbMeal): DiscoveryRecipe {
  return {
    id: meal.idMeal,
    title: meal.strMeal,
    cuisine: meal.strArea?.trim() || meal.strCategory?.trim() || "TheMealDB",
    readyInMinutes: 30,
    summary: theMealDbSummary(meal),
    imageUrl: meal.strMealThumb?.trim() ?? "",
    ingredients: extractTheMealDbIngredients(meal),
    instructions: extractTheMealDbInstructionSteps(meal.strInstructions, 12),
  };
}

export type DiscoveryRecipeDetail = DiscoveryRecipe & {
  category: string | null;
  youtubeUrl: string | null;
  sourceUrl: string | null;
};

export function mapTheMealDbToDiscoveryDetail(meal: TheMealDbMeal): DiscoveryRecipeDetail {
  const base = mapTheMealDbToDiscoveryRecipe(meal);
  return {
    ...base,
    instructions: extractTheMealDbInstructionSteps(meal.strInstructions),
    category: meal.strCategory?.trim() ?? null,
    youtubeUrl: meal.strYoutube?.trim() ?? null,
    sourceUrl: meal.strSource?.trim() ?? null,
  };
}

export function fallbackRecipeToDetail(recipe: DiscoveryRecipe): DiscoveryRecipeDetail {
  return {
    ...recipe,
    category: null,
    youtubeUrl: null,
    sourceUrl: null,
  };
}

export const fallbackDiscoveryRecipes: DiscoveryRecipe[] = [
  {
    id: "fallback-miso-noodles",
    title: "Miso Peanut Noodles",
    cuisine: "Japanese-inspired",
    readyInMinutes: 20,
    summary: "A fast pantry dinner with chewy noodles and a savory peanut sauce.",
    imageUrl: "",
    ingredients: [
      "8 oz noodles",
      "2 tbsp miso",
      "2 tbsp peanut butter",
      "1 tbsp soy sauce",
      "1 lime",
      "Scallions",
    ],
    instructions: [
      "Boil the noodles until just tender, then reserve a cup of cooking water.",
      "Whisk miso, peanut butter, soy sauce, lime juice, and a splash of hot water.",
      "Toss noodles with sauce, adding cooking water until glossy.",
      "Top with scallions and serve warm.",
    ],
  },
  {
    id: "fallback-tomato-eggs",
    title: "Jammy Tomato Eggs",
    cuisine: "Weeknight",
    readyInMinutes: 18,
    summary: "Soft eggs simmered in a bright tomato sauce with toast for scooping.",
    imageUrl: "",
    ingredients: [
      "1 can crushed tomatoes",
      "4 eggs",
      "2 cloves garlic",
      "1 tsp smoked paprika",
      "Parsley",
      "Toast",
    ],
    instructions: [
      "Saute minced garlic in olive oil until fragrant.",
      "Simmer tomatoes and paprika until slightly reduced.",
      "Crack in eggs, cover, and simmer until the whites set.",
      "Finish with parsley and serve with toast.",
    ],
  },
  {
    id: "fallback-chickpea-skillet",
    title: "Crispy Chickpea Skillet",
    cuisine: "Mediterranean",
    readyInMinutes: 25,
    summary: "Crispy chickpeas, lemony yogurt, and greens in one skillet.",
    imageUrl: "",
    ingredients: [
      "1 can chickpeas",
      "Greek yogurt",
      "1 lemon",
      "Baby spinach",
      "Cumin",
      "Pita",
    ],
    instructions: [
      "Dry chickpeas well, then sear them in olive oil until crisp.",
      "Season with cumin, salt, and pepper.",
      "Fold in spinach until wilted.",
      "Serve over lemon yogurt with warm pita.",
    ],
  },
];
