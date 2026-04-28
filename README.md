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
Add `GEMINI_API_KEY` or `ANTHROPIC_API_KEY` for AI cooking help and
`SPOONACULAR_API_KEY` for live recipe discovery. Without those keys, the app
uses local fallbacks so the core workflow remains usable.

## Clerk + Supabase

This repo uses:

- Clerk for authentication
- Supabase for application data
- `clerk_user_id` as the identity key stored in the database
- Gemini or Claude-compatible API calls for technique explanations, URL import,
  and chat
- Spoonacular recipe search for discovery

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
- `app/discover/page.tsx` contains the Spoonacular-backed discovery page
- `app/api/*` contains the technique help, assistant, and discovery endpoints
- `app/layout.tsx` defines app metadata and typography
- `app/globals.css` holds the global theme tokens and base styles
- `lib/supabase/*` contains the Supabase connection helpers

## Next Steps

1. Run `supabase/schema.sql` in Supabase.
2. Add real Gemini/Anthropic and Spoonacular API keys to `.env.local`.
3. Extend the `recipes` table into favorites, grocery lists, and photo journal entries.
