"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  Boxes,
  Loader2,
  Pencil,
  Plus,
  ShoppingBasket,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import {
  createPantryItemAction,
  deletePantryItemAction,
  updatePantryItemAction,
  type PantryActionState,
} from "@/app/pantry/actions";
import type { PantryItem } from "@/lib/supabase/pantry";

type Props = {
  items: PantryItem[];
  primaryEmail: string | null;
  missingTable: boolean;
  errorMessage: string | null;
};

const UNIT_SUGGESTIONS = [
  "whole",
  "tsp",
  "tbsp",
  "cup",
  "cups",
  "oz",
  "lb",
  "lbs",
  "g",
  "kg",
  "ml",
  "l",
  "pinch",
  "dash",
  "clove",
  "cloves",
  "slice",
  "slices",
  "can",
  "cans",
  "jar",
  "jars",
  "bottle",
  "bottles",
  "package",
  "packages",
  "stick",
  "sticks",
  "head",
  "heads",
  "bunch",
  "bunches",
];

const initialState: PantryActionState = {
  status: "idle",
  message: "",
};

function ActionMessage({ state }: { state: PantryActionState }) {
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

export function PantryPageClient({
  items,
  primaryEmail,
  missingTable,
  errorMessage,
}: Props) {
  const router = useRouter();
  const [createState, createAction, isCreating] = useActionState(
    createPantryItemAction,
    initialState,
  );
  const [updateState, updateAction, isUpdating] = useActionState(
    updatePantryItemAction,
    initialState,
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [lastUpdateStatus, setLastUpdateStatus] = useState(updateState.status);

  if (updateState.status !== lastUpdateStatus) {
    setLastUpdateStatus(updateState.status);
    if (updateState.status === "success") {
      setEditingId(null);
    }
  }

  useEffect(() => {
    if (createState.status === "success" || updateState.status === "success") {
      router.refresh();
    }
  }, [createState.status, updateState.status, router]);

  return (
    <main className="min-h-screen bg-mise-page text-mise-ink">
      <datalist id="pantry-unit-suggestions">
        {UNIT_SUGGESTIONS.map((unit) => (
          <option key={unit} value={unit} />
        ))}
      </datalist>
      <header className="mise-header">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <Link href="/recipes" className="flex min-w-0 items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-mise-forest text-white shadow-sm">
              <Utensils size={20} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-serif text-xl text-mise-ink sm:text-2xl">
                Pantry
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
              href="/grocery"
              className="mise-btn-secondary rounded-full py-2 pl-3 pr-4 text-sm"
            >
              <ShoppingBasket size={16} aria-hidden="true" />
              Grocery
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
                ? "Run supabase/schema.sql to create the pantry_items table."
                : errorMessage}
            </section>
          ) : null}

          <section className="mise-card overflow-hidden rounded-2xl">
            <div className="flex items-center gap-2 border-b border-mise-border px-5 py-4">
              <Plus size={17} className="text-mise-warm" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-mise-ink">
                Add to pantry
              </h2>
            </div>
            <form action={createAction} className="space-y-4 p-5">
              <label className="mise-label">
                Item name
                <input
                  name="name"
                  required
                  className="mise-input"
                  placeholder="Olive oil"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="mise-label">
                  Quantity
                  <input
                    name="quantity"
                    className="mise-input"
                    placeholder="2"
                  />
                </label>
                <label className="mise-label">
                  Unit
                  <input
                    name="unit"
                    list="pantry-unit-suggestions"
                    className="mise-input"
                    placeholder="bottles"
                    autoComplete="off"
                  />
                </label>
              </div>
              <label className="mise-label">
                Expires on
                <input
                  name="expiresOn"
                  type="date"
                  className="mise-input"
                />
              </label>
              <label className="mise-label">
                Notes
                <textarea
                  name="notes"
                  className="mise-textarea h-20"
                  placeholder="Brand, location, anything useful"
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
                Add item
              </button>
              <ActionMessage state={createState} />
            </form>
          </section>
        </aside>

        <section className="mise-card min-h-[min(70vh,560px)] overflow-hidden rounded-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mise-border px-6 py-5">
            <div className="flex items-center gap-2">
              <Boxes size={18} className="text-mise-accent" aria-hidden="true" />
              <h2 className="font-serif text-lg text-mise-ink">
                What you have ({items.length})
              </h2>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="grid min-h-[400px] place-items-center p-10 text-center">
              <div className="max-w-sm">
                <Boxes
                  className="mx-auto text-mise-muted/50"
                  size={40}
                  aria-hidden="true"
                />
                <h3 className="mt-5 font-serif text-2xl text-mise-ink">
                  Your pantry is empty
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-mise-muted">
                  Add the staples you keep around. The grocery list will skip
                  anything that&apos;s already here.
                </p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-mise-border">
              {items.map((item) => (
                <li key={item.id} className="px-6 py-4">
                  {editingId === item.id ? (
                    <form action={updateAction} className="space-y-3">
                      <input name="itemId" type="hidden" value={item.id} />
                      <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
                        <label className="mise-label">
                          Name
                          <input
                            name="name"
                            required
                            defaultValue={item.name}
                            className="mise-input"
                          />
                        </label>
                        <label className="mise-label">
                          Quantity
                          <input
                            name="quantity"
                            defaultValue={item.quantity ?? ""}
                            className="mise-input"
                          />
                        </label>
                        <label className="mise-label">
                          Unit
                          <input
                            name="unit"
                            list="pantry-unit-suggestions"
                            defaultValue={item.unit ?? ""}
                            className="mise-input"
                            autoComplete="off"
                          />
                        </label>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="mise-label">
                          Expires on
                          <input
                            name="expiresOn"
                            type="date"
                            defaultValue={item.expires_on ?? ""}
                            className="mise-input"
                          />
                        </label>
                        <label className="mise-label">
                          Notes
                          <input
                            name="notes"
                            defaultValue={item.notes ?? ""}
                            className="mise-input"
                          />
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          disabled={isUpdating}
                          className="mise-btn-primary"
                        >
                          {isUpdating ? (
                            <Loader2
                              className="animate-spin"
                              size={16}
                              aria-hidden="true"
                            />
                          ) : null}
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="mise-btn-ghost"
                        >
                          <X size={16} aria-hidden="true" />
                          Cancel
                        </button>
                      </div>
                      <ActionMessage state={updateState} />
                    </form>
                  ) : (
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-mise-ink">{item.name}</p>
                        <p className="mt-1 text-sm text-mise-muted">
                          {[item.quantity, item.unit]
                            .filter(Boolean)
                            .join(" ") || "no quantity set"}
                          {item.expires_on
                            ? ` · expires ${item.expires_on}`
                            : ""}
                        </p>
                        {item.notes ? (
                          <p className="mt-1 text-xs text-mise-muted">
                            {item.notes}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(item.id)}
                          className="mise-btn-ghost text-xs"
                        >
                          <Pencil size={14} aria-hidden="true" />
                          Edit
                        </button>
                        <form action={deletePantryItemAction}>
                          <input
                            name="itemId"
                            type="hidden"
                            value={item.id}
                          />
                          <button
                            type="submit"
                            className="mise-btn-ghost text-xs text-mise-danger hover:text-mise-danger"
                            title="Remove from pantry"
                          >
                            <Trash2 size={14} aria-hidden="true" />
                            Remove
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
