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
        className="mb-8 aspect-[16/9] w-full rounded-2xl bg-[linear-gradient(135deg,#e7f0ff_0%,#dff5ef_55%,#ffe6d6_100%)] bg-cover bg-center shadow-lg"
        style={
          recipe.imageUrl
            ? { backgroundImage: `url(${recipe.imageUrl})` }
            : undefined
        }
        role={recipe.imageUrl ? "img" : undefined}
        aria-label={recipe.imageUrl ? recipe.title : undefined}
      />

      <p className="text-xs font-semibold uppercase tracking-wide text-[#16806f]">
        {recipe.category
          ? `${recipe.category} · ${recipe.cuisine}`
          : recipe.cuisine}
      </p>
      <h1 className="mt-2 font-[family:var(--font-fraunces)] text-4xl text-[#173f3b] sm:text-5xl">
        {recipe.title}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[#59635f]">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#eef4ff] px-3 py-1 font-semibold text-[#164376]">
          <Clock3 size={14} aria-hidden="true" />
          ~{recipe.readyInMinutes} min
        </span>
        {recipe.youtubeUrl ? (
          <a
            href={recipe.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-[#c41e1e] hover:underline"
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
            className="inline-flex items-center gap-1 font-semibold text-[#16806f] hover:underline"
          >
            <ExternalLink size={14} aria-hidden="true" />
            Original source
          </a>
        ) : null}
      </div>

      <p className="mt-6 text-base leading-7 text-[#3d4a45]">{recipe.summary}</p>

      <AddDiscoveryRecipeButton
        discoveryId={recipe.id}
        variant="detail"
        disabled={
          recipe.ingredients.length === 0 || recipe.instructions.length === 0
        }
      />

      <section className="mt-10 rounded-2xl border border-[#e4e8df] bg-white p-6">
        <h2 className="flex items-center gap-2 font-[family:var(--font-fraunces)] text-2xl text-[#173f3b]">
          <Utensils size={22} className="text-[#16806f]" aria-hidden="true" />
          Ingredients
        </h2>
        {recipe.ingredients.length > 0 ? (
          <ul className="mt-4 list-inside list-disc space-y-2 text-[#59635f]">
            {recipe.ingredients.map((item, index) => (
              <li key={`${index}-${item}`}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-[#59635f]">
            No ingredient list available for this recipe.
          </p>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-[#e4e8df] bg-white p-6">
        <h2 className="font-[family:var(--font-fraunces)] text-2xl text-[#173f3b]">
          Instructions
        </h2>
        {recipe.instructions.length > 0 ? (
          <ol className="mt-4 list-inside list-decimal space-y-3 text-[#59635f]">
            {recipe.instructions.map((step, index) => (
              <li key={`${index}-${step.slice(0, 24)}`} className="leading-7">
                {step}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-4 text-sm text-[#59635f]">
            No written steps were provided for this dish.
          </p>
        )}
      </section>
    </article>
  );
}
