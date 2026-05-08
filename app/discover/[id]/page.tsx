import Link from "next/link";
import { notFound } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Utensils } from "lucide-react";
import { DiscoverRecipeDetail } from "@/app/discover/[id]/discover-recipe-detail";
import { SectionNav } from "@/app/components/section-nav";
import { summarizePantryCoverage } from "@/lib/cooking/pantry-match";
import { getDiscoveryRecipeDetail } from "@/lib/cooking/themealdb";
import { listPantryItems } from "@/lib/supabase/pantry";

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
  const [recipe, pantryResult] = await Promise.all([
    getDiscoveryRecipeDetail(decodedId),
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
          <Link href="/recipes" className="flex min-w-0 items-center gap-3">
            <div className="grid size-11 place-items-center rounded-md bg-mise-accent text-mise-page">
              <Utensils size={18} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-serif text-2xl tracking-tight text-mise-ink sm:text-3xl">
                Mise
              </h1>
              <p
                className="truncate text-[10px] font-semibold uppercase text-mise-muted"
                style={{ letterSpacing: "0.2em" }}
              >
                Discover · {recipe.title}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <SectionNav />
            <UserButton />
          </div>
        </div>
      </header>
      <DiscoverRecipeDetail recipe={recipe} pantryCoverage={pantryCoverage} />
    </main>
  );
}
