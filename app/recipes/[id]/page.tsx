import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
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
  const recipe = await getUserRecipe(userId, id);

  if (!recipe) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-mise-page text-mise-ink">
      <header className="mise-header">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <Link href="/recipes" className="mise-btn-ghost rounded-full text-sm">
            ← Cookbook
          </Link>
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 rounded-full bg-mise-chip px-4 py-2 text-sm font-semibold text-mise-chip-text"
          >
            Discover
          </Link>
        </div>
      </header>
      <RecipeDetailClient recipe={recipe} />
    </main>
  );
}
