import Link from "next/link";
import { notFound } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Utensils } from "lucide-react";
import { SectionNav } from "@/app/components/section-nav";
import { RecipeDetailClient } from "@/app/recipes/[id]/recipe-detail-client";
import { summarizePantryCoverage } from "@/lib/cooking/pantry-match";
import { listPantryItems } from "@/lib/supabase/pantry";
import { getUserRecipe } from "@/lib/supabase/recipes";

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

  const user = await currentUser();
  const primaryEmail = user?.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId,
  );

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
                Cookbook · {primaryEmail?.emailAddress ?? "Signed in"}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <SectionNav />
            <UserButton />
          </div>
        </div>
      </header>
      <RecipeDetailClient recipe={recipe} pantryCoverage={pantryCoverage} />
    </main>
  );
}
