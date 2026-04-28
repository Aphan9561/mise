import type { DiscoveryRecipeDetail } from "@/lib/cooking/discovery";
import { Clock3, ExternalLink, Utensils, Video } from "lucide-react";
import { AddDiscoveryRecipeButton } from "@/app/discover/add-discovery-recipe-button";

type Props = {
  recipe: DiscoveryRecipeDetail;
};

export function DiscoverRecipeDetail({ recipe }: Props) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div
        className="mb-8 aspect-[16/9] w-full rounded-2xl bg-[linear-gradient(145deg,#eef4ee_0%,#f4efe8_100%)] bg-cover bg-center shadow-[var(--shadow-mise-card)]"
        style={
          recipe.imageUrl
            ? { backgroundImage: `url(${recipe.imageUrl})` }
            : undefined
        }
        role={recipe.imageUrl ? "img" : undefined}
        aria-label={recipe.imageUrl ? recipe.title : undefined}
      />

      <p className="text-[10px] font-semibold uppercase tracking-wider text-mise-accent">
        {recipe.category
          ? `${recipe.category} · ${recipe.cuisine}`
          : recipe.cuisine}
      </p>
      <h1 className="mt-3 font-serif text-4xl text-mise-ink sm:text-5xl">
        {recipe.title}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-mise-muted">
        <span className="inline-flex items-center gap-1 rounded-full bg-mise-chip px-3 py-1 font-semibold text-mise-chip-text">
          <Clock3 size={14} aria-hidden="true" />
          ~{recipe.readyInMinutes} min
        </span>
        {recipe.youtubeUrl ? (
          <a
            href={recipe.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-mise-warm hover:underline"
          >
            <Video size={16} aria-hidden="true" />
            Watch on YouTube
          </a>
        ) : null}
        {recipe.sourceUrl ? (
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-mise-accent hover:underline"
          >
            <ExternalLink size={14} aria-hidden="true" />
            Original source
          </a>
        ) : null}
      </div>

      <p className="mt-6 text-base leading-relaxed text-mise-muted">
        {recipe.summary}
      </p>

      <AddDiscoveryRecipeButton
        discoveryId={recipe.id}
        variant="detail"
        disabled={
          recipe.ingredients.length === 0 || recipe.instructions.length === 0
        }
      />

      <section className="mise-card mt-10 rounded-2xl p-6">
        <h2 className="flex items-center gap-2 font-serif text-2xl text-mise-ink">
          <Utensils size={22} className="text-mise-accent" aria-hidden="true" />
          Ingredients
        </h2>
        {recipe.ingredients.length > 0 ? (
          <ul className="mt-4 list-inside list-disc space-y-2 text-mise-muted">
            {recipe.ingredients.map((item, index) => (
              <li key={`${index}-${item}`}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-mise-muted">
            No ingredient list available for this recipe.
          </p>
        )}
      </section>

      <section className="mise-card mt-6 rounded-2xl p-6">
        <h2 className="font-serif text-2xl text-mise-ink">Instructions</h2>
        {recipe.instructions.length > 0 ? (
          <ol className="mt-4 list-inside list-decimal space-y-3 text-mise-muted">
            {recipe.instructions.map((step, index) => (
              <li key={`${index}-${step.slice(0, 24)}`} className="leading-7">
                {step}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-4 text-sm text-mise-muted">
            No written steps were provided for this dish.
          </p>
        )}
      </section>
    </article>
  );
}
