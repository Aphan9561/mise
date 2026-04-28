"use client";

import Link from "next/link";
import { useCallback, useState, type FormEvent } from "react";
import {
  Clock3,
  Filter,
  Loader2,
  Search,
  Sparkles,
  Utensils,
  X,
} from "lucide-react";
import {
  fallbackDiscoveryRecipes,
  type DiscoveryRecipe,
} from "@/lib/cooking/discovery";

type Props = {
  categories: string[];
  areas: string[];
  initialRecipes: DiscoveryRecipe[];
  initialSource: string;
};

function buildDiscoveryApiUrl(filters: {
  category: string;
  area: string;
  ingredient: string;
  query: string;
}): string {
  const params = new URLSearchParams();
  params.set("limit", "12");

  if (filters.category.trim()) {
    params.set("category", filters.category.trim());
  } else if (filters.area.trim()) {
    params.set("area", filters.area.trim());
  } else if (filters.ingredient.trim()) {
    params.set("ingredient", filters.ingredient.trim());
  } else {
    params.set("query", filters.query.trim() || "weeknight dinner");
  }

  return `/api/discovery?${params.toString()}`;
}

export function DiscoverClient({
  categories,
  areas,
  initialRecipes,
  initialSource,
}: Props) {
  const [category, setCategory] = useState("");
  const [area, setArea] = useState("");
  const [ingredient, setIngredient] = useState("");
  const [query, setQuery] = useState("weeknight dinner");

  const [recipes, setRecipes] =
    useState<DiscoveryRecipe[]>(initialRecipes);
  const [source, setSource] = useState(initialSource);
  const [isSearching, setIsSearching] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const runSearch = useCallback(async () => {
    setIsSearching(true);
    try {
      const response = await fetch(
        buildDiscoveryApiUrl({ category, area, ingredient, query }),
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
  }, [area, category, ingredient, query]);

  const resetAndSearch = useCallback(async () => {
    setCategory("");
    setArea("");
    setIngredient("");
    setQuery("weeknight dinner");
    setIsSearching(true);
    try {
      const response = await fetch(
        buildDiscoveryApiUrl({
          category: "",
          area: "",
          ingredient: "",
          query: "weeknight dinner",
        }),
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
  }, []);

  async function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFiltersOpen(false);
    await runSearch();
  }

  const filterSummary = category
    ? `Category: ${category}`
    : area
      ? `Area: ${area}`
      : ingredient.trim()
        ? `Ingredient: ${ingredient}`
        : `Dish search: ${query}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside
          className={`shrink-0 rounded-lg border border-[#d8ddd4] bg-white lg:w-72 ${
            filtersOpen ? "block" : "hidden lg:block"
          }`}
        >
          <form
            onSubmit={applyFilters}
            className="flex flex-col gap-4 p-4"
            aria-labelledby="discover-filters-heading"
          >
            <div className="flex items-center justify-between gap-2 border-b border-[#e4e8df] pb-3">
              <h2
                id="discover-filters-heading"
                className="flex items-center gap-2 font-semibold text-[#173f3b]"
              >
                <Filter size={18} className="text-[#16806f]" aria-hidden="true" />
                Filters
              </h2>
              <button
                type="button"
                onClick={() => {
                  void resetAndSearch();
                }}
                className="text-xs font-semibold text-[#16806f] hover:underline"
              >
                Reset
              </button>
            </div>

            <p className="text-xs leading-5 text-[#59635f]">
              Category, area, or main ingredient each run their own TheMealDB
              search (first wins: category → area → ingredient → name search).
            </p>

            <label className="text-sm font-medium text-[#2d241d]">
              Category
              <select
                value={category}
                onChange={(e) => {
                  const v = e.target.value;
                  setCategory(v);
                  if (v) {
                    setArea("");
                    setIngredient("");
                  }
                }}
                className="mt-1 w-full rounded-md border border-[#cfd8cf] bg-white px-3 py-2 text-sm outline-none focus:border-[#16806f]"
              >
                <option value="">Any category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-[#2d241d]">
              Area (cuisine)
              <select
                value={area}
                onChange={(e) => {
                  const v = e.target.value;
                  setArea(v);
                  if (v) {
                    setCategory("");
                    setIngredient("");
                  }
                }}
                className="mt-1 w-full rounded-md border border-[#cfd8cf] bg-white px-3 py-2 text-sm outline-none focus:border-[#16806f]"
              >
                <option value="">Any area</option>
                {areas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-[#2d241d]">
              Main ingredient
              <input
                value={ingredient}
                onChange={(e) => {
                  const v = e.target.value;
                  setIngredient(v);
                  if (v.trim()) {
                    setCategory("");
                    setArea("");
                  }
                }}
                className="mt-1 w-full rounded-md border border-[#cfd8cf] px-3 py-2 text-sm outline-none focus:border-[#16806f]"
                placeholder="e.g. salmon, rice"
              />
            </label>

            <label className="text-sm font-medium text-[#2d241d]">
              Search by dish name
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="mt-1 w-full rounded-md border border-[#cfd8cf] px-3 py-2 text-sm outline-none focus:border-[#16806f]"
                placeholder="curry, pasta…"
              />
            </label>

            <button
              type="submit"
              disabled={isSearching}
              className="flex items-center justify-center gap-2 rounded-md bg-[#2f6a4a] py-2.5 text-sm font-semibold text-white hover:bg-[#27583d] disabled:bg-[#aab397]"
            >
              {isSearching ? (
                <Loader2 className="animate-spin" size={16} aria-hidden="true" />
              ) : (
                <Search size={16} aria-hidden="true" />
              )}
              Apply filters
            </button>
          </form>
        </aside>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex items-center justify-between gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              className="flex items-center gap-2 rounded-md border border-[#cfd8cf] bg-white px-3 py-2 text-sm font-semibold"
            >
              <Filter size={16} aria-hidden="true" />
              {filtersOpen ? "Hide filters" : "Filters"}
            </button>
            {filtersOpen ? (
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="grid size-9 place-items-center rounded-md border border-[#cfd8cf]"
                aria-label="Close filters"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>

          <section className="rounded-lg border border-[#d8ddd4] bg-white">
            <div className="grid gap-4 border-b border-[#e4e8df] px-5 py-5">
              <div>
                <p className="text-xs font-semibold uppercase text-[#16806f]">
                  {source}
                </p>
                <h1 className="mt-2 font-[family:var(--font-fraunces)] text-3xl text-[#173f3b] sm:text-4xl">
                  Discover recipes
                </h1>
                <p className="mt-2 text-sm text-[#59635f]">
                  Active: {filterSummary}. Tap a card for full ingredients and
                  steps.
                </p>
              </div>
            </div>

            <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
              {recipes.map((recipe) => (
                <Link
                  key={recipe.id}
                  href={`/discover/${encodeURIComponent(recipe.id)}`}
                  className="group block rounded-lg border border-[#e4e8df] bg-white p-4 text-left shadow-sm outline-none ring-[#16806f] transition hover:-translate-y-0.5 hover:border-[#16806f]/40 hover:shadow-md focus-visible:ring-2"
                >
                  <div
                    className="mb-4 aspect-[4/3] rounded-md bg-[linear-gradient(135deg,#e7f0ff_0%,#dff5ef_55%,#ffe6d6_100%)] bg-cover bg-center transition group-hover:opacity-95"
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
                      <h2 className="mt-2 font-[family:var(--font-fraunces)] text-2xl text-[#173f3b] group-hover:text-[#0d6b5e]">
                        {recipe.title}
                      </h2>
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
                        {recipe.ingredients.slice(0, 4).map((ing) => (
                          <li key={ing}>{ing}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md bg-[#f0f7f5] p-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#0d6b5e]">
                        <Sparkles size={15} aria-hidden="true" />
                        First step
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#315d55]">
                        {recipe.instructions[0] ??
                          "Open the recipe for full steps."}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#16806f] opacity-0 transition group-hover:opacity-100">
                    View recipe →
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
