"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  Boxes,
  Loader2,
  Plus,
  ShoppingBasket,
  Trash2,
  Utensils,
} from "lucide-react";
import {
  checkOffGroceryItemAction,
  createGroceryItemAction,
  deleteGroceryItemAction,
  type GroceryActionState,
} from "@/app/grocery/actions";
import type { GroceryItem } from "@/lib/supabase/grocery";

type Props = {
  items: GroceryItem[];
  primaryEmail: string | null;
  missingTable: boolean;
  errorMessage: string | null;
};

const initialState: GroceryActionState = {
  status: "idle",
  message: "",
};

function ActionMessage({ state }: { state: GroceryActionState }) {
  if (!state.message) {
    return null;
  }

  return (
    <p
      className={`rounded-xl px-3 py-2 text-sm ${
        state.status === "success"
          ? "bg-mise-success-bg text-mise-success-text"
          : "bg-mise-danger-bg text-mise-danger"
      }`}
    >
      {state.message}
    </p>
  );
}

export function GroceryPageClient({
  items,
  primaryEmail,
  missingTable,
  errorMessage,
}: Props) {
  const router = useRouter();
  const [createState, createAction, isCreating] = useActionState(
    createGroceryItemAction,
    initialState,
  );

  useEffect(() => {
    if (createState.status === "success") {
      router.refresh();
    }
  }, [createState.status, router]);

  return (
    <main className="min-h-screen bg-mise-page text-mise-ink">
      <header className="mise-header">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <Link href="/recipes" className="flex min-w-0 items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-mise-forest text-white shadow-sm">
              <Utensils size={20} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-serif text-xl text-mise-ink sm:text-2xl">
                Grocery list
              </h1>
              <p className="truncate text-xs text-mise-muted sm:text-sm">
                {primaryEmail ?? "Signed in"}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/recipes"
              className="mise-btn-secondary rounded-full py-2 pl-3 pr-4 text-sm"
            >
              Cookbook
            </Link>
            <Link
              href="/pantry"
              className="mise-btn-secondary rounded-full py-2 pl-3 pr-4 text-sm"
            >
              <Boxes size={16} aria-hidden="true" />
              Pantry
            </Link>
            <UserButton />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-10 lg:px-8">
        <aside className="space-y-6">
          {missingTable || errorMessage ? (
            <section className="rounded-2xl border border-mise-warm/25 bg-mise-warn-bg p-4 text-sm text-mise-warn-text">
              {missingTable
                ? "Run supabase/schema.sql to create the grocery_items table."
                : errorMessage}
            </section>
          ) : null}

          <section className="mise-card overflow-hidden rounded-2xl">
            <div className="flex items-center gap-2 border-b border-mise-border px-5 py-4">
              <Plus size={17} className="text-mise-warm" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-mise-ink">
                Add an item
              </h2>
            </div>
            <form action={createAction} className="space-y-4 p-5">
              <label className="mise-label">
                Item
                <input
                  name="name"
                  required
                  className="mise-input"
                  placeholder="Lemons"
                />
              </label>
              <button
                type="submit"
                disabled={isCreating || missingTable}
                className="mise-btn-warm w-full"
              >
                {isCreating ? (
                  <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                ) : (
                  <Plus size={16} aria-hidden="true" />
                )}
                Add to list
              </button>
              <ActionMessage state={createState} />
            </form>
          </section>

          <section className="mise-card overflow-hidden rounded-2xl p-5">
            <p className="text-sm text-mise-muted">
              Check an item off and it moves into your{" "}
              <Link
                href="/pantry"
                className="font-semibold text-mise-ink underline underline-offset-2"
              >
                pantry
              </Link>
              . Open a recipe and tap{" "}
              <span className="font-semibold text-mise-ink">
                Add to grocery list
              </span>{" "}
              to auto-fill (we&apos;ll skip anything already in the pantry).
            </p>
          </section>
        </aside>

        <section className="mise-card min-h-[min(70vh,560px)] overflow-hidden rounded-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mise-border px-6 py-5">
            <div className="flex items-center gap-2">
              <ShoppingBasket
                size={18}
                className="text-mise-accent"
                aria-hidden="true"
              />
              <h2 className="font-serif text-lg text-mise-ink">
                Shopping ({items.length})
              </h2>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="grid min-h-[400px] place-items-center p-10 text-center">
              <div className="max-w-sm">
                <ShoppingBasket
                  className="mx-auto text-mise-muted/50"
                  size={40}
                  aria-hidden="true"
                />
                <h3 className="mt-5 font-serif text-2xl text-mise-ink">
                  Your list is empty
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-mise-muted">
                  Add items above, or open a recipe and add its ingredients in
                  one tap.
                </p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-mise-border">
              {items.map((item) => (
                <GroceryRow key={item.id} item={item} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function GroceryRow({ item }: { item: GroceryItem }) {
  return (
    <li className="flex items-start justify-between gap-4 px-6 py-3">
      <form action={checkOffGroceryItemAction} className="flex flex-1 items-start gap-3">
        <input name="itemId" type="hidden" value={item.id} />
        <button
          type="submit"
          className="mt-0.5 grid size-11 min-h-11 min-w-11 shrink-0 place-items-center rounded-md border border-mise-border bg-mise-surface transition hover:border-mise-accent hover:bg-mise-chip"
          aria-label={`Got ${item.name} — move to pantry`}
          title="Got it — move to pantry"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-mise-ink">
            {item.name}
          </p>
          {item.recipe_title ? (
            <p className="mt-0.5 text-xs text-mise-muted">
              from {item.recipe_title}
            </p>
          ) : null}
        </div>
      </form>
      <form action={deleteGroceryItemAction}>
        <input name="itemId" type="hidden" value={item.id} />
        <button
          type="submit"
          className="mise-btn-ghost text-xs text-mise-danger hover:text-mise-danger"
          aria-label="Delete item"
        >
          <Trash2 size={14} aria-hidden="true" />
        </button>
      </form>
    </li>
  );
}
