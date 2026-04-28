import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import {
  getDiscoveryPageInitialData,
  listTheMealDbAreas,
  listTheMealDbCategories,
} from "@/lib/cooking/themealdb";
import { DiscoverClient } from "@/app/discover/discover-client";

export default async function DiscoverPage() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const [categories, areas, initial] = await Promise.all([
    listTheMealDbCategories(),
    listTheMealDbAreas(),
    getDiscoveryPageInitialData(),
  ]);

  return (
    <main className="min-h-screen bg-[#f6f7f1] text-[#18211f]">
      <header className="border-b border-[#d8ddd4] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/recipes"
            className="rounded-md border border-[#cfd8cf] bg-white px-3 py-2 text-sm font-semibold hover:bg-[#f1f5ee]"
          >
            Back to recipes
          </Link>
          <h1 className="font-[family:var(--font-fraunces)] text-2xl text-[#173f3b]">
            Discover New Recipes
          </h1>
        </div>
      </header>
      <DiscoverClient
        categories={categories}
        areas={areas}
        initialRecipes={initial.recipes}
        initialSource={initial.source}
      />
    </main>
  );
}
