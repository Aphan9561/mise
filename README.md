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

Tracked template: [.env.local.example](.env.local.example). Copy it to `.env.local` for local development.

Values you need:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase project URL and anon publishable key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key used by Next.js routes and Server Actions (`lib/supabase/admin.ts`). **Never expose to the client.** |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Clerk authentication. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Redirect URLs for Clerk (defaults in the template work with this repo’s `/sign-in` and `/sign-up` pages). |
| `ANTHROPIC_API_KEY` *or* `GEMINI_API_KEY` | Technique explanations and the in-app assistant. Omit both to run without live AI (local fallbacks still apply). |

Discovery uses [TheMealDB](https://www.themealdb.com/api.php) (no key). If their API or your network drops, Discover falls back to bundled sample recipes.

## Database setup (Supabase)

1. Create a Supabase project and paste the matching URL and keys into `.env.local`.

2. In the SQL editor (**or** with the Supabase CLI), run **`supabase/schema.sql`** against your database whenever you bootstrap or update the schema.

Important tables included in `schema.sql`:

- `profiles` — optional user profile synced with Clerk (`clerk_user_id`).
- `recipes` — personal cookbook (`is_starred` for favorites, `has_tried` for the “Tried” tag, ingredients/instructions arrays, URLs, notes).
- `pantry_items` — what you already have at home.
- `grocery_items` — shopping list linked optionally to `recipes`; checking an item moves it into the pantry.

Re-run the file after pulls that add migrations (for example when new `alter table … add column` blocks appear).

## Clerk + Supabase wiring

This repo stores data keyed by Clerk’s `userId` (`clerk_user_id` columns). Profiles and CRUD helpers live under `lib/supabase/`.

## Feature map

- **`/recipes`** — cookbook, favorites filter, manual add, URL import, star-on-card.
- **`/recipes/[id]`** — magazine-style recipe view, pantry match banner, grocery preview, Ask Mise, cook mode entry.
- **`/recipes/[id]/cook`** — large-step cook flow, wake lock, assistant, technique taps.
- **`/discover`** — TheMealDB search with skeleton loading and clearer network errors.
- **`/discover/[id]`** — read-only detail with pantry match banner and technique taps.
- **`/pantry`**, **`/grocery`** — inventory loop (grocery duplicates are suppressed; checking off sends items to pantry when not already matched).

## Stack

- Next.js App Router
- Tailwind CSS v4
- Clerk
- Supabase (service-role server access)

## Structure

- `app/page.tsx` — landing page
- `app/recipes/page.tsx` — cookbook list + add/import
- `app/recipes/[id]/page.tsx` — recipe detail, edit, pantry match, grocery, assistant
- `app/recipes/[id]/cook/` — step-by-step mode
- `app/discover/` — Discover grid and meal detail from TheMealDB
- `app/pantry/`, `app/grocery/` — pantry and shopping list
- `app/api/*` — technique, assistant, discovery, imports
- `lib/supabase/*` — typed data access
- `lib/cooking/*` — importing, pantry matching, TheMealDB client
- `app/globals.css` — theme tokens and shared `.mise-*` components

## Next steps checklist

1. Run `supabase/schema.sql` in Supabase whenever the schema changes.
2. Confirm `.env.local` has Clerk and Supabase values.
3. Add at least one of `GEMINI_API_KEY` or `ANTHROPIC_API_KEY` if you want live assistant and technique replies.
