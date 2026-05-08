"use client";

import Link from "next/link";
import { Clock3 } from "lucide-react";
import { RecipeStarButton } from "@/app/recipes/recipe-star-button";
import type { UserRecipe } from "@/lib/supabase/recipes";

type Props = {
  recipe: UserRecipe;
};

export function RecipeCookbookCard({ recipe }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-mise-border bg-mise-surface transition hover:-translate-y-0.5 hover:border-mise-accent/35 hover:shadow-[var(--shadow-mise-float)]">
      <div className="absolute right-3 top-3 z-10">
        <RecipeStarButton
          recipeId={recipe.id}
          isStarred={recipe.is_starred}
          label="Star"
          className="rounded-full bg-mise-surface/90 shadow-sm backdrop-blur-sm"
        />
      </div>
      <Link
        href={`/recipes/${recipe.id}`}
        className="block outline-none ring-mise-accent/30 focus-visible:ring-2"
      >
        <div
          className="aspect-[4/3] bg-[linear-gradient(145deg,#eef4ee_0%,#f4efe8_100%)] bg-cover bg-center"
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
        <div className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-mise-accent">
            {recipe.cuisine ?? recipe.source}
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
