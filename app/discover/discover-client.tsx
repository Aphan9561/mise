"use client";

import Link from "next/link";
import { useCallback, useState, type FormEvent } from "react";
import {
  Filter,
  Loader2,
  Search,
  X,
} from "lucide-react";
import {
  fallbackDiscoveryRecipes,
  type DiscoveryRecipe,
} from "@/lib/cooking/discovery";
import { AddDiscoveryRecipeButton } from "@/app/discover/add-discovery-recipe-button";

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
    ? category
    : area
      ? area
      : ingredient.trim()
        ? ingredient
        : query;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
        <aside
          className={`shrink-0 lg:sticky lg:top-6 lg:w-64 ${
            filtersOpen ? "block" : "hidden lg:block"
          }`}
        >
          <form
            onSubmit={applyFilters}
            className="flex flex-col gap-5 rounded-2xl border border-[#e0e6e0] bg-white/90 p-5 shadow-[0_1px_3px_rgba(24,33,31,0.06)] backdrop-blur-sm"
            aria-labelledby="discover-filters-heading"
          >
            <div className="flex items-center justify-between gap-2">
              <h2
                id="discover-filters-heading"
                className="text-sm font-semibold text-[#173f3b]"
              >
                Find recipes
              </h2>
              <button
                type="button"
                onClick={() => {
                  void resetAndSearch();
                }}
                className="text-xs font-medium text-[#16806f]/90 hover:text-[#0d6b5e]"
              >
                Reset
              </button>
            </div>

            <p className="text-xs leading-relaxed text-[#6b756f]">
              Use one path: category, area, ingredient, or name (in that order).
            </p>

            <div className="flex flex-col gap-4">
              <label className="text-xs font-medium text-[#3d4a45]">
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
                  className="mt-1.5 w-full rounded-lg border border-[#d5ddd5] bg-[#fafbf9] px-3 py-2 text-sm text-[#18211f] outline-none transition focus:border-[#16806f] focus:bg-white"
                >
                  <option value="">Any</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-medium text-[#3d4a45]">
                Cuisine / area
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
                  className="mt-1.5 w-full rounded-lg border border-[#d5ddd5] bg-[#fafbf9] px-3 py-2 text-sm text-[#18211f] outline-none transition focus:border-[#16806f] focus:bg-white"
                >
                  <option value="">Any</option>
                  {areas.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-medium text-[#3d4a45]">
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
                  className="mt-1.5 w-full rounded-lg border border-[#d5ddd5] bg-[#fafbf9] px-3 py-2 text-sm outline-none transition focus:border-[#16806f] focus:bg-white"
                  placeholder="e.g. salmon"
                />
              </label>

              <label className="text-xs font-medium text-[#3d4a45]">
                Dish name
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[#d5ddd5] bg-[#fafbf9] px-3 py-2 text-sm outline-none transition focus:border-[#16806f] focus:bg-white"
                  placeholder="Search…"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#2f6a4a] py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#27583d] disabled:bg-[#9aaa9c]"
            >
              {isSearching ? (
                <Loader2 className="animate-spin" size={16} aria-hidden="true" />
              ) : (
                <Search size={16} aria-hidden="true" />
              )}
              Search
            </button>
          </form>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-6 flex items-center justify-between gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              className="flex items-center gap-2 rounded-full border border-[#d5ddd5] bg-white px-4 py-2 text-sm font-medium text-[#173f3b] shadow-sm"
            >
              <Filter size={16} className="text-[#16806f]" aria-hidden="true" />
              {filtersOpen ? "Close" : "Filters"}
            </button>
            {filtersOpen ? (
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="grid size-10 place-items-center rounded-full border border-[#d5ddd5] bg-white text-[#59635f]"
                aria-label="Close filters"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>

          <p className="mb-6 text-sm text-[#6b756f]">
            <span className="text-[#47524d]">{filterSummary}</span>
            <span className="mx-2 text-[#c5ccc5]">·</span>
            <span className="tabular-nums">{recipes.length} results</span>
            <span className="mx-2 text-[#c5ccc5]">·</span>
            <span className="italic text-[#8a938d]">{source}</span>
          </p>

          <ul className="grid gap-6 sm:grid-cols-2">
            {recipes.map((recipe) => {
              const detailHref = `/discover/${encodeURIComponent(recipe.id)}`;
              const canSave =
                recipe.ingredients.length > 0 &&
                recipe.instructions.length > 0;
              return (
                <li key={recipe.id} className="list-none">
                  <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#e2e8e2] bg-white shadow-[0_2px_12px_rgba(24,33,31,0.04)] transition hover:border-[#c5d4c5] hover:shadow-[0_8px_24px_rgba(24,33,31,0.07)]">
                    <Link
                      href={detailHref}
                      className="group block flex-1 px-5 pt-5 text-left outline-none ring-[#16806f]/30 focus-visible:ring-2"
                    >
                      <div
                        className="mb-4 aspect-[16/10] w-full rounded-xl bg-[linear-gradient(145deg,#eef4ee_0%,#f4efe8_100%)] bg-cover bg-center"
                        style={
                          recipe.imageUrl
                            ? { backgroundImage: `url(${recipe.imageUrl})` }
                            : undefined
                        }
                        role={recipe.imageUrl ? "img" : undefined}
                        aria-label={
                          recipe.imageUrl ? recipe.title : undefined
                        }
                      />
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-[#16806f]/90">
                            {recipe.cuisine}
                            <span className="font-normal normal-case text-[#8a938d]">
                              {" "}
                              · ~{recipe.readyInMinutes} min
                            </span>
                          </p>
                          <h2 className="mt-1 font-[family:var(--font-fraunces)] text-xl leading-snug text-[#173f3b] transition group-hover:text-[#0f5c52] sm:text-[1.35rem]">
                            {recipe.title}
                          </h2>
                        </div>
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[#59635f]">
                        {recipe.summary}
                      </p>
                      <p className="mt-4 text-xs font-medium text-[#16806f] opacity-70 transition group-hover:opacity-100">
                        Open recipe →
                      </p>
                    </Link>
                    <div className="mt-auto border-t border-[#eef2ee] px-5 py-4">
                      <AddDiscoveryRecipeButton
                        discoveryId={recipe.id}
                        variant="card"
                        disabled={!canSave}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
