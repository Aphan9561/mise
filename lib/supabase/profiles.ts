import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type UserProfile = {
  id: string;
  clerk_user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

type UpsertProfileInput = {
  clerkUserId: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
};

export async function upsertUserProfile({
  clerkUserId,
  email,
  fullName,
  avatarUrl,
}: UpsertProfileInput) {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        clerk_user_id: clerkUserId,
        email,
        full_name: fullName,
        avatar_url: avatarUrl,
      },
      { onConflict: "clerk_user_id" },
    )
    .select()
    .single<UserProfile>();

  if (error) {
    throw error;
  }

  return data;
}
