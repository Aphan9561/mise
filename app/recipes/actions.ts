"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createUserRecipe,
  deleteUserRecipe,
  toggleRecipeStarred,
  updateUserRecipe,
} from "@/lib/supabase/recipes";
import { importRecipeFromUrl } from "@/lib/cooking/import-url";
import { getDiscoveryRecipeDetail } from "@/lib/cooking/themealdb";

export type RecipeActionState = {
  status: "idle" | "success" | "error";
  message: string;
  newRecipeId?: string;
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

  if (message.includes('relation "recipes" does not exist')) {
    return "Create or update the recipes table by running supabase/schema.sql first.";
  }
  if (
    message.toLowerCase().includes("is_starred") ||
    (message.includes("column") && message.includes("does not exist"))
  ) {
    return "Apply the latest recipes table changes (is_starred) from supabase/schema.sql.";
  }

  return message;
}

function themealdbMealUrl(discoveryId: string): string | null {
  if (discoveryId.startsWith("fallback-")) {
    return null;
  }
  return `https://www.themealdb.com/meal.php?i=${encodeURIComponent(discoveryId)}`;
}

export async function addDiscoveryRecipeAction(
  _previousState: RecipeActionState,
  formData: FormData,
): Promise<RecipeActionState> {
  const { userId } = await auth();

  if (!userId) {
    return {
      status: "error",
      message: "You need to be signed in to save recipes.",
    };
  }

  const discoveryId = String(formData.get("discoveryId") ?? "").trim();

  if (!discoveryId) {
    return {
      status: "error",
      message: "Missing recipe.",
    };
  }

  const detail = await getDiscoveryRecipeDetail(discoveryId);

  if (!detail) {
    return {
      status: "error",
      message: "Could not load that recipe. Try again from the discover page.",
    };
  }

  if (detail.ingredients.length === 0 || detail.instructions.length === 0) {
    return {
      status: "error",
      message:
        "This recipe is missing ingredients or steps, so it cannot be saved.",
    };
  }

  const description =
    detail.summary.trim().slice(0, 2000) ||
    `Saved from Discover: ${detail.title}`;

  const notesParts = ["Added from Discover"];
  if (detail.category) {
    notesParts.push(detail.category);
  }

  try {
    const saved = await createUserRecipe({
      clerkUserId: userId,
      title: detail.title,
      description,
      cuisine: detail.cuisine,
      prepMinutes: detail.readyInMinutes,
      ingredients: detail.ingredients,
      instructions: detail.instructions,
      imageUrl: detail.imageUrl?.trim() || null,
      notes: notesParts.join(" · "),
      source: discoveryId.startsWith("fallback-") ? "discover" : "themealdb",
      sourceUrl: detail.sourceUrl?.trim() || themealdbMealUrl(discoveryId),
    });

    revalidatePath("/recipes");
    revalidatePath("/kitchen");
    revalidatePath("/discover");

    return {
      status: "success",
      message: `Saved ${detail.title} to your recipes.`,
      newRecipeId: saved.id,
    };
  } catch (error) {
    return {
      status: "error",
      message: `Could not save recipe: ${formatRecipeError(error)}`,
    };
  }
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
      notes: String(formData.get("notes") ?? "").trim(),
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
      notes: "",
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
      notes: String(formData.get("notes") ?? "").trim(),
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

export async function toggleRecipeStarAction(recipeId: string): Promise<{
  ok: boolean;
  isStarred?: boolean;
  message?: string;
}> {
  const { userId } = await auth();

  if (!userId) {
    return { ok: false, message: "You need to be signed in." };
  }

  const id = recipeId.trim();

  if (!id) {
    return { ok: false, message: "Missing recipe." };
  }

  try {
    const updated = await toggleRecipeStarred(userId, id);
    revalidatePath("/recipes");
    revalidatePath(`/recipes/${id}`);

    return { ok: true, isStarred: updated.is_starred };
  } catch (error) {
    return {
      ok: false,
      message: formatRecipeError(error),
    };
  }
}

export async function deleteRecipeAction(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("You need to be signed in before deleting a recipe.");
  }

  const recipeId = String(formData.get("recipeId") ?? "").trim();

  if (!recipeId) {
    throw new Error("Missing recipe ID.");
  }

  await deleteUserRecipe(userId, recipeId);
  revalidatePath("/recipes");
  redirect("/recipes");
}
