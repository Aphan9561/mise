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
      <header className="border-b border-[#e8ebe8] bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-1 justify-start">
            <Link
              href="/recipes"
              className="text-sm font-medium text-[#59635f] transition hover:text-[#173f3b]"
            >
              ← My recipes
            </Link>
          </div>
          <p className="font-[family:var(--font-fraunces)] text-lg text-[#173f3b] sm:text-xl">
            Discover
          </p>
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
