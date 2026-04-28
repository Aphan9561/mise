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
      ? "flex w-full items-center justify-center gap-2 rounded-lg border border-[#dce5dc] bg-[#f8faf8] px-3 py-2 text-sm font-medium text-[#2d4a3e] transition hover:border-[#c5d4c5] hover:bg-[#f0f5f0] disabled:cursor-not-allowed disabled:opacity-50"
      : "inline-flex items-center justify-center gap-2 rounded-full bg-[#2f6a4a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#27583d] disabled:cursor-not-allowed disabled:bg-[#aab397]";

  return (
    <div className={variant === "detail" ? "mt-6" : ""}>
      {isSuccess ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#cfe8de] bg-[#f0faf5] px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-[#1f5c40]">
            <Check size={18} aria-hidden="true" />
            Saved to your recipes
          </span>
          <Link
            href={`/recipes/${state.newRecipeId}`}
            className="text-sm font-semibold text-[#16806f] underline underline-offset-2 hover:text-[#0d6b5e]"
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
        <p className="mt-2 text-sm text-[#9a3412]" role="alert">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
