"use client";

import Link from "next/link";
import { Clock3 } from "lucide-react";
import { RecipeImage } from "@/app/recipes/recipe-image";
import { RecipeStarButton } from "@/app/recipes/recipe-star-button";
import type { UserRecipe } from "@/lib/supabase/recipes";

type Props = {
  recipe: UserRecipe;
};

export function RecipeCookbookCard({ recipe }: Props) {
  return (
    <div className="group relative overflow-hidden rounded-md border border-mise-border bg-mise-surface transition hover:border-mise-accent/60">
      <div className="absolute right-3 top-3 z-10">
        <RecipeStarButton
          recipeId={recipe.id}
          isStarred={recipe.is_starred}
          label="Star"
          className="rounded-md bg-mise-surface/95 backdrop-blur-sm"
        />
      </div>
      {recipe.has_tried ? (
        <div
          className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-sm border border-mise-accent bg-mise-surface/95 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-mise-accent backdrop-blur-sm"
          style={{ letterSpacing: "0.18em" }}
        >
          Tried
        </div>
      ) : null}
      <Link
        href={`/recipes/${recipe.id}`}
        className="block outline-none ring-mise-ink/30 focus-visible:ring-2"
      >
        <RecipeImage
          src={recipe.image_url}
          title={recipe.title}
          className="aspect-[4/3]"
          size="card"
        />
        <hr className="mise-rule" />
        <div className="p-5">
          <p className="mise-eyebrow">
            {recipe.cuisine ?? recipe.source}
          </p>
          <h3 className="mt-2 line-clamp-2 pr-14 font-serif text-xl font-medium leading-snug tracking-tight text-mise-ink">
            {recipe.title}
          </h3>
          {recipe.description ? (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-mise-muted">
              {recipe.description}
            </p>
          ) : null}
          <hr className="mise-rule mt-4" />
          <div className="mt-3 flex items-center justify-between text-[11px] font-semibold uppercase text-mise-muted" style={{ letterSpacing: "0.16em" }}>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 size={12} aria-hidden="true" />
              {recipe.prep_minutes ?? 30} min
            </span>
            <span>{recipe.ingredients.length} items</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
