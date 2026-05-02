import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type PantryItem = {
  id: string;
  clerk_user_id: string;
  name: string;
  quantity: string | null;
  unit: string | null;
  notes: string | null;
  expires_on: string | null;
  created_at: string;
  updated_at: string;
};

export type PantryResult = {
  items: PantryItem[];
  missingTable: boolean;
  errorMessage: string | null;
};

export type CreatePantryItemInput = {
  clerkUserId: string;
  name: string;
  quantity?: string | null;
  unit?: string | null;
  notes?: string | null;
  expiresOn?: string | null;
};

export type UpdatePantryItemInput = CreatePantryItemInput & {
  itemId: string;
};

function isMissingTableError(message: string) {
  return message.includes('relation "pantry_items" does not exist');
}

export async function listPantryItems(
  clerkUserId: string,
): Promise<PantryResult> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("pantry_items")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .order("name", { ascending: true })
    .returns<PantryItem[]>();

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

export async function createPantryItem(input: CreatePantryItemInput) {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("pantry_items")
    .insert({
      clerk_user_id: input.clerkUserId,
      name: input.name,
      quantity: input.quantity ?? null,
      unit: input.unit ?? null,
      notes: input.notes ?? null,
      expires_on: input.expiresOn ?? null,
    })
    .select()
    .single<PantryItem>();

  if (error) {
    throw error;
  }

  return data;
}

export async function updatePantryItem(input: UpdatePantryItemInput) {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("pantry_items")
    .update({
      name: input.name,
      quantity: input.quantity ?? null,
      unit: input.unit ?? null,
      notes: input.notes ?? null,
      expires_on: input.expiresOn ?? null,
    })
    .eq("id", input.itemId)
    .eq("clerk_user_id", input.clerkUserId)
    .select()
    .single<PantryItem>();

  if (error) {
    throw error;
  }

  return data;
}

export async function deletePantryItem(clerkUserId: string, itemId: string) {
  const supabase = createAdminSupabaseClient();

  const { error } = await supabase
    .from("pantry_items")
    .delete()
    .eq("id", itemId)
    .eq("clerk_user_id", clerkUserId);

  if (error) {
    throw error;
  }
}
