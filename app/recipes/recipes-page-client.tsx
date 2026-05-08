"use client";

import { useActionState, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  BookOpen,
  Boxes,
  Compass,
  Filter,
  Import,
  Loader2,
  Plus,
  Search,
  ShoppingBasket,
  Utensils,
  X,
} from "lucide-react";
import {
  createRecipeAction,
  importRecipeFromUrlAction,
  type RecipeActionState,
} from "@/app/recipes/actions";
import { RecipeCookbookCard } from "@/app/recipes/recipe-cookbook-card";
import type { UserRecipe } from "@/lib/supabase/recipes";

type ImportPreview = {
  title: string;
  description: string;
  cuisine: string;
  prepMinutes: number | null;
  imageUrl?: string | null;
  ingredients: string[];
  instructions: string[];
};

type RecipesPageClientProps = {
  recipes: UserRecipe[];
  primaryEmail: string | null;
  recipesMissingTable: boolean;
  recipesErrorMessage: string | null;
};

const initialActionState: RecipeActionState = {
  status: "idle",
  message: "",
};

function ActionMessage({ state }: { state: RecipeActionState }) {
  if (!state.message) {
    return null;
  }

  return (
    <p
      className={`rounded-xl px-3 py-2 text-sm ${
        state.status === "success"
          ? "bg-mise-success-bg text-mise-success-text"
          : "bg-mise-danger-bg text-mise-danger"
      }`}
    >
      {state.message}
    </p>
  );
}

export function RecipesPageClient({
  recipes,
  primaryEmail,
  recipesMissingTable,
  recipesErrorMessage,
}: RecipesPageClientProps) {
  const router = useRouter();
  const [listTab, setListTab] = useState<"all" | "starred" | "tried" | "untried">(
    "all",
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState("");
  const [maxPrep, setMaxPrep] = useState<"" | "15" | "30" | "45" | "60">("");
  const [manualState, manualAction, isSavingManual] = useActionState(
    createRecipeAction,
    initialActionState,
  );
  const [importState, importAction, isImporting] = useActionState(
    importRecipeFromUrlAction,
    initialActionState,
  );
  const [recipeUrl, setRecipeUrl] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);

  const cuisineOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of recipes) {
      const c = (r.cuisine ?? "").trim();
      if (c) set.add(c);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [recipes]);

  const filteredByQuery = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const limit = maxPrep ? Number(maxPrep) : null;
    return recipes.filter((r) => {
      if (q) {
        const haystack = `${r.title} ${r.description ?? ""} ${
          r.cuisine ?? ""
        } ${r.ingredients.join(" ")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (cuisineFilter && (r.cuisine ?? "").trim() !== cuisineFilter) {
        return false;
      }
      if (limit !== null) {
        const minutes = r.prep_minutes ?? Infinity;
        if (minutes > limit) return false;
      }
      return true;
    });
  }, [recipes, searchQuery, cuisineFilter, maxPrep]);

  const starredRecipes = useMemo(
    () => filteredByQuery.filter((r) => r.is_starred),
    [filteredByQuery],
  );
  const triedRecipes = useMemo(
    () => filteredByQuery.filter((r) => r.has_tried),
    [filteredByQuery],
  );
  const untriedRecipes = useMemo(
    () => filteredByQuery.filter((r) => !r.has_tried),
    [filteredByQuery],
  );
  const visibleRecipes =
    listTab === "starred"
      ? starredRecipes
      : listTab === "tried"
        ? triedRecipes
        : listTab === "untried"
          ? untriedRecipes
          : filteredByQuery;

  const activeFilterCount =
    (searchQuery.trim() ? 1 : 0) +
    (cuisineFilter ? 1 : 0) +
    (maxPrep ? 1 : 0);

  function resetFilters() {
    setSearchQuery("");
    setCuisineFilter("");
    setMaxPrep("");
  }

  useEffect(() => {
    if (manualState.status === "success" || importState.status === "success") {
      router.refresh();
    }
  }, [manualState.status, importState.status, router]);

  async function previewRecipeUrl(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPreviewing(true);
    setPreview(null);
    setPreviewError("");

    try {
      const response = await fetch("/api/import-recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: recipeUrl }),
      });
      const data = (await response.json()) as {
        recipe?: ImportPreview;
        error?: string;
      };

      if (!response.ok || !data.recipe) {
        setPreviewError(data.error ?? "Could not preview that recipe URL.");
        return;
      }

      setPreview(data.recipe);
    } catch {
      setPreviewError("Could not reach the recipe importer.");
    } finally {
      setIsPreviewing(false);
    }
  }

  return (
    <main className="min-h-screen bg-mise-page text-mise-ink">
      <header className="mise-header">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <Link href="/recipes" className="flex min-w-0 items-center gap-3">
            <div className="grid size-11 place-items-center rounded-md bg-mise-accent text-mise-page">
              <Utensils size={18} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-serif text-2xl tracking-tight text-mise-ink sm:text-3xl">
                Mise
              </h1>
              <p className="truncate text-[10px] font-semibold uppercase text-mise-muted" style={{ letterSpacing: "0.2em" }}>
                Cookbook · {primaryEmail ?? "Signed in"}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/pantry"
              className="mise-btn-secondary py-2 pl-3 pr-4 text-sm"
            >
              <Boxes size={16} aria-hidden="true" />
              Pantry
            </Link>
            <Link
              href="/grocery"
              className="mise-btn-secondary py-2 pl-3 pr-4 text-sm"
            >
              <ShoppingBasket size={16} aria-hidden="true" />
              Grocery
            </Link>
            <Link
              href="/discover"
              className="mise-btn-secondary py-2 pl-3 pr-4 text-sm"
            >
              <Compass size={16} aria-hidden="true" />
              Discover
            </Link>
            <UserButton />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-10 lg:px-8">
        <aside className="space-y-6">
          {recipesMissingTable || recipesErrorMessage ? (
            <section className="rounded-2xl border border-mise-warm/25 bg-mise-warn-bg p-4 text-sm text-mise-warn-text">
              {recipesMissingTable
                ? "Run supabase/schema.sql before saving recipes."
                : recipesErrorMessage}
            </section>
          ) : null}

          <section className="mise-card overflow-hidden rounded-2xl">
            <div className="flex items-center gap-2 border-b border-mise-border px-5 py-4">
              <Import size={17} className="text-mise-accent" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-mise-ink">
                Import from URL
              </h2>
            </div>
            <form onSubmit={previewRecipeUrl} className="space-y-4 p-5">
              <label className="mise-label">
                Recipe URL
                <input
                  type="url"
                  required
                  value={recipeUrl}
                  onChange={(event) => setRecipeUrl(event.target.value)}
                  className="mise-input"
                  placeholder="https://…"
                />
              </label>
              <button
                type="submit"
                disabled={isPreviewing || recipesMissingTable}
                className="mise-btn-secondary w-full"
              >
                {isPreviewing ? (
                  <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                ) : (
                  <Import size={16} aria-hidden="true" />
                )}
                Preview
              </button>
              {previewError ? (
                <p className="rounded-xl bg-mise-danger-bg px-3 py-2 text-sm text-mise-danger">
                  {previewError}
                </p>
              ) : null}
            </form>

            <form action={importAction} className="space-y-4 border-t border-mise-border p-5">
              <input name="recipeUrl" type="hidden" value={recipeUrl} />
              {preview ? (
                <div className="rounded-xl border border-mise-border bg-mise-surface-soft p-4">
                  {preview.imageUrl ? (
                    <div
                      className="mb-3 aspect-[4/3] rounded-lg bg-cover bg-center"
                      style={{ backgroundImage: `url(${preview.imageUrl})` }}
                      role="img"
                      aria-label={preview.title}
                    />
                  ) : null}
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-mise-accent">
                    Ready to save
                  </p>
                  <h3 className="mt-1 font-serif text-lg text-mise-ink">
                    {preview.title}
                  </h3>
                  <p className="mt-2 text-xs text-mise-muted">
                    {preview.ingredients.length} ingredients ·{" "}
                    {preview.instructions.length} steps
                  </p>
                </div>
              ) : null}
              <button
                type="submit"
                disabled={isImporting || recipesMissingTable || !preview}
                className="mise-btn-primary w-full"
              >
                {isImporting ? (
                  <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                ) : (
                  <Import size={16} aria-hidden="true" />
                )}
                Save import
              </button>
              <ActionMessage state={importState} />
            </form>
          </section>

          <section className="mise-card overflow-hidden rounded-2xl">
            <div className="flex items-center gap-2 border-b border-mise-border px-5 py-4">
              <Plus size={17} className="text-mise-warm" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-mise-ink">Add manually</h2>
            </div>
            <form action={manualAction} className="space-y-4 p-5">
              <label className="mise-label">
                Title
                <input
                  name="title"
                  required
                  className="mise-input"
                  placeholder="Lemon rice bowls"
                />
              </label>
              <label className="mise-label">
                Short note
                <input
                  name="description"
                  className="mise-input"
                  placeholder="Fast, bright, pantry friendly"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="mise-label">
                  Cuisine
                  <input
                    name="cuisine"
                    className="mise-input"
                    placeholder="Italian"
                  />
                </label>
                <label className="mise-label">
                  Minutes
                  <input
                    name="prepMinutes"
                    type="number"
                    min="1"
                    className="mise-input"
                    placeholder="25"
                  />
                </label>
              </div>
              <label className="mise-label">
                Image URL
                <input
                  name="imageUrl"
                  type="url"
                  className="mise-input"
                  placeholder="https://…"
                />
              </label>
              <label className="mise-label">
                Ingredients
                <textarea
                  name="ingredients"
                  required
                  className="mise-textarea h-28"
                  placeholder={"1 cup rice\n2 eggs\n1 lemon"}
                />
              </label>
              <label className="mise-label">
                Instructions
                <textarea
                  name="instructions"
                  required
                  className="mise-textarea h-32"
                  placeholder={
                    "Saute garlic until fragrant.\nSimmer sauce until reduced."
                  }
                />
              </label>
              <label className="mise-label">
                Notes
                <textarea
                  name="notes"
                  className="mise-textarea h-24"
                  placeholder="Adjustments for next time"
                />
              </label>
              <button
                type="submit"
                disabled={isSavingManual || recipesMissingTable}
                className="mise-btn-warm w-full"
              >
                {isSavingManual ? (
                  <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                ) : (
                  <Plus size={16} aria-hidden="true" />
                )}
                Save recipe
              </button>
              <ActionMessage state={manualState} />
            </form>
          </section>
        </aside>

        <section className="mise-card min-h-[min(70vh,560px)] overflow-hidden rounded-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mise-border px-6 py-5">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-mise-accent" aria-hidden="true" />
              <h2 className="font-serif text-lg text-mise-ink">Your cookbook</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {recipes.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setFiltersOpen((o) => !o)}
                  aria-expanded={filtersOpen}
                  aria-controls="cookbook-filters"
                  className={`mise-btn-secondary py-2 pl-3 pr-3 text-sm ${
                    activeFilterCount > 0
                      ? "border-mise-accent/40 bg-mise-chip text-mise-chip-text"
                      : ""
                  }`}
                >
                  <Filter size={16} aria-hidden="true" />
                  Filters
                  {activeFilterCount > 0 ? (
                    <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-mise-accent px-1.5 text-[10px] font-semibold text-white">
                      {activeFilterCount}
                    </span>
                  ) : null}
                </button>
              ) : null}
              {recipes.length > 0 ? (
                <div
                  role="tablist"
                  aria-label="Filter recipes"
                  className="flex divide-x divide-mise-border rounded-md border border-mise-border bg-mise-surface"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={listTab === "all"}
                    onClick={() => setListTab("all")}
                    className={`px-3 py-2 text-[11px] font-semibold uppercase transition sm:text-xs ${
                      listTab === "all"
                        ? "bg-mise-accent/10 text-mise-accent"
                        : "text-mise-muted hover:text-mise-ink"
                    }`}
                  >
                    All ({recipes.length})
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={listTab === "starred"}
                    onClick={() => setListTab("starred")}
                    className={`px-3 py-2 text-[11px] font-semibold uppercase transition sm:text-xs ${
                      listTab === "starred"
                        ? "bg-mise-accent/10 text-mise-accent"
                        : "text-mise-muted hover:text-mise-ink"
                    }`}
                  >
                    Favorites ({starredRecipes.length})
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={listTab === "tried"}
                    onClick={() => setListTab("tried")}
                    className={`px-3 py-2 text-[11px] font-semibold uppercase transition sm:text-xs ${
                      listTab === "tried"
                        ? "bg-mise-accent/10 text-mise-accent"
                        : "text-mise-muted hover:text-mise-ink"
                    }`}
                  >
                    Tried ({triedRecipes.length})
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={listTab === "untried"}
                    onClick={() => setListTab("untried")}
                    className={`px-3 py-2 text-[11px] font-semibold uppercase transition sm:text-xs ${
                      listTab === "untried"
                        ? "bg-mise-accent/10 text-mise-accent"
                        : "text-mise-muted hover:text-mise-ink"
                    }`}
                  >
                    To try ({untriedRecipes.length})
                  </button>
                </div>
              ) : null}
              <Link
                href="/discover"
                className="mise-btn-secondary text-sm"
              >
                <Search size={16} aria-hidden="true" />
                Discover
              </Link>
            </div>
          </div>

          {filtersOpen && recipes.length > 0 ? (
            <div
              id="cookbook-filters"
              className="border-b border-mise-border bg-mise-surface-soft/70 px-6 py-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-mise-ink">
                  Filter your cookbook
                </h3>
                <div className="flex items-center gap-2">
                  {activeFilterCount > 0 ? (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="text-xs font-medium text-mise-accent hover:text-mise-accent-hover"
                    >
                      Reset
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setFiltersOpen(false)}
                    className="grid size-8 place-items-center rounded-full text-mise-muted hover:text-mise-ink"
                    aria-label="Close filters"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="mise-label normal-case">
                  Search
                  <div className="relative">
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="mise-input pl-8"
                      placeholder="Title, cuisine, ingredient…"
                    />
                    <Search
                      size={14}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-mise-muted"
                    />
                  </div>
                </label>
                <label className="mise-label normal-case">
                  Cuisine
                  <select
                    value={cuisineFilter}
                    onChange={(e) => setCuisineFilter(e.target.value)}
                    className="mise-input"
                  >
                    <option value="">Any</option>
                    {cuisineOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="mise-label normal-case">
                  Max time
                  <select
                    value={maxPrep}
                    onChange={(e) =>
                      setMaxPrep(e.target.value as typeof maxPrep)
                    }
                    className="mise-input"
                  >
                    <option value="">Any</option>
                    <option value="15">15 min or less</option>
                    <option value="30">30 min or less</option>
                    <option value="45">45 min or less</option>
                    <option value="60">1 hr or less</option>
                  </select>
                </label>
              </div>
              <p
                className="mt-3 text-xs text-mise-muted tabular-nums"
                aria-live="polite"
              >
                {visibleRecipes.length} of {recipes.length} recipes
              </p>
            </div>
          ) : null}

          {recipes.length === 0 ? (
            <div className="grid min-h-[400px] place-items-center p-10 text-center">
              <div className="max-w-sm">
                <BookOpen
                  className="mx-auto text-mise-muted/50"
                  size={40}
                  aria-hidden="true"
                />
                <h3 className="mt-5 font-serif text-2xl text-mise-ink">
                  No recipes yet
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-mise-muted">
                  Import a URL, add one manually, or browse Discover to start
                  your cookbook.
                </p>
              </div>
            </div>
          ) : visibleRecipes.length === 0 ? (
            <div className="grid min-h-[320px] place-items-center p-10 text-center">
              <div className="max-w-sm">
                <BookOpen
                  className="mx-auto text-mise-muted/50"
                  size={40}
                  aria-hidden="true"
                />
                <h3 className="mt-5 font-serif text-2xl text-mise-ink">
                  {activeFilterCount > 0
                    ? "Nothing matches those filters"
                    : listTab === "starred"
                      ? "No favorites yet"
                      : listTab === "tried"
                        ? "Nothing marked tried yet"
                        : "Nothing left to try"}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-mise-muted">
                  {activeFilterCount > 0
                    ? "Loosen your search, cuisine, or max-time filters to see more."
                    : listTab === "starred"
                      ? "Star recipes from a recipe page to keep them pinned here."
                      : listTab === "tried"
                        ? "Open a recipe and tap “Mark as tried” after you’ve cooked it."
                        : "You’ve marked every recipe as tried — nice work."}
                </p>
                {activeFilterCount > 0 ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mise-btn-secondary mt-4 text-sm"
                  >
                    Reset filters
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {visibleRecipes.map((recipe) => (
                <RecipeCookbookCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
