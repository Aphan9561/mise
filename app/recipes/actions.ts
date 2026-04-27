"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createUserRecipe } from "@/lib/supabase/recipes";
import { importRecipeFromUrl } from "@/lib/cooking/import-url";

export type RecipeActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

function splitLines(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function readPrepMinutes(value: FormDataEntryValue | null) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function formatRecipeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";

  return message.includes('relation "recipes" does not exist')
    ? "Create or update the recipes table by running supabase/schema.sql first."
    : message;
}

export async function createRecipeAction(
  _previousState: RecipeActionState,
  formData: FormData,
): Promise<RecipeActionState> {
  const { userId } = await auth();

  if (!userId) {
    return {
      status: "error",
      message: "You need to be signed in before adding a recipe.",
    };
  }

  const title = String(formData.get("title") ?? "").trim();
  const ingredients = splitLines(formData.get("ingredients"));
  const instructions = splitLines(formData.get("instructions"));

  if (!title || ingredients.length === 0 || instructions.length === 0) {
    return {
      status: "error",
      message: "Add a title, at least one ingredient, and at least one step.",
    };
  }

  try {
    await createUserRecipe({
      clerkUserId: userId,
      title,
      description: String(formData.get("description") ?? "").trim(),
      cuisine: String(formData.get("cuisine") ?? "").trim(),
      prepMinutes: readPrepMinutes(formData.get("prepMinutes")),
      ingredients,
      instructions,
      source: String(formData.get("source") ?? "personal"),
      sourceUrl: String(formData.get("sourceUrl") ?? "").trim() || null,
    });

    revalidatePath("/recipes");
    revalidatePath("/kitchen");

    return {
      status: "success",
      message: "Recipe added to your kitchen.",
    };
  } catch (error) {
    return {
      status: "error",
      message: `Could not add recipe: ${formatRecipeError(error)}`,
    };
  }
}

export async function importRecipeFromUrlAction(
  _previousState: RecipeActionState,
  formData: FormData,
): Promise<RecipeActionState> {
  const { userId } = await auth();

  if (!userId) {
    return {
      status: "error",
      message: "You need to be signed in before importing a recipe.",
    };
  }

  const url = String(formData.get("recipeUrl") ?? "").trim();

  if (!url) {
    return {
      status: "error",
      message: "Paste a recipe URL first.",
    };
  }

  try {
    const recipe = await importRecipeFromUrl(url);

    await createUserRecipe({
      clerkUserId: userId,
      title: recipe.title,
      description: recipe.description,
      cuisine: recipe.cuisine,
      prepMinutes: recipe.prepMinutes,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      source: "url",
      sourceUrl: recipe.sourceUrl,
    });

    revalidatePath("/recipes");
    revalidatePath("/kitchen");

    return {
      status: "success",
      message: `Imported ${recipe.title}.`,
    };
  } catch (error) {
    return {
      status: "error",
      message: `Could not import recipe: ${formatRecipeError(error)}`,
    };
  }
}
