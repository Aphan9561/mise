"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  BookOpen,
  Clock3,
  Compass,
  Import,
  Loader2,
  Plus,
  Search,
  Utensils,
} from "lucide-react";
import {
  createRecipeAction,
  importRecipeFromUrlAction,
  type RecipeActionState,
} from "@/app/recipes/actions";
import type { UserRecipe } from "@/lib/supabase/recipes";

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
      className={`rounded-md px-3 py-2 text-sm ${
        state.status === "success"
          ? "bg-[#e7f6eb] text-[#27683b]"
          : "bg-[#fde9e5] text-[#8d2f21]"
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
  const [manualState, manualAction, isSavingManual] = useActionState(
    createRecipeAction,
    initialActionState,
  );
  const [importState, importAction, isImporting] = useActionState(
    importRecipeFromUrlAction,
    initialActionState,
  );

  useEffect(() => {
    if (manualState.status === "success" || importState.status === "success") {
      router.refresh();
    }
  }, [manualState.status, importState.status, router]);

  return (
    <main className="min-h-screen bg-[#f6f7f1] text-[#18211f]">
      <header className="border-b border-[#d8ddd4] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/recipes" className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-[#173f3b] text-white">
              <Utensils size={19} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-[family:var(--font-fraunces)] text-2xl text-[#173f3b]">
                Mise Recipes
              </h1>
              <p className="truncate text-sm text-[#66706b]">
                {primaryEmail ?? "Signed in"}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 rounded-md border border-[#cfd8cf] bg-white px-3 py-2 text-sm font-semibold hover:bg-[#f1f5ee]"
            >
              <Compass size={16} aria-hidden="true" />
              Discover
            </Link>
            <UserButton />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="space-y-5">
          {recipesMissingTable || recipesErrorMessage ? (
            <section className="rounded-lg border border-[#f0c6a9] bg-[#fff8ed] p-4 text-sm text-[#7a4a22]">
              {recipesMissingTable
                ? "Run supabase/schema.sql before saving recipes."
                : recipesErrorMessage}
            </section>
          ) : null}

          <section className="rounded-lg border border-[#d8ddd4] bg-white">
            <div className="flex items-center gap-2 border-b border-[#e4e8df] px-4 py-3">
              <Import size={17} aria-hidden="true" />
              <h2 className="font-semibold">Import From URL</h2>
            </div>
            <form action={importAction} className="space-y-3 p-4">
              <label className="block text-sm font-medium">
                Recipe URL
                <input
                  name="recipeUrl"
                  type="url"
                  required
                  className="mt-1 w-full rounded-md border border-[#cfd8cf] bg-white px-3 py-2 text-sm outline-none focus:border-[#16806f]"
                  placeholder="https://example.com/recipe"
                />
              </label>
              <button
                type="submit"
                disabled={isImporting || recipesMissingTable}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#173f3b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#245c56] disabled:cursor-not-allowed disabled:bg-[#aab3ad]"
              >
                {isImporting ? (
                  <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                ) : (
                  <Import size={16} aria-hidden="true" />
                )}
                Import recipe
              </button>
              <ActionMessage state={importState} />
            </form>
          </section>

          <section className="rounded-lg border border-[#d8ddd4] bg-white">
            <div className="flex items-center gap-2 border-b border-[#e4e8df] px-4 py-3">
              <Plus size={17} aria-hidden="true" />
              <h2 className="font-semibold">Add Manually</h2>
            </div>
            <form action={manualAction} className="space-y-3 p-4">
              <label className="block text-sm font-medium">
                Title
                <input
                  name="title"
                  required
                  className="mt-1 w-full rounded-md border border-[#cfd8cf] bg-white px-3 py-2 text-sm outline-none focus:border-[#16806f]"
                  placeholder="Lemon rice bowls"
                />
              </label>
              <label className="block text-sm font-medium">
                Short note
                <input
                  name="description"
                  className="mt-1 w-full rounded-md border border-[#cfd8cf] bg-white px-3 py-2 text-sm outline-none focus:border-[#16806f]"
                  placeholder="Fast, bright, pantry friendly"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium">
                  Cuisine
                  <input
                    name="cuisine"
                    className="mt-1 w-full rounded-md border border-[#cfd8cf] bg-white px-3 py-2 text-sm outline-none focus:border-[#16806f]"
                    placeholder="Italian"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Minutes
                  <input
                    name="prepMinutes"
                    type="number"
                    min="1"
                    className="mt-1 w-full rounded-md border border-[#cfd8cf] bg-white px-3 py-2 text-sm outline-none focus:border-[#16806f]"
                    placeholder="25"
                  />
                </label>
              </div>
              <label className="block text-sm font-medium">
                Ingredients
                <textarea
                  name="ingredients"
                  required
                  className="mt-1 h-28 w-full resize-none rounded-md border border-[#cfd8cf] bg-white px-3 py-2 text-sm outline-none focus:border-[#16806f]"
                  placeholder={"1 cup rice\n2 eggs\n1 lemon"}
                />
              </label>
              <label className="block text-sm font-medium">
                Instructions
                <textarea
                  name="instructions"
                  required
                  className="mt-1 h-32 w-full resize-none rounded-md border border-[#cfd8cf] bg-white px-3 py-2 text-sm outline-none focus:border-[#16806f]"
                  placeholder={"Saute garlic until fragrant.\nSimmer sauce until reduced."}
                />
              </label>
              <button
                type="submit"
                disabled={isSavingManual || recipesMissingTable}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#e85234] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#cf4228] disabled:cursor-not-allowed disabled:bg-[#aab3ad]"
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

        <section className="rounded-lg border border-[#d8ddd4] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e4e8df] px-5 py-4">
            <div className="flex items-center gap-2">
              <BookOpen size={18} aria-hidden="true" />
              <h2 className="font-semibold">Saved Recipes</h2>
            </div>
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 rounded-md bg-[#eef4ff] px-3 py-2 text-sm font-semibold text-[#164376] hover:bg-[#dfeafe]"
            >
              <Search size={16} aria-hidden="true" />
              Discover new recipes
            </Link>
          </div>

          {recipes.length === 0 ? (
            <div className="grid min-h-[420px] place-items-center p-8 text-center">
              <div>
                <BookOpen className="mx-auto text-[#8b9690]" size={38} />
                <h3 className="mt-4 font-[family:var(--font-fraunces)] text-3xl text-[#173f3b]">
                  No saved recipes yet
                </h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-[#66706b]">
                  Import a recipe URL, add one manually, or discover something
                  new to start your cookbook.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
              {recipes.map((recipe) => (
                <Link
                  key={recipe.id}
                  href={`/recipes/${recipe.id}`}
                  className="rounded-lg border border-[#e4e8df] p-4 transition hover:-translate-y-0.5 hover:border-[#16806f] hover:shadow-[0_12px_35px_rgba(28,45,39,0.08)]"
                >
                  <p className="text-xs font-semibold uppercase text-[#16806f]">
                    {recipe.cuisine ?? recipe.source}
                  </p>
                  <h3 className="mt-2 line-clamp-2 font-[family:var(--font-fraunces)] text-2xl text-[#173f3b]">
                    {recipe.title}
                  </h3>
                  {recipe.description ? (
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#59635f]">
                      {recipe.description}
                    </p>
                  ) : null}
                  <div className="mt-4 flex items-center justify-between text-sm text-[#66706b]">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 size={15} aria-hidden="true" />
                      {recipe.prep_minutes ?? 30} min
                    </span>
                    <span>{recipe.ingredients.length} ingredients</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
