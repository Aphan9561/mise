"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { toggleRecipeTriedAction } from "@/app/recipes/actions";

type Props = {
  recipeId: string;
  hasTried: boolean;
  className?: string;
  label?: { idle: string; tried: string };
};

export function RecipeTriedButton({
  recipeId,
  hasTried,
  className = "",
  label = { idle: "Mark as tried", tried: "Tried" },
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const shownTried = optimistic ?? hasTried;

  function onToggle() {
    startTransition(async () => {
      setOptimistic(!shownTried);
      const result = await toggleRecipeTriedAction(recipeId);
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
      aria-pressed={shownTried}
      title={
        shownTried
          ? "You marked this as tried — click to undo"
          : "Mark this recipe as tried"
      }
      className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition disabled:opacity-50 ${
        shownTried
          ? "border-mise-accent bg-mise-accent/10 text-mise-accent"
          : "border-mise-border bg-transparent text-mise-ink hover:border-mise-ink hover:bg-mise-surface"
      } ${className}`}
    >
      {pending ? (
        <Loader2 className="animate-spin" size={16} aria-hidden="true" />
      ) : shownTried ? (
        <CheckCircle2 size={16} aria-hidden="true" />
      ) : (
        <Circle size={16} aria-hidden="true" />
      )}
      <span className="hidden sm:inline">
        {shownTried ? label.tried : label.idle}
      </span>
    </button>
  );
}
