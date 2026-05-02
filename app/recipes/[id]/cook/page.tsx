import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getUserRecipe } from "@/lib/supabase/recipes";
import { CookModeClient } from "@/app/recipes/[id]/cook/cook-mode-client";

type CookPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CookPage({ params }: CookPageProps) {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const { id } = await params;
  const recipe = await getUserRecipe(userId, id);

  if (!recipe) {
    notFound();
  }

  return <CookModeClient recipe={recipe} />;
}
