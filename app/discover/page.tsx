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
    <main className="min-h-screen bg-mise-page text-mise-ink">
      <header className="mise-header">
        <div className="mx-auto flex max-w-6xl items-center px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-1 justify-start">
            <Link
              href="/recipes"
              className="text-sm font-medium text-mise-muted transition hover:text-mise-ink"
            >
              ← My recipes
            </Link>
          </div>
          <p className="font-serif text-lg text-mise-ink sm:text-xl">Discover</p>
          <div className="flex-1" aria-hidden="true" />
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
