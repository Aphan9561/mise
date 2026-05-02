import { auth, currentUser } from "@clerk/nextjs/server";
import { listGroceryItems } from "@/lib/supabase/grocery";
import { GroceryPageClient } from "@/app/grocery/grocery-page-client";

export default async function GroceryPage() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await currentUser();
  const primaryEmail = user?.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId,
  );
  const result = await listGroceryItems(userId);

  return (
    <GroceryPageClient
      items={result.items}
      primaryEmail={primaryEmail?.emailAddress ?? null}
      missingTable={result.missingTable}
      errorMessage={result.errorMessage}
    />
  );
}
