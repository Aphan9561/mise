import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type UserRecipe = {
  id: string;
  clerk_user_id: string;
  title: string;
  description: string | null;
  cuisine: string | null;
  prep_minutes: number | null;
  ingredients: string[];
  instructions: string[];
  image_url: string | null;
  notes: string | null;
  source: string;
  source_url: string | null;
  created_at: string;
  updated_at: string;
};

export type RecipesResult = {
  recipes: UserRecipe[];
  missingTable: boolean;
  errorMessage: string | null;
};

export type CreateRecipeInput = {
  clerkUserId: string;
  title: string;
  description: string;
  cuisine: string;
  prepMinutes: number | null;
  ingredients: string[];
  instructions: string[];
  imageUrl?: string | null;
  notes?: string;
  source?: string;
  sourceUrl?: string | null;
};

export type UpdateRecipeInput = {
  clerkUserId: string;
  recipeId: string;
  title: string;
  description: string;
  cuisine: string;
  prepMinutes: number | null;
  ingredients: string[];
  instructions: string[];
  imageUrl?: string | null;
  notes?: string;
};

function isMissingTableError(message: string) {
  return message.includes('relation "recipes" does not exist');
}

export async function listUserRecipes(
  clerkUserId: string,
): Promise<RecipesResult> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .order("created_at", { ascending: false })
    .returns<UserRecipe[]>();

  if (error) {
    return {
      recipes: [],
      missingTable: isMissingTableError(error.message),
      errorMessage: error.message,
    };
  }

  return {
    recipes: data ?? [],
    missingTable: false,
    errorMessage: null,
  };
}

export async function getUserRecipe(clerkUserId: string, recipeId: string) {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .eq("id", recipeId)
    .maybeSingle<UserRecipe>();

  if (error) {
    throw error;
  }

  return data;
}

export async function createUserRecipe(input: CreateRecipeInput) {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("recipes")
    .insert({
      clerk_user_id: input.clerkUserId,
      title: input.title,
      description: input.description || null,
      cuisine: input.cuisine || null,
      prep_minutes: input.prepMinutes,
      ingredients: input.ingredients,
      instructions: input.instructions,
      image_url: input.imageUrl ?? null,
      notes: input.notes || null,
      source: input.source ?? "personal",
      source_url: input.sourceUrl ?? null,
    })
    .select()
    .single<UserRecipe>();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateUserRecipe(input: UpdateRecipeInput) {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("recipes")
    .update({
      title: input.title,
      description: input.description || null,
      cuisine: input.cuisine || null,
      prep_minutes: input.prepMinutes,
      ingredients: input.ingredients,
      instructions: input.instructions,
      image_url: input.imageUrl ?? null,
      notes: input.notes || null,
    })
    .eq("id", input.recipeId)
    .eq("clerk_user_id", input.clerkUserId)
    .select()
    .single<UserRecipe>();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteUserRecipe(clerkUserId: string, recipeId: string) {
  const supabase = createAdminSupabaseClient();

  const { error } = await supabase
    .from("recipes")
    .delete()
    .eq("id", recipeId)
    .eq("clerk_user_id", clerkUserId);

  if (error) {
    throw error;
  }
}
