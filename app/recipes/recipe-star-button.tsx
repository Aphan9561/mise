"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";
import { toggleRecipeStarAction } from "@/app/recipes/actions";

type Props = {
  recipeId: string;
  isStarred: boolean;
  className?: string;
  label?: string;
};

export function RecipeStarButton({
  recipeId,
  isStarred,
  className = "",
  label = "Favorite",
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const shownStarred = optimistic ?? isStarred;

  function onToggle() {
    startTransition(async () => {
      setOptimistic(!shownStarred);
      const result = await toggleRecipeStarAction(recipeId);
      if (!result.ok) {
        setOptimistic(null);
        return;
      }
      setOptimistic(null);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={pending}
      aria-pressed={shownStarred}
      title={shownStarred ? "Remove from favorites" : "Add to favorites"}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md border border-mise-border bg-mise-surface px-3 py-2 text-sm font-medium text-mise-ink transition hover:border-mise-accent hover:bg-mise-accent/5 disabled:opacity-50 ${className}`}
    >
      {pending ? (
        <Loader2 className="animate-spin" size={16} aria-hidden="true" />
      ) : (
        <Star
          size={16}
          aria-hidden="true"
          className={
            shownStarred
              ? "fill-mise-accent text-mise-accent"
              : "text-mise-muted"
          }
        />
      )}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
