"use client";

import Link from "next/link";
import { useActionState } from "react";
import { BookmarkPlus, Check, Loader2 } from "lucide-react";
import {
  addDiscoveryRecipeAction,
  type RecipeActionState,
} from "@/app/recipes/actions";

const initial: RecipeActionState = {
  status: "idle",
  message: "",
};

type Props = {
  discoveryId: string;
  variant?: "detail" | "card";
  disabled?: boolean;
};

export function AddDiscoveryRecipeButton({
  discoveryId,
  variant = "detail",
  disabled = false,
}: Props) {
  const [state, formAction, isPending] = useActionState(
    addDiscoveryRecipeAction,
    initial,
  );

  const isSuccess = state.status === "success" && Boolean(state.newRecipeId);

  const buttonClass =
    variant === "card"
      ? "mise-btn-secondary w-full rounded-xl py-2.5 text-sm font-medium"
      : "mise-btn-primary rounded-full px-6";

  return (
    <div className={variant === "detail" ? "mt-6" : ""}>
      {isSuccess ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-mise-accent/25 bg-mise-success-bg px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-mise-success-text">
            <Check size={18} aria-hidden="true" />
            Saved to your recipes
          </span>
          <Link
            href={`/recipes/${state.newRecipeId}`}
            className="text-sm font-semibold text-mise-accent underline underline-offset-2 hover:text-mise-accent-hover"
          >
            Open in My recipes
          </Link>
        </div>
      ) : (
        <form action={formAction} className="flex flex-col gap-2">
          <input type="hidden" name="discoveryId" value={discoveryId} />
          <button
            type="submit"
            disabled={disabled || isPending}
            className={buttonClass}
          >
            {isPending ? (
              <Loader2 className="animate-spin" size={18} aria-hidden="true" />
            ) : (
              <BookmarkPlus size={18} aria-hidden="true" />
            )}
            {isPending ? "Saving…" : "Add to my recipes"}
          </button>
        </form>
      )}
      {state.status === "error" && state.message ? (
        <p className="mt-2 text-sm text-mise-danger" role="alert">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
