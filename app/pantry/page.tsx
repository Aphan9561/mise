import { auth, currentUser } from "@clerk/nextjs/server";
import { listPantryItems } from "@/lib/supabase/pantry";
import { PantryPageClient } from "@/app/pantry/pantry-page-client";

export default async function PantryPage() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await currentUser();
  const primaryEmail = user?.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId,
  );
  const result = await listPantryItems(userId);

  return (
    <PantryPageClient
      items={result.items}
      primaryEmail={primaryEmail?.emailAddress ?? null}
      missingTable={result.missingTable}
      errorMessage={result.errorMessage}
    />
  );
}
