"use client";

import Link from "next/link";
import { useCallback, useState, type FormEvent } from "react";
import {
  Clock3,
  Filter,
  Loader2,
  Search,
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

function DiscoverSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2"
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`sk-${index}`}
          className="animate-pulse overflow-hidden rounded-2xl border border-mise-border bg-mise-surface"
        >
          <div className="aspect-[4/3] bg-mise-border/45" />
          <div className="space-y-3 p-4">
            <div className="h-2 w-24 rounded-full bg-mise-border/70" />
            <div className="h-6 w-[88%] rounded-lg bg-mise-border/55" />
            <div className="h-10 w-full rounded-lg bg-mise-border/35" />
          </div>
        </div>
      ))}
    </div>
  );
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
  const [query, setQuery] = useState("");

  const [recipes, setRecipes] =
    useState<DiscoveryRecipe[]>(initialRecipes);
  const [source, setSource] = useState(initialSource);
  const [isSearching, setIsSearching] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const runSearch = useCallback(async () => {
    setIsSearching(true);
    setFetchError(null);
    try {
      const response = await fetch(
        buildDiscoveryApiUrl({ category, area, ingredient, query }),
      );
      const data = (await response.json()) as {
        source?: string;
        recipes?: DiscoveryRecipe[];
        error?: string;
      };

      if (!response.ok) {
        setFetchError(
          data.error ?? `Search failed (${response.status}). Try again.`,
        );
        return;
      }

      setSource(data.source ?? "local");
      setRecipes(
        data.recipes && data.recipes.length > 0
          ? data.recipes
          : fallbackDiscoveryRecipes,
      );
    } catch {
      setFetchError(
        "We couldn’t reach Discover. Check your connection and try again.",
      );
    } finally {
      setIsSearching(false);
    }
  }, [area, category, ingredient, query]);

  const resetAndSearch = useCallback(async () => {
    setCategory("");
    setArea("");
    setIngredient("");
    setQuery("");
    setIsSearching(true);
    setFetchError(null);
    try {
      const response = await fetch(
        buildDiscoveryApiUrl({
          category: "",
          area: "",
          ingredient: "",
          query: "",
        }),
      );
      const data = (await response.json()) as {
        source?: string;
        recipes?: DiscoveryRecipe[];
        error?: string;
      };

      if (!response.ok) {
        setFetchError(data.error ?? `Search failed (${response.status}).`);
        return;
      }

      setSource(data.source ?? "local");
      setRecipes(
        data.recipes && data.recipes.length > 0
          ? data.recipes
          : fallbackDiscoveryRecipes,
      );
    } catch {
      setFetchError(
        "We couldn’t reach Discover. Check your connection and try again.",
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
        : query.trim() || "All recipes";

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
            className="mise-card flex flex-col gap-5 rounded-2xl border-mise-border/80 bg-mise-surface/95 p-5 backdrop-blur-sm"
            aria-labelledby="discover-filters-heading"
          >
            <div className="flex items-center justify-between gap-2">
              <h2
                id="discover-filters-heading"
                className="text-sm font-semibold text-mise-ink"
              >
                Find recipes
              </h2>
              <button
                type="button"
                onClick={() => {
                  void resetAndSearch();
                }}
                className="text-xs font-medium text-mise-accent hover:text-mise-accent-hover"
              >
                Reset
              </button>
            </div>

            <p className="text-xs leading-relaxed text-mise-muted">
              Use one path: category, area, ingredient, or name (in that order).
            </p>

            <div className="flex flex-col gap-4">
              <label className="mise-label normal-case">
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
                  className="mise-input"
                >
                  <option value="">Any</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mise-label normal-case">
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
                  className="mise-input"
                >
                  <option value="">Any</option>
                  {areas.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mise-label normal-case">
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
                  className="mise-input"
                  placeholder="e.g. salmon"
                />
              </label>

              <label className="mise-label normal-case">
                Dish name
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="mise-input"
                  placeholder="Search…"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="mise-btn-primary w-full"
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
              className="mise-btn-secondary py-2 pl-4 pr-4"
            >
              <Filter size={16} className="text-mise-accent" aria-hidden="true" />
              {filtersOpen ? "Close" : "Filters"}
            </button>
            {filtersOpen ? (
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="grid size-10 place-items-center rounded-full border border-mise-border bg-mise-surface text-mise-muted"
                aria-label="Close filters"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>

          <p className="mb-6 text-sm text-mise-muted">
            <span className="text-mise-ink/85">{filterSummary}</span>
            <span className="mx-2 text-mise-border">·</span>
            <span className="tabular-nums" aria-live="polite">
              {recipes.length} results
            </span>
            <span className="mx-2 text-mise-border">·</span>
            <span className="italic text-mise-muted/80">{source}</span>
          </p>

          {fetchError ? (
            <section
              className="mb-6 rounded-2xl border border-mise-danger-border bg-mise-danger-bg px-4 py-3 text-sm text-mise-danger"
              role="alert"
            >
              <p>{fetchError}</p>
              <button
                type="button"
                className="mt-3 mise-btn-secondary text-xs"
                onClick={() => void runSearch()}
              >
                Try again
              </button>
            </section>
          ) : null}

          <div aria-busy={isSearching} aria-label="Recipe search results">
          {isSearching ? (
            <DiscoverSkeletonGrid />
          ) : recipes.length === 0 ? (
            <div className="grid min-h-[280px] place-items-center rounded-2xl border border-dashed border-mise-border bg-mise-surface/60 p-10 text-center">
              <div className="max-w-sm">
                <Search
                  className="mx-auto text-mise-muted/50"
                  size={36}
                  aria-hidden="true"
                />
                <h3 className="mt-4 font-serif text-xl text-mise-ink">
                  No recipes match
                </h3>
                <p className="mt-2 text-sm text-mise-muted">
                  Widen your filters or pick a different dish name, then search
                  again.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
            {recipes.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/discover/${encodeURIComponent(recipe.id)}`}
                className="group overflow-hidden rounded-2xl border border-mise-border bg-mise-surface transition hover:-translate-y-0.5 hover:border-mise-accent/35 hover:shadow-[var(--shadow-mise-float)]"
              >
                <div
                  className="aspect-[4/3] bg-[linear-gradient(145deg,#eef4ee_0%,#f4efe8_100%)] bg-cover bg-center"
                  style={
                    recipe.imageUrl
                      ? { backgroundImage: `url(${recipe.imageUrl})` }
                      : undefined
                  }
                  role={recipe.imageUrl ? "img" : undefined}
                  aria-label={
                    recipe.imageUrl
                      ? `${recipe.title} — recipe photo`
                      : undefined
                  }
                />
                <div className="p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-mise-accent">
                    {recipe.cuisine}
                  </p>
                  <h3 className="mt-1 line-clamp-2 font-serif text-xl text-mise-ink transition group-hover:text-mise-accent">
                    {recipe.title}
                  </h3>
                  {recipe.summary ? (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-mise-muted">
                      {recipe.summary}
                    </p>
                  ) : null}
                  <div className="mt-3 flex items-center justify-between text-xs text-mise-muted">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 size={14} aria-hidden="true" />
                      ~{recipe.readyInMinutes} min
                    </span>
                    {recipe.ingredients.length > 0 ? (
                      <span>{recipe.ingredients.length} ingredients</span>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
