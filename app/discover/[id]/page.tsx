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
    <main className="min-h-screen bg-[#f6f7f1] text-[#18211f]">
      <header className="border-b border-[#d8ddd4] bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/discover"
            className="rounded-md border border-[#cfd8cf] bg-white px-3 py-2 text-sm font-semibold hover:bg-[#f1f5ee]"
          >
            Back to discover
          </Link>
          <Link
            href="/recipes"
            className="text-sm font-semibold text-[#16806f] hover:text-[#0d6b5e]"
          >
            My recipes
          </Link>
        </div>
      </header>
      <DiscoverRecipeDetail recipe={recipe} />
    </main>
  );
}
