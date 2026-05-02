"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Boxes, Check, Loader2, ShoppingBasket } from "lucide-react";
import {
  addRecipeToGroceryAction,
  previewRecipeForGroceryAction,
  type AddRecipeToGroceryState,
} from "@/app/grocery/actions";

type Props = {
  recipeId: string;
};

type Preview = {
  recipeTitle: string;
  matches: {
    raw: string;
    name: string;
    pantryMatch: string | null;
  }[];
};

const initialState: AddRecipeToGroceryState = {
  status: "idle",
  message: "",
  added: 0,
  skipped: 0,
};

export function AddToGrocery({ recipeId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [skipPantry, setSkipPantry] = useState(true);

  const [state, action, isPending] = useActionState(
    addRecipeToGroceryAction,
    initialState,
  );

  async function openModal() {
    setIsOpen(true);

    if (preview || isLoadingPreview) {
      return;
    }

    setIsLoadingPreview(true);
    setPreviewError(null);

    try {
      const result = await previewRecipeForGroceryAction(recipeId);

      if (result.ok && result.preview) {
        setPreview(result.preview);
      } else {
        setPreviewError(result.message ?? "Could not preview ingredients.");
      }
    } catch {
      setPreviewError("Could not preview ingredients.");
    } finally {
      setIsLoadingPreview(false);
    }
  }

  const matched = preview?.matches.filter((m) => m.pantryMatch).length ?? 0;
  const willAdd = preview
    ? skipPantry
      ? preview.matches.length - matched
      : preview.matches.length
    : 0;

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="mise-btn-secondary rounded-xl py-2 pl-3 pr-3 text-xs sm:text-sm"
      >
        <ShoppingBasket size={16} aria-hidden="true" />
        Add to grocery list
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-40 grid place-items-center bg-mise-ink/40 px-4 py-8"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="mise-card max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-mise-border px-5 py-4">
              <div className="flex items-center gap-2">
                <ShoppingBasket
                  size={17}
                  className="text-mise-accent"
                  aria-hidden="true"
                />
                <h2 className="font-semibold text-mise-ink">
                  Add to grocery list
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="mise-btn-ghost text-xs"
              >
                Close
              </button>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-5">
              {isLoadingPreview ? (
                <p className="inline-flex items-center gap-2 text-sm text-mise-muted">
                  <Loader2
                    className="animate-spin"
                    size={14}
                    aria-hidden="true"
                  />
                  Checking your pantry…
                </p>
              ) : previewError ? (
                <p className="rounded-xl bg-mise-danger-bg px-3 py-2 text-sm text-mise-danger">
                  {previewError}
                </p>
              ) : preview ? (
                <>
                  <p className="text-sm text-mise-muted">
                    {matched > 0 ? (
                      <>
                        <span className="font-semibold text-mise-ink">
                          {matched}
                        </span>{" "}
                        of {preview.matches.length} ingredients are already in
                        your pantry.
                      </>
                    ) : (
                      <>
                        Nothing here matches your pantry yet — add staples on
                        the{" "}
                        <Link
                          href="/pantry"
                          className="underline underline-offset-2 hover:text-mise-ink"
                        >
                          pantry page
                        </Link>{" "}
                        to make this smarter.
                      </>
                    )}
                  </p>

                  <ul className="mt-4 space-y-2">
                    {preview.matches.map((match, index) => {
                      const inPantry = Boolean(match.pantryMatch);
                      const isSkipped = inPantry && skipPantry;

                      return (
                        <li
                          key={`${match.raw}-${index}`}
                          className={`flex items-start gap-3 rounded-xl border px-3 py-2 text-sm ${
                            isSkipped
                              ? "border-mise-border/60 bg-mise-surface-soft text-mise-muted"
                              : "border-mise-border bg-mise-surface text-mise-ink"
                          }`}
                        >
                          <span
                            className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md ${
                              isSkipped
                                ? "bg-mise-chip text-mise-chip-text"
                                : "bg-mise-warm/15 text-mise-warm"
                            }`}
                            aria-hidden="true"
                          >
                            {isSkipped ? (
                              <Boxes size={12} />
                            ) : (
                              <Check size={12} />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p
                              className={
                                isSkipped ? "line-through" : undefined
                              }
                            >
                              {match.raw}
                            </p>
                            {inPantry ? (
                              <p className="mt-0.5 text-xs">
                                {isSkipped ? "Already have" : "Pantry has"}:{" "}
                                {match.pantryMatch}
                              </p>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : null}
            </div>

            <form
              action={action}
              className="space-y-3 border-t border-mise-border bg-mise-surface-soft p-5"
            >
              <input name="recipeId" type="hidden" value={recipeId} />
              <input
                name="skipPantry"
                type="hidden"
                value={skipPantry ? "true" : "false"}
              />

              <label className="flex items-start gap-2 text-sm text-mise-muted">
                <input
                  type="checkbox"
                  checked={skipPantry}
                  onChange={(event) => setSkipPantry(event.target.checked)}
                  className="mt-1 rounded border-mise-border"
                />
                Skip ingredients I already have in my pantry
              </label>

              {state.message ? (
                <p
                  className={`rounded-xl px-3 py-2 text-sm ${
                    state.status === "success"
                      ? "bg-mise-success-bg text-mise-success-text"
                      : "bg-mise-danger-bg text-mise-danger"
                  }`}
                >
                  {state.message}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  disabled={isPending || isLoadingPreview || willAdd === 0}
                  className="mise-btn-primary"
                >
                  {isPending ? (
                    <Loader2
                      className="animate-spin"
                      size={16}
                      aria-hidden="true"
                    />
                  ) : (
                    <ShoppingBasket size={16} aria-hidden="true" />
                  )}
                  {willAdd > 0
                    ? `Add ${willAdd} item${willAdd === 1 ? "" : "s"}`
                    : "Nothing to add"}
                </button>
                <Link
                  href="/grocery"
                  className="mise-btn-secondary text-sm"
                >
                  Open grocery list
                </Link>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
