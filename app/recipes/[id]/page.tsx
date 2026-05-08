import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { summarizePantryCoverage } from "@/lib/cooking/pantry-match";
import { listPantryItems } from "@/lib/supabase/pantry";
import { getUserRecipe } from "@/lib/supabase/recipes";
import { RecipeDetailClient } from "@/app/recipes/[id]/recipe-detail-client";

type RecipePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RecipePage({ params }: RecipePageProps) {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const { id } = await params;
  const [recipe, pantryResult] = await Promise.all([
    getUserRecipe(userId, id),
    listPantryItems(userId),
  ]);

  if (!recipe) {
    notFound();
  }

  const pantryCoverage = summarizePantryCoverage(
    recipe.ingredients,
    pantryResult.items,
  );

  return (
    <main className="min-h-screen bg-mise-page text-mise-ink">
      <header className="mise-header">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <Link href="/recipes" className="mise-btn-ghost rounded-full text-sm">
            ← Cookbook
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/pantry"
              className="mise-btn-secondary py-2 pl-3 pr-4 text-sm"
            >
              Pantry
            </Link>
            <Link
              href="/grocery"
              className="mise-btn-secondary py-2 pl-3 pr-4 text-sm"
            >
              Grocery
            </Link>
            <Link
              href="/discover"
              className="mise-btn-secondary text-sm"
            >
              Discover
            </Link>
          </div>
        </div>
      </header>
      <RecipeDetailClient recipe={recipe} pantryCoverage={pantryCoverage} />
    </main>
  );
}
