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
    <main className="min-h-screen bg-[#f6f7f1] text-[#18211f]">
      <header className="border-b border-[#d8ddd4] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/recipes"
            className="rounded-md border border-[#cfd8cf] bg-white px-3 py-2 text-sm font-semibold hover:bg-[#f1f5ee]"
          >
            Back to recipes
          </Link>
          <Link
            href="/discover"
            className="rounded-md bg-[#eef4ff] px-3 py-2 text-sm font-semibold text-[#164376] hover:bg-[#dfeafe]"
          >
            Discover new recipes
          </Link>
        </div>
      </header>
      <RecipeDetailClient recipe={recipe} />
    </main>
  );
}
