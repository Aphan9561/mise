import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

export function createBrowserSupabaseClient() {
  return createClient(
    publicEnv.supabaseUrl,
    publicEnv.supabasePublishableKey,
  );
}
