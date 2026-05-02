"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  createGroceryItem,
  createGroceryItemsBulk,
  deleteGroceryItem,
  getGroceryItem,
} from "@/lib/supabase/grocery";
import { getUserRecipe } from "@/lib/supabase/recipes";
import {
  createPantryItem,
  listPantryItems,
} from "@/lib/supabase/pantry";
import {
  ingredientMatchesPantry,
  matchIngredientsAgainstPantry,
  parseIngredientLine,
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

  const cleanedName = parseIngredientLine(rawName).name;

  try {
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

  const pantryResult = await listPantryItems(userId);
  const alreadyInPantry = ingredientMatchesPantry(item.name, pantryResult.items);

  if (!alreadyInPantry) {
    await createPantryItem({
      clerkUserId: userId,
      name: item.name,
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

    const toAdd = matches.filter(
      (match) => !skipPantry || !match.matchedPantryItem,
    );
    const skipped = matches.length - toAdd.length;

    if (toAdd.length === 0) {
      return {
        status: "success",
        message: `Everything for ${recipe.title} is already in your pantry.`,
        added: 0,
        skipped,
      };
    }

    await createGroceryItemsBulk(
      toAdd.map((match) => ({
        clerkUserId: userId,
        name: match.parsed.name || match.parsed.raw,
        notes: match.parsed.raw,
        recipeId: recipe.id,
        recipeTitle: recipe.title,
      })),
    );

    revalidatePath("/grocery");

    return {
      status: "success",
      message:
        skipped > 0
          ? `Added ${toAdd.length} from ${recipe.title}; skipped ${skipped} already in your pantry.`
          : `Added ${toAdd.length} ingredients from ${recipe.title}.`,
      added: toAdd.length,
      skipped,
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
          name: match.parsed.name,
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
