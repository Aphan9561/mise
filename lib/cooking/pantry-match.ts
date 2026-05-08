import type { PantryItem } from "@/lib/supabase/pantry";

export type ParsedIngredient = {
  raw: string;
  quantity: string | null;
  unit: string | null;
  name: string;
};

const COMMON_UNITS = new Set([
  "tsp",
  "tsps",
  "teaspoon",
  "teaspoons",
  "tbsp",
  "tbsps",
  "tablespoon",
  "tablespoons",
  "cup",
  "cups",
  "oz",
  "ounce",
  "ounces",
  "lb",
  "lbs",
  "pound",
  "pounds",
  "g",
  "gram",
  "grams",
  "kg",
  "kilogram",
  "kilograms",
  "ml",
  "milliliter",
  "milliliters",
  "l",
  "liter",
  "liters",
  "pinch",
  "pinches",
  "dash",
  "dashes",
  "clove",
  "cloves",
  "slice",
  "slices",
  "can",
  "cans",
  "package",
  "packages",
  "stick",
  "sticks",
  "head",
  "heads",
  "bunch",
  "bunches",
]);

const STOP_WORDS = new Set([
  "fresh",
  "freshly",
  "dried",
  "ground",
  "chopped",
  "minced",
  "diced",
  "sliced",
  "grated",
  "shredded",
  "crushed",
  "torn",
  "halved",
  "quartered",
  "peeled",
  "seeded",
  "trimmed",
  "rinsed",
  "washed",
  "drained",
  "softened",
  "melted",
  "warm",
  "warmed",
  "cold",
  "chilled",
  "frozen",
  "thawed",
  "whole",
  "large",
  "small",
  "medium",
  "ripe",
  "raw",
  "cooked",
  "uncooked",
  "boneless",
  "skinless",
  "of",
  "a",
  "an",
  "the",
  "and",
  "or",
  "extra",
  "virgin",
  "kosher",
  "sea",
  "fine",
  "coarse",
  "plus",
  "more",
  "for",
  "to",
  "taste",
  "garnish",
  "serving",
  "drizzling",
  "optional",
  "preferably",
  "such",
  "as",
  "approximately",
  "about",
  "roughly",
]);

const TRAILING_PHRASES = [
  /\bto taste\b/gi,
  /\bfor (garnish|serving|drizzling|topping|the .*)$/gi,
  /\boptional\b/gi,
  /\bplus more\b.*/gi,
  /\bor more\b.*/gi,
  /\bsuch as\b.*/gi,
  /\bdivided\b/gi,
];

function stripTrailingNote(value: string): string {
  const commaIndex = value.indexOf(",");
  return commaIndex >= 0 ? value.slice(0, commaIndex) : value;
}

function stripParentheticals(value: string): string {
  return value
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ");
}

function stripTrailingPhrases(value: string): string {
  let result = value;
  for (const pattern of TRAILING_PHRASES) {
    result = result.replace(pattern, " ");
  }
  return result;
}

function stripPunctuation(value: string): string {
  return value.replace(/[.,;:!?]+/g, " ");
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function isQuantityToken(token: string): boolean {
  return /^[\d¼½¾⅓⅔⅛⅜⅝⅞./-]+$/.test(token);
}

function isUnitToken(token: string): boolean {
  return COMMON_UNITS.has(token.toLowerCase().replace(/\.$/, ""));
}

function titleCase(value: string): string {
  return value.replace(/\b([a-z])([a-z']*)/g, (_, head: string, tail: string) =>
    head.toUpperCase() + tail,
  );
}

function cleanForName(value: string): string {
  const stripped = stripPunctuation(
    stripTrailingPhrases(
      stripTrailingNote(stripParentheticals(value)).toLowerCase(),
    ),
  );

  const tokens = normalizeWhitespace(stripped)
    .split(" ")
    .filter((token) => token.length > 0);

  const meaningful: string[] = [];
  let leadingStripped = false;

  for (const token of tokens) {
    if (!leadingStripped && (isQuantityToken(token) || isUnitToken(token))) {
      continue;
    }

    leadingStripped = true;

    if (STOP_WORDS.has(token)) {
      continue;
    }

    if (isQuantityToken(token) || isUnitToken(token)) {
      continue;
    }

    meaningful.push(token);
  }

  return meaningful.join(" ");
}

export function normalizeIngredientName(value: string): string {
  return cleanForName(value);
}

export function parseIngredientLine(raw: string): ParsedIngredient {
  const trimmed = raw.trim();
  const beforeNote = stripTrailingNote(trimmed);
  const tokens = normalizeWhitespace(beforeNote).split(" ");

  let quantity: string | null = null;
  let unit: string | null = null;

  if (tokens.length > 0 && isQuantityToken(tokens[0])) {
    quantity = tokens[0];

    if (tokens.length > 1 && isUnitToken(tokens[1])) {
      unit = tokens[1].replace(/\.$/, "");
    }
  }

  const cleanedName = cleanForName(trimmed);
  const fallback = normalizeWhitespace(stripParentheticals(beforeNote));
  const displayName = titleCase(cleanedName || fallback || trimmed);

  return {
    raw: trimmed,
    quantity,
    unit,
    name: displayName,
  };
}

function tokenize(value: string): string[] {
  return normalizeIngredientName(value)
    .split(" ")
    .filter((token) => token.length > 2);
}

export function ingredientMatchesPantry(
  ingredientName: string,
  pantry: PantryItem[],
): PantryItem | null {
  const ingredientTokens = tokenize(ingredientName);

  if (ingredientTokens.length === 0) {
    return null;
  }

  for (const item of pantry) {
    const pantryTokens = tokenize(item.name);

    if (pantryTokens.length === 0) {
      continue;
    }

    const overlap = pantryTokens.some((pantryToken) =>
      ingredientTokens.some(
        (ingredientToken) =>
          ingredientToken === pantryToken ||
          ingredientToken.startsWith(pantryToken) ||
          pantryToken.startsWith(ingredientToken),
      ),
    );

    if (overlap) {
      return item;
    }
  }

  return null;
}

export type IngredientPantryMatch = {
  parsed: ParsedIngredient;
  matchedPantryItem: PantryItem | null;
};

export function matchIngredientsAgainstPantry(
  ingredients: string[],
  pantry: PantryItem[],
): IngredientPantryMatch[] {
  return ingredients.map((line) => {
    const parsed = parseIngredientLine(line);
    return {
      parsed,
      matchedPantryItem: ingredientMatchesPantry(parsed.name, pantry),
    };
  });
}

/** Stable key for matching grocery rows and deduping additions. */
export function groceryCompareKey(displayName: string): string {
  const parsedName = parseIngredientLine(displayName).name.trim().toLowerCase();
  const fallback = displayName.trim().toLowerCase();
  return parsedName || fallback;
}

export type PantryCoverageSummary = {
  ingredientLines: number;
  matchedIngredients: number;
  percentRounded: number;
};

export function summarizePantryCoverage(
  ingredients: string[],
  pantry: PantryItem[],
): PantryCoverageSummary {
  if (!ingredients.length) {
    return {
      ingredientLines: 0,
      matchedIngredients: 0,
      percentRounded: 0,
    };
  }

  const matches = matchIngredientsAgainstPantry(ingredients, pantry);
  const matchedIngredients = matches.filter(
    (m) => m.matchedPantryItem !== null,
  ).length;
  const percentRounded = Math.round(
    (matchedIngredients / ingredients.length) * 100,
  );

  return {
    ingredientLines: ingredients.length,
    matchedIngredients,
    percentRounded,
  };
}
