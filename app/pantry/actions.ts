"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  createPantryItem,
  deletePantryItem,
  updatePantryItem,
} from "@/lib/supabase/pantry";

export type PantryActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

function readOptional(value: FormDataEntryValue | null): string | null {
  const trimmed = String(value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readDate(value: FormDataEntryValue | null): string | null {
  const raw = readOptional(value);

  if (!raw) {
    return null;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

function formatPantryError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";

  return message.includes('relation "pantry_items" does not exist')
    ? "Run supabase/schema.sql to create the pantry table first."
    : message;
}

export async function createPantryItemAction(
  _previousState: PantryActionState,
  formData: FormData,
): Promise<PantryActionState> {
  const { userId } = await auth();

  if (!userId) {
    return {
      status: "error",
      message: "Sign in to add pantry items.",
    };
  }

  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return {
      status: "error",
      message: "Add a name for the pantry item.",
    };
  }

  try {
    await createPantryItem({
      clerkUserId: userId,
      name,
      quantity: readOptional(formData.get("quantity")),
      unit: readOptional(formData.get("unit")),
      notes: readOptional(formData.get("notes")),
      expiresOn: readDate(formData.get("expiresOn")),
    });

    revalidatePath("/pantry");
    revalidatePath("/grocery");

    return {
      status: "success",
      message: `Added ${name} to your pantry.`,
    };
  } catch (error) {
    return {
      status: "error",
      message: `Could not add item: ${formatPantryError(error)}`,
    };
  }
}

export async function updatePantryItemAction(
  _previousState: PantryActionState,
  formData: FormData,
): Promise<PantryActionState> {
  const { userId } = await auth();

  if (!userId) {
    return {
      status: "error",
      message: "Sign in to edit pantry items.",
    };
  }

  const itemId = String(formData.get("itemId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  if (!itemId || !name) {
    return {
      status: "error",
      message: "Missing item ID or name.",
    };
  }

  try {
    await updatePantryItem({
      clerkUserId: userId,
      itemId,
      name,
      quantity: readOptional(formData.get("quantity")),
      unit: readOptional(formData.get("unit")),
      notes: readOptional(formData.get("notes")),
      expiresOn: readDate(formData.get("expiresOn")),
    });

    revalidatePath("/pantry");

    return {
      status: "success",
      message: "Pantry item updated.",
    };
  } catch (error) {
    return {
      status: "error",
      message: `Could not update item: ${formatPantryError(error)}`,
    };
  }
}

export async function deletePantryItemAction(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Sign in to delete pantry items.");
  }

  const itemId = String(formData.get("itemId") ?? "").trim();

  if (!itemId) {
    throw new Error("Missing item ID.");
  }

  await deletePantryItem(userId, itemId);
  revalidatePath("/pantry");
}
