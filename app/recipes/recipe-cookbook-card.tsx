"use client";

import Link from "next/link";
import { CheckCircle2, Clock3 } from "lucide-react";
import { RecipeStarButton } from "@/app/recipes/recipe-star-button";
import type { UserRecipe } from "@/lib/supabase/recipes";

type Props = {
  recipe: UserRecipe;
};

export function RecipeCookbookCard({ recipe }: Props) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-mise-surface transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-mise-float)] ${
        recipe.has_tried
          ? "border-mise-accent/30 ring-1 ring-mise-accent/20 hover:border-mise-accent/55"
          : "border-mise-border hover:border-mise-accent/35"
      }`}
    >
      <div className="absolute right-3 top-3 z-10">
        <RecipeStarButton
          recipeId={recipe.id}
          isStarred={recipe.is_starred}
          label="Star"
          className="rounded-full bg-mise-surface/90 shadow-sm backdrop-blur-sm"
        />
      </div>
      {recipe.has_tried ? (
        <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-mise-accent/15 px-2.5 py-1 text-[11px] font-semibold text-mise-accent shadow-sm backdrop-blur-sm">
          <CheckCircle2 size={12} aria-hidden="true" />
          Tried
        </div>
      ) : null}
      <Link
        href={`/recipes/${recipe.id}`}
        className="block outline-none ring-mise-accent/30 focus-visible:ring-2"
      >
        <div className="relative">
          <div
            className={`aspect-[4/3] bg-[linear-gradient(145deg,#ead4a8_0%,#d6b78a_60%,#a07452_100%)] bg-cover bg-center transition ${
              recipe.has_tried ? "opacity-80 saturate-[0.85]" : ""
            }`}
            style={
              recipe.image_url
                ? { backgroundImage: `url(${recipe.image_url})` }
                : undefined
            }
            role={recipe.image_url ? "img" : undefined}
            aria-label={
              recipe.image_url
                ? `${recipe.title} — recipe photo`
                : `Placeholder image for ${recipe.title}`
            }
          />
          {recipe.has_tried ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-mise-accent/10"
            />
          ) : null}
        </div>
        <div className="p-4">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-mise-accent">
            <span>{recipe.cuisine ?? recipe.source}</span>
            {recipe.has_tried ? (
              <span className="rounded-full bg-mise-accent/15 px-1.5 py-0.5 text-[9px] tracking-wide text-mise-accent">
                cooked
              </span>
            ) : null}
          </p>
          <h3 className="mt-1 line-clamp-2 pr-14 font-serif text-xl text-mise-ink">
            {recipe.title}
          </h3>
          {recipe.description ? (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-mise-muted">
              {recipe.description}
            </p>
          ) : null}
          <div className="mt-3 flex items-center justify-between text-xs text-mise-muted">
            <span className="inline-flex items-center gap-1">
              <Clock3 size={14} aria-hidden="true" />
              {recipe.prep_minutes ?? 30} min
            </span>
            <span>{recipe.ingredients.length} ingredients</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
