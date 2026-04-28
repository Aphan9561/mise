# Mise

Cooking app starter built with Next.js, Tailwind CSS, Clerk, and Supabase.

## Getting Started

Install dependencies if needed, then run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

The repo includes:

- `.env.local` for local development placeholders
- `.env.local.example` as a tracked template you can reuse in other environments

Fill in the Clerk and Supabase values before wiring up auth or database calls.
Add `GEMINI_API_KEY` or `ANTHROPIC_API_KEY` for AI cooking help. Recipe
discovery uses [TheMealDB](https://www.themealdb.com/api.php) (no key). If the
API is unreachable, the app falls back to local sample recipes.

## Clerk + Supabase

This repo uses:

- Clerk for authentication
- Supabase for application data
- `clerk_user_id` as the identity key stored in the database
- Gemini or Claude-compatible API calls for technique explanations, URL import,
  and chat
- TheMealDB for recipe discovery

The protected recipe pages store personal recipes in the `recipes` table. URL
imports first look for structured recipe data on the page, including recipe
photos when available, then fall back to the configured AI provider when needed.
Create or update the tables by running the SQL in `supabase/schema.sql`.

## Stack

- Next.js App Router
- Tailwind CSS v4
- Clerk env scaffolding
- Supabase env scaffolding

## Structure

- `app/page.tsx` contains the cooking-themed landing page
- `app/recipes/page.tsx` lists saved recipes and contains manual/URL add flows
- `app/recipes/[id]/page.tsx` contains the individual recipe cook view and
  assistant button, plus edit, notes, and delete flows for saved recipes
- `app/discover/page.tsx` lists TheMealDB results with a filter sidebar (category,
  area, main ingredient, or dish name)
- `app/discover/[id]/page.tsx` is the full read-only recipe view for a discovered meal
- `app/api/*` contains the technique help, assistant, and discovery endpoints
- `app/layout.tsx` defines app metadata and typography
- `app/globals.css` holds the global theme tokens and base styles
- `lib/supabase/*` contains the Supabase connection helpers

## Next Steps

1. Run `supabase/schema.sql` in Supabase.
2. Add real Gemini/Anthropic API keys to `.env.local` if you want live AI
   responses (discovery does not require extra keys).
3. Extend the `recipes` table into favorites, grocery lists, and photo journal entries.
