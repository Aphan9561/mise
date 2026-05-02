"use client";

import { Clock3, ExternalLink, Video } from "lucide-react";
import { AddDiscoveryRecipeButton } from "@/app/discover/add-discovery-recipe-button";
import {
  TechniquePopover,
  useTechniqueHighlighter,
} from "@/app/recipes/[id]/technique-highlighter";
import type { DiscoveryRecipeDetail } from "@/lib/cooking/discovery";

type Props = {
  recipe: DiscoveryRecipeDetail;
};

export function DiscoverRecipeDetail({ recipe }: Props) {
  const {
    technique,
    isLoading: isTechniqueLoading,
    anchor: techniqueAnchor,
    renderStepText,
    closeTechnique,
  } = useTechniqueHighlighter();

  const canSave =
    recipe.ingredients.length > 0 && recipe.instructions.length > 0;

  return (
    <>
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <article className="mise-card overflow-hidden rounded-3xl">
          {recipe.imageUrl ? (
            <div
              className="aspect-[21/9] bg-cover bg-center"
              style={{ backgroundImage: `url(${recipe.imageUrl})` }}
              role="img"
              aria-label={recipe.title}
            />
          ) : null}
          <div className="px-6 py-8 sm:px-10 sm:py-12">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mise-accent">
              {recipe.category
                ? `${recipe.category} · ${recipe.cuisine}`
                : recipe.cuisine}
            </p>
            <h1 className="mt-3 font-serif text-4xl leading-[1.05] tracking-tight text-mise-ink sm:text-5xl lg:text-6xl">
              {recipe.title}
            </h1>
            {recipe.summary ? (
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-mise-muted sm:text-lg">
                {recipe.summary}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-mise-muted">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 size={15} aria-hidden="true" />
                ~{recipe.readyInMinutes} min
              </span>
              {recipe.ingredients.length > 0 ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    {recipe.ingredients.length}{" "}
                    {recipe.ingredients.length === 1
                      ? "ingredient"
                      : "ingredients"}
                  </span>
                </>
              ) : null}
              {recipe.instructions.length > 0 ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    {recipe.instructions.length}{" "}
                    {recipe.instructions.length === 1 ? "step" : "steps"}
                  </span>
                </>
              ) : null}
              {recipe.youtubeUrl ? (
                <>
                  <span aria-hidden="true">·</span>
                  <a
                    href={recipe.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 underline-offset-2 hover:text-mise-ink hover:underline"
                  >
                    <Video size={14} aria-hidden="true" />
                    YouTube
                  </a>
                </>
              ) : null}
              {recipe.sourceUrl ? (
                <>
                  <span aria-hidden="true">·</span>
                  <a
                    href={recipe.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 underline-offset-2 hover:text-mise-ink hover:underline"
                  >
                    <ExternalLink size={14} aria-hidden="true" />
                    Source
                  </a>
                </>
              ) : null}
            </div>

            <AddDiscoveryRecipeButton
              discoveryId={recipe.id}
              variant="detail"
              disabled={!canSave}
            />
          </div>
        </article>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.4fr)]">
          <section className="mise-card overflow-hidden rounded-2xl lg:sticky lg:top-24 lg:self-start">
            <div className="border-b border-mise-border px-6 py-5">
              <h2 className="font-serif text-xl text-mise-ink">Ingredients</h2>
              {recipe.ingredients.length > 0 ? (
                <p className="mt-1 text-xs text-mise-muted">
                  {recipe.ingredients.length}{" "}
                  {recipe.ingredients.length === 1 ? "item" : "items"}
                </p>
              ) : null}
            </div>
            {recipe.ingredients.length > 0 ? (
              <ul className="divide-y divide-mise-border/60">
                {recipe.ingredients.map((ingredient, index) => (
                  <li
                    key={`${ingredient}-${index}`}
                    className="px-6 py-3 text-sm leading-relaxed text-mise-ink"
                  >
                    {ingredient}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-6 py-6 text-sm text-mise-muted">
                No ingredient list available for this recipe.
              </p>
            )}
          </section>

          <section className="mise-card overflow-hidden rounded-2xl">
            <div className="border-b border-mise-border px-6 py-5">
              <h2 className="font-serif text-xl text-mise-ink">Steps</h2>
              <p className="mt-1 text-xs text-mise-muted">
                Tap a highlighted term for a quick technique note.
              </p>
            </div>
            {recipe.instructions.length > 0 ? (
              <ol className="space-y-6 p-6 sm:p-8">
                {recipe.instructions.map((step, index) => (
                  <li
                    key={`${index}-${step.slice(0, 24)}`}
                    className="flex gap-4"
                  >
                    <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-mise-forest text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                    <p className="min-w-0 text-base leading-7 text-mise-ink">
                      {renderStepText(step)}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="p-6 text-sm text-mise-muted">
                No written steps were provided for this dish.
              </p>
            )}
          </section>
        </div>
      </div>

      <TechniquePopover
        technique={technique}
        isLoading={isTechniqueLoading}
        anchor={techniqueAnchor}
        onClose={closeTechnique}
      />
    </>
  );
}
