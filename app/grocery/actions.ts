"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  createGroceryItem,
  createGroceryItemsBulk,
  deleteGroceryItem,
  getGroceryItem,
  listGroceryItems,
  setGroceryItemChecked,
  type GroceryItem,
} from "@/lib/supabase/grocery";
import { getUserRecipe } from "@/lib/supabase/recipes";
import {
  createPantryItem,
  listPantryItems,
} from "@/lib/supabase/pantry";
import {
  groceryCompareKey,
  groceryItemDisplayName,
  ingredientMatchesPantry,
  matchIngredientsAgainstPantry,
} from "@/lib/cooking/pantry-match";

export type GroceryActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

function formatGroceryError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";

  if (message.includes('relation "grocery_items" does not exist')) {
    return "Run supabase/schema.sql to create the grocery_items table first.";
  }
  if (message.includes('relation "pantry_items" does not exist')) {
    return "Run supabase/schema.sql to create the pantry_items table first.";
  }
  return message;
}

function findGroceryRowByKey(items: GroceryItem[], key: string) {
  return items.find((row) => groceryCompareKey(row.name) === key);
}

export async function createGroceryItemAction(
  _previousState: GroceryActionState,
  formData: FormData,
): Promise<GroceryActionState> {
  const { userId } = await auth();

  if (!userId) {
    return {
      status: "error",
      message: "Sign in to update your grocery list.",
    };
  }

  const rawName = String(formData.get("name") ?? "").trim();

  if (!rawName) {
    return {
      status: "error",
      message: "Add a name for the grocery item.",
    };
  }

  const cleanedName = groceryItemDisplayName(rawName);

  try {
    const existing = await listGroceryItems(userId);
    const key = groceryCompareKey(cleanedName);
    const duplicate = findGroceryRowByKey(existing.items, key);

    if (duplicate) {
      await setGroceryItemChecked(userId, duplicate.id, false);
      revalidatePath("/grocery");
      const state =
        duplicate.is_checked === true ? "Unchecked it so it shows again." : "Already there — left unchecked.";
      return {
        status: "success",
        message: `${cleanedName} is already on your list. ${state}`,
      };
    }

    await createGroceryItem({
      clerkUserId: userId,
      name: cleanedName,
    });

    revalidatePath("/grocery");

    return {
      status: "success",
      message: `Added ${cleanedName} to your grocery list.`,
    };
  } catch (error) {
    return {
      status: "error",
      message: `Could not add item: ${formatGroceryError(error)}`,
    };
  }
}

export async function toggleGroceryItemCheckedAction(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Sign in to update your grocery list.");
  }

  const itemId = String(formData.get("itemId") ?? "").trim();

  if (!itemId) {
    throw new Error("Missing item ID.");
  }

  const item = await getGroceryItem(userId, itemId);

  if (!item) {
    return;
  }

  await setGroceryItemChecked(userId, itemId, !item.is_checked);
  revalidatePath("/grocery");
}

export async function checkOffGroceryItemAction(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Sign in to update your grocery list.");
  }

  const itemId = String(formData.get("itemId") ?? "").trim();

  if (!itemId) {
    throw new Error("Missing item ID.");
  }

  const item = await getGroceryItem(userId, itemId);

  if (!item) {
    return;
  }

  const displayName = groceryItemDisplayName(item.name);
  const pantryResult = await listPantryItems(userId);
  const alreadyInPantry = ingredientMatchesPantry(
    displayName,
    pantryResult.items,
  );

  if (!alreadyInPantry) {
    await createPantryItem({
      clerkUserId: userId,
      name: displayName,
    });
  }

  await deleteGroceryItem(userId, itemId);

  revalidatePath("/grocery");
  revalidatePath("/pantry");
}

export async function deleteGroceryItemAction(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Sign in to update your grocery list.");
  }

  const itemId = String(formData.get("itemId") ?? "").trim();

  if (!itemId) {
    throw new Error("Missing item ID.");
  }

  await deleteGroceryItem(userId, itemId);
  revalidatePath("/grocery");
}

export type AddRecipeToGroceryState = {
  status: "idle" | "success" | "error";
  message: string;
  added: number;
  skipped: number;
};

const initialAddRecipeState: AddRecipeToGroceryState = {
  status: "idle",
  message: "",
  added: 0,
  skipped: 0,
};

export async function addRecipeToGroceryAction(
  _previousState: AddRecipeToGroceryState,
  formData: FormData,
): Promise<AddRecipeToGroceryState> {
  const { userId } = await auth();

  if (!userId) {
    return {
      ...initialAddRecipeState,
      status: "error",
      message: "Sign in to add recipe ingredients to your grocery list.",
    };
  }

  const recipeId = String(formData.get("recipeId") ?? "").trim();
  const skipPantry = formData.get("skipPantry") !== "false";

  if (!recipeId) {
    return {
      ...initialAddRecipeState,
      status: "error",
      message: "Missing recipe.",
    };
  }

  try {
    const recipe = await getUserRecipe(userId, recipeId);

    if (!recipe) {
      return {
        ...initialAddRecipeState,
        status: "error",
        message: "Could not load that recipe.",
      };
    }

    const pantryResult = await listPantryItems(userId);
    const pantry = pantryResult.items;
    const matches = matchIngredientsAgainstPantry(recipe.ingredients, pantry);

    const toConsider = matches.filter(
      (match) => !skipPantry || !match.matchedPantryItem,
    );
    const pantrySkipped = matches.length - toConsider.length;

    const groceries = await listGroceryItems(userId);

    /** One pass per canonical item (dedupe within this recipe payload). */
    const handledKeys = new Set<string>();
    const bulkRows: {
      clerkUserId: string;
      name: string;
      notes: string;
      recipeId: string;
      recipeTitle: string;
    }[] = [];

    let reopenedOnList = 0;
    let duplicateRecipeLines = 0;

    for (const match of toConsider) {
      const canonicalName = groceryItemDisplayName(match.parsed.raw);
      const key = groceryCompareKey(canonicalName);

      if (handledKeys.has(key)) {
        duplicateRecipeLines += 1;
        continue;
      }

      handledKeys.add(key);

      const existingRow = findGroceryRowByKey(groceries.items, key);
      if (existingRow) {
        reopenedOnList += 1;
        await setGroceryItemChecked(userId, existingRow.id, false);
        continue;
      }

      bulkRows.push({
        clerkUserId: userId,
        name: canonicalName,
        notes: match.parsed.raw,
        recipeId: recipe.id,
        recipeTitle: recipe.title,
      });
    }

    const added = bulkRows.length;
    const skippedTotal = pantrySkipped + duplicateRecipeLines;

    if (bulkRows.length > 0) {
      await createGroceryItemsBulk(bulkRows);
    }

    revalidatePath("/grocery");

    if (bulkRows.length === 0 && reopenedOnList === 0) {
      let message: string;
      if (pantrySkipped >= matches.length && matches.length > 0) {
        message = `Everything for ${recipe.title} is already in your pantry.`;
      } else {
        message = `Nothing new to add for ${recipe.title}.`;
      }

      return {
        status: "success",
        message,
        added: 0,
        skipped: skippedTotal,
      };
    }

    const dupPart =
      reopenedOnList > 0
        ? `${reopenedOnList} already on list — left unchecked`
        : "";
    const panPart =
      pantrySkipped > 0 ? `${pantrySkipped} already in pantry` : "";
    const extras = [panPart, dupPart].filter(Boolean).join("; ");

    if (bulkRows.length === 0 && reopenedOnList > 0) {
      const msg =
        reopenedOnList === 1
          ? "Already on your list — left that item unchecked."
          : `${reopenedOnList} ingredients were already on your list — left them unchecked.`;

      return {
        status: "success",
        message: msg,
        added: 0,
        skipped: skippedTotal,
      };
    }

    const base =
      bulkRows.length === 1
        ? `Added 1 ingredient from ${recipe.title}.`
        : `Added ${bulkRows.length} ingredients from ${recipe.title}.`;

    return {
      status: "success",
      message: extras.length > 0 ? `${base} (${extras})` : base,
      added,
      skipped: skippedTotal,
    };
  } catch (error) {
    return {
      ...initialAddRecipeState,
      status: "error",
      message: `Could not build grocery list: ${formatGroceryError(error)}`,
    };
  }
}

export async function previewRecipeForGroceryAction(
  recipeId: string,
): Promise<{
  ok: boolean;
  message?: string;
  preview?: {
    recipeTitle: string;
    matches: {
      raw: string;
      name: string;
      pantryMatch: string | null;
    }[];
  };
}> {
  const { userId } = await auth();

  if (!userId) {
    return { ok: false, message: "Sign in first." };
  }

  if (!recipeId) {
    return { ok: false, message: "Missing recipe." };
  }

  try {
    const recipe = await getUserRecipe(userId, recipeId);

    if (!recipe) {
      return { ok: false, message: "Recipe not found." };
    }

    const pantryResult = await listPantryItems(userId);
    const matches = matchIngredientsAgainstPantry(
      recipe.ingredients,
      pantryResult.items,
    );

    return {
      ok: true,
      preview: {
        recipeTitle: recipe.title,
        matches: matches.map((match) => ({
          raw: match.parsed.raw,
          name: groceryItemDisplayName(match.parsed.raw),
          pantryMatch: match.matchedPantryItem?.name ?? null,
        })),
      },
    };
  } catch (error) {
    return {
      ok: false,
      message: formatGroceryError(error),
    };
  }
}
