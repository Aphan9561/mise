import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Utensils } from "lucide-react";
import {
  getDiscoveryPageInitialData,
  listTheMealDbAreas,
  listTheMealDbCategories,
} from "@/lib/cooking/themealdb";
import { DiscoverClient } from "@/app/discover/discover-client";
import { SectionNav } from "@/app/components/section-nav";

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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <Link href="/recipes" className="flex min-w-0 items-center gap-3">
            <div className="grid size-11 place-items-center rounded-md bg-mise-accent text-mise-page">
              <Utensils size={18} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-serif text-2xl tracking-tight text-mise-ink sm:text-3xl">
                Discover
              </h1>
              <p
                className="truncate text-[10px] font-semibold uppercase text-mise-muted"
                style={{ letterSpacing: "0.2em" }}
              >
                TheMealDB · Browse new recipes
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <SectionNav />
            <UserButton />
          </div>
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
