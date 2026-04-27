function readEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readPublicSupabaseKey() {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }

  return key;
}

export const publicEnv = {
  supabaseUrl: readEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabasePublishableKey: readPublicSupabaseKey(),
};

export const serverEnv = {
  supabaseUrl: publicEnv.supabaseUrl,
  supabaseServiceRoleKey: readEnv("SUPABASE_SERVICE_ROLE_KEY"),
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-3-flash-preview",
  spoonacularApiKey: process.env.SPOONACULAR_API_KEY,
};
