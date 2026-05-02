import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type GroceryItem = {
  id: string;
  clerk_user_id: string;
  name: string;
  quantity: string | null;
  unit: string | null;
  notes: string | null;
  is_checked: boolean;
  recipe_id: string | null;
  recipe_title: string | null;
  created_at: string;
  updated_at: string;
};

export type GroceryResult = {
  items: GroceryItem[];
  missingTable: boolean;
  errorMessage: string | null;
};

export type CreateGroceryItemInput = {
  clerkUserId: string;
  name: string;
  quantity?: string | null;
  unit?: string | null;
  notes?: string | null;
  recipeId?: string | null;
  recipeTitle?: string | null;
};

function isMissingTableError(message: string) {
  return message.includes('relation "grocery_items" does not exist');
}

export async function getGroceryItem(
  clerkUserId: string,
  itemId: string,
): Promise<GroceryItem | null> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("grocery_items")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .eq("id", itemId)
    .maybeSingle<GroceryItem>();

  if (error) {
    throw error;
  }

  return data;
}

export async function listGroceryItems(
  clerkUserId: string,
): Promise<GroceryResult> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("grocery_items")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .order("is_checked", { ascending: true })
    .order("created_at", { ascending: false })
    .returns<GroceryItem[]>();

  if (error) {
    return {
      items: [],
      missingTable: isMissingTableError(error.message),
      errorMessage: error.message,
    };
  }

  return {
    items: data ?? [],
    missingTable: false,
    errorMessage: null,
  };
}

export async function createGroceryItem(input: CreateGroceryItemInput) {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("grocery_items")
    .insert({
      clerk_user_id: input.clerkUserId,
      name: input.name,
      quantity: input.quantity ?? null,
      unit: input.unit ?? null,
      notes: input.notes ?? null,
      recipe_id: input.recipeId ?? null,
      recipe_title: input.recipeTitle ?? null,
    })
    .select()
    .single<GroceryItem>();

  if (error) {
    throw error;
  }

  return data;
}

export async function createGroceryItemsBulk(
  inputs: CreateGroceryItemInput[],
) {
  if (inputs.length === 0) {
    return [] as GroceryItem[];
  }

  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("grocery_items")
    .insert(
      inputs.map((input) => ({
        clerk_user_id: input.clerkUserId,
        name: input.name,
        quantity: input.quantity ?? null,
        unit: input.unit ?? null,
        notes: input.notes ?? null,
        recipe_id: input.recipeId ?? null,
        recipe_title: input.recipeTitle ?? null,
      })),
    )
    .select()
    .returns<GroceryItem[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function setGroceryItemChecked(
  clerkUserId: string,
  itemId: string,
  isChecked: boolean,
) {
  const supabase = createAdminSupabaseClient();

  const { error } = await supabase
    .from("grocery_items")
    .update({ is_checked: isChecked })
    .eq("id", itemId)
    .eq("clerk_user_id", clerkUserId);

  if (error) {
    throw error;
  }
}

export async function deleteGroceryItem(clerkUserId: string, itemId: string) {
  const supabase = createAdminSupabaseClient();

  const { error } = await supabase
    .from("grocery_items")
    .delete()
    .eq("id", itemId)
    .eq("clerk_user_id", clerkUserId);

  if (error) {
    throw error;
  }
}

export async function deleteCheckedGroceryItems(clerkUserId: string) {
  const supabase = createAdminSupabaseClient();

  const { error } = await supabase
    .from("grocery_items")
    .delete()
    .eq("clerk_user_id", clerkUserId)
    .eq("is_checked", true);

  if (error) {
    throw error;
  }
}
