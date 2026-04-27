import { auth, currentUser } from "@clerk/nextjs/server";
import { listUserRecipes } from "@/lib/supabase/recipes";
import { RecipesPageClient } from "@/app/recipes/recipes-page-client";

export default async function RecipesPage() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await currentUser();
  const primaryEmail = user?.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId,
  );
  const recipesResult = await listUserRecipes(userId);

  return (
    <RecipesPageClient
      recipes={recipesResult.recipes}
      primaryEmail={primaryEmail?.emailAddress ?? null}
      recipesMissingTable={recipesResult.missingTable}
      recipesErrorMessage={recipesResult.errorMessage}
    />
  );
}
