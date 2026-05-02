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
              className="mise-btn-secondary rounded-full py-2 pl-4 pr-4"
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
            <span className="tabular-nums">{recipes.length} results</span>
            <span className="mx-2 text-mise-border">·</span>
            <span className="italic text-mise-muted/80">{source}</span>
          </p>

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
                  aria-label={recipe.imageUrl ? recipe.title : undefined}
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
        </div>
      </div>
    </div>
  );
}
