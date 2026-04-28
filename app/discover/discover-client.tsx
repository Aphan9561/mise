"use client";

import { useState, type FormEvent } from "react";
import { Clock3, Loader2, Search, Sparkles, Utensils } from "lucide-react";
import {
  fallbackDiscoveryRecipes,
  type DiscoveryRecipe,
} from "@/lib/cooking/discovery";

export function DiscoverClient() {
  const [query, setQuery] = useState("weeknight dinner");
  const [recipes, setRecipes] = useState<DiscoveryRecipe[]>(
    fallbackDiscoveryRecipes,
  );
  const [source, setSource] = useState("local");
  const [isSearching, setIsSearching] = useState(false);

  async function searchRecipes(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSearching(true);

    try {
      const response = await fetch(
        `/api/discovery?query=${encodeURIComponent(query)}`,
      );
      const data = (await response.json()) as {
        source?: string;
        recipes?: DiscoveryRecipe[];
      };

      setSource(data.source ?? "local");
      setRecipes(
        data.recipes && data.recipes.length > 0
          ? data.recipes
          : fallbackDiscoveryRecipes,
      );
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <section className="rounded-lg border border-[#d8ddd4] bg-white">
        <div className="grid gap-4 border-b border-[#e4e8df] px-5 py-5 lg:grid-cols-[1fr_420px]">
          <div>
            <p className="text-xs font-semibold uppercase text-[#16806f]">
              {source}
            </p>
            <h2 className="mt-2 font-[family:var(--font-fraunces)] text-4xl text-[#173f3b]">
              Search by ingredient, cuisine, or craving.
            </h2>
          </div>
          <form onSubmit={searchRecipes} className="flex items-end gap-2">
            <label className="min-w-0 flex-1 text-sm font-medium">
              Search
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="mt-1 w-full rounded-md border border-[#cfd8cf] px-3 py-2 text-sm outline-none focus:border-[#16806f]"
                placeholder="salmon, pasta, vegetarian"
              />
            </label>
            <button
              type="submit"
              disabled={isSearching}
              className="grid size-10 place-items-center rounded-md bg-[#e85234] text-white hover:bg-[#cf4228] disabled:bg-[#aab3ad]"
              title="Search recipes"
            >
              {isSearching ? (
                <Loader2 className="animate-spin" size={16} aria-hidden="true" />
              ) : (
                <Search size={16} aria-hidden="true" />
              )}
            </button>
          </form>
        </div>

        <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
          {recipes.map((recipe) => (
            <article
              key={recipe.id}
              className="rounded-lg border border-[#e4e8df] bg-white p-4"
            >
              <div
                className="mb-4 aspect-[4/3] rounded-md bg-[linear-gradient(135deg,#e7f0ff_0%,#dff5ef_55%,#ffe6d6_100%)] bg-cover bg-center"
                style={
                  recipe.imageUrl
                    ? { backgroundImage: `url(${recipe.imageUrl})` }
                    : undefined
                }
                role={recipe.imageUrl ? "img" : undefined}
                aria-label={recipe.imageUrl ? recipe.title : undefined}
              />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-[#16806f]">
                    {recipe.cuisine}
                  </p>
                  <h3 className="mt-2 font-[family:var(--font-fraunces)] text-2xl text-[#173f3b]">
                    {recipe.title}
                  </h3>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded bg-[#eef4ff] px-2 py-1 text-xs font-semibold text-[#164376]">
                  <Clock3 size={13} aria-hidden="true" />
                  {recipe.readyInMinutes}
                </span>
              </div>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#59635f]">
                {recipe.summary}
              </p>
              <div className="mt-4 grid gap-3">
                <div className="rounded-md bg-[#f5f7f1] p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Utensils size={15} aria-hidden="true" />
                    Ingredients
                  </div>
                  <ul className="mt-2 space-y-1 text-sm text-[#59635f]">
                    {recipe.ingredients.slice(0, 4).map((ingredient) => (
                      <li key={ingredient}>{ingredient}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-md bg-[#f0f7f5] p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#0d6b5e]">
                    <Sparkles size={15} aria-hidden="true" />
                    First step
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#315d55]">
                    {recipe.instructions[0] ?? "Open the source recipe for steps."}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
