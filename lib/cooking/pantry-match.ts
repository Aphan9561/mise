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
  "ts",
  "teaspoon",
  "teaspoons",
  "tbsp",
  "tbsps",
  "tbs",
  "tbls",
  "dsp",
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
  "millilitre",
  "millilitres",
  "cl",
  "dl",
  "l",
  "liter",
  "liters",
  "litre",
  "litres",
  "pint",
  "pints",
  "floz",
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

/** Unicode + ASCII fractions and plain numeric quantities used in ingredient lines. */
const QTY_RE = String.raw`\d+(?:\.\d+)?|\d+\/\d+|[¼½¾⅓⅔⅛⅜⅝⅞]`;

const GLUED_SUFFIXES = new Set([
  "g",
  "kg",
  "mg",
  "lb",
  "lbs",
  "oz",
  "floz",
  "ml",
  "cl",
  "dl",
  "l",
  "gram",
  "grams",
  "ounce",
  "ounces",
  "tsp",
  "tsps",
  "ts",
  "tbsp",
  "tbsps",
  "tbls",
  "tbs",
  "dsp",
  "cup",
  "cups",
  "can",
  "cans",
  "stalk",
  "stalks",
  "sprig",
  "sprigs",
]);

function classifyToken(raw: string): string {
  return raw.toLowerCase().replace(/\.$/, "");
}

function looksLikeGluedMeasureToken(raw: string): boolean {
  const t = classifyToken(raw);
  const glued = new RegExp(
    `^(${QTY_RE})(?:\\s*[x×]\\s*)?([a-z]{1,7})$`,
    "i",
  ).exec(t);
  if (!glued) {
    return false;
  }
  return GLUED_SUFFIXES.has(glued[2].toLowerCase());
}

function stripRepeatedLeadingMeasures(value: string): string {
  let s = normalizeWhitespace(value);
  const gluedStart = new RegExp(
    `^(${QTY_RE})(?:\\s*[x×]\\s*)?([a-z]{1,7})(?=\\s|$)`,
    "i",
  );

  const spacedMeasures = new RegExp(
    `^(${QTY_RE})(?:\\s*-\\s*(${QTY_RE}))?\\s+(?:cups?|tablespoons?|teaspoons?|tsps|tbsps?|tbls|tbs|ts|grams?|ounces?|pounds?|kilograms?|millilitres?|milliliters?|litres?|liters?|stalks?)\\b\\.?`,
    "i",
  );

  const spacedShortUnits = new RegExp(
    `^(${QTY_RE})\\s+(g|kg|lbs?|oz|ml|cl)\\b\\.?`,
    "i",
  );

  for (let guard = 0; guard < 14; guard++) {
    const before = s;
    s = s
      .replace(/^(approximately|approx\.|approx|about|roughly)\s+/i, "")
      .trimStart();
    s = s.replace(/^~\s+/i, "").trimStart();

    const gluedMatch = gluedStart.exec(s);
    if (gluedMatch && GLUED_SUFFIXES.has(gluedMatch[2].toLowerCase())) {
      s = s.slice(gluedMatch[0].length).trimStart();
      continue;
    }

    if (spacedMeasures.test(s)) {
      s = s.replace(spacedMeasures, "").trimStart();
      continue;
    }

    if (spacedShortUnits.test(s)) {
      s = s.replace(spacedShortUnits, "").trimStart();
      continue;
    }

    if (s === before) {
      break;
    }
  }

  return s;
}

function tokenIsMeasure(token: string): boolean {
  const t = classifyToken(token);
  if (t.length === 0) {
    return false;
  }
  if (/^[¼½¾⅓⅔⅛⅜⅝⅞]$/.test(t)) {
    return true;
  }
  if (/^[\d¼½¾⅓⅔⅛⅜⅝⅞./+-]+$/.test(t)) {
    return true;
  }
  if (COMMON_UNITS.has(t)) {
    return true;
  }
  return looksLikeGluedMeasureToken(t);
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

  const peeledLine = stripRepeatedLeadingMeasures(stripped);

  const tokens = normalizeWhitespace(peeledLine)
    .split(" ")
    .filter((token) => token.length > 0);

  const meaningful: string[] = [];
  let leadingPassed = false;

  for (const token of tokens) {
    const measure = tokenIsMeasure(token);
    const lc = classifyToken(token);

    if (!leadingPassed && measure) {
      continue;
    }

    leadingPassed = true;

    if (STOP_WORDS.has(lc)) {
      continue;
    }

    if (measure) {
      continue;
    }

    meaningful.push(token);
  }

  let core = normalizeWhitespace(meaningful.join(" "));

  if (core.length === 0) {
    core = normalizeWhitespace(
      peeledLine
        .split(" ")
        .filter(Boolean)
        .filter((tok) => !tokenIsMeasure(tok))
        .filter((tok) => !STOP_WORDS.has(classifyToken(tok)))
        .join(" "),
    );
  }

  return core;
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
  let nameBody = normalizeWhitespace(cleanedName);

  if (!nameBody) {
    const shell = stripRepeatedLeadingMeasures(
      normalizeWhitespace(
        stripTrailingNote(stripParentheticals(trimmed)).toLowerCase(),
      ).replace(/[.;:!?,]+/g, " "),
    );
    nameBody = normalizeWhitespace(
      normalizeWhitespace(shell)
        .split(" ")
        .filter((t) => t.length > 0 && !tokenIsMeasure(t))
        .join(" "),
    );
  }

  const displayName = titleCase(nameBody.trim() ? nameBody : "Item");

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
    const label = groceryItemDisplayName(line);

    return {
      parsed,
      matchedPantryItem: ingredientMatchesPantry(label, pantry),
    };
  });
}

/**
 * Canonical label shown in grocery UI (fixes legacy rows saved with qty/units).
 */
export function groceryItemDisplayName(raw: string): string {
  const t = raw.trim();
  if (!t.length) {
    return "";
  }

  const primary = normalizeWhitespace(parseIngredientLine(t).name);
  if (!/^item$/i.test(primary)) {
    return primary;
  }

  const secondary = normalizeWhitespace(cleanForName(t));
  return secondary.length ? titleCase(secondary) : t;
}

/** Stable key for matching grocery rows and deduping additions. */
export function groceryCompareKey(displayName: string): string {
  const key =
    normalizeWhitespace(groceryItemDisplayName(displayName)).toLowerCase() ||
    displayName.trim().toLowerCase();
  return key;
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
