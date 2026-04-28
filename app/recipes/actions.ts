"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createUserRecipe, updateUserRecipe } from "@/lib/supabase/recipes";
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

function readOptionalUrl(value: FormDataEntryValue | null) {
  const rawValue = String(value ?? "").trim();

  if (!rawValue) {
    return null;
  }

  try {
    const url = new URL(rawValue);

    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
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
      imageUrl: readOptionalUrl(formData.get("imageUrl")),
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
      imageUrl: recipe.imageUrl,
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

export async function updateRecipeAction(
  _previousState: RecipeActionState,
  formData: FormData,
): Promise<RecipeActionState> {
  const { userId } = await auth();

  if (!userId) {
    return {
      status: "error",
      message: "You need to be signed in before editing a recipe.",
    };
  }

  const recipeId = String(formData.get("recipeId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const ingredients = splitLines(formData.get("ingredients"));
  const instructions = splitLines(formData.get("instructions"));

  if (!recipeId || !title || ingredients.length === 0 || instructions.length === 0) {
    return {
      status: "error",
      message: "Keep a title, at least one ingredient, and at least one step.",
    };
  }

  try {
    await updateUserRecipe({
      clerkUserId: userId,
      recipeId,
      title,
      description: String(formData.get("description") ?? "").trim(),
      cuisine: String(formData.get("cuisine") ?? "").trim(),
      prepMinutes: readPrepMinutes(formData.get("prepMinutes")),
      ingredients,
      instructions,
      imageUrl: readOptionalUrl(formData.get("imageUrl")),
    });

    revalidatePath("/recipes");
    revalidatePath(`/recipes/${recipeId}`);

    return {
      status: "success",
      message: "Recipe updated.",
    };
  } catch (error) {
    return {
      status: "error",
      message: `Could not update recipe: ${formatRecipeError(error)}`,
    };
  }
}
