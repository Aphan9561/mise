import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";

export function createAdminSupabaseClient() {
  return createClient(serverEnv.supabaseUrl, serverEnv.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
