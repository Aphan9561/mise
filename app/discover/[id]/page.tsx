import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { getDiscoveryRecipeDetail } from "@/lib/cooking/themealdb";
import { DiscoverRecipeDetail } from "@/app/discover/[id]/discover-recipe-detail";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function DiscoverRecipePage({ params }: Props) {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const recipe = await getDiscoveryRecipeDetail(decodedId);

  if (!recipe) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-mise-page text-mise-ink">
      <header className="mise-header">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <Link
            href="/discover"
            className="mise-btn-ghost rounded-full text-sm"
          >
            ← Discover
          </Link>
          <Link
            href="/recipes"
            className="inline-flex items-center gap-2 rounded-full bg-mise-chip px-4 py-2 text-sm font-semibold text-mise-chip-text"
          >
            My recipes
          </Link>
        </div>
      </header>
      <DiscoverRecipeDetail recipe={recipe} />
    </main>
  );
}
