import Link from "next/link";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

const highlights = [
  "Seasonal recipe boards",
  "Weekly meal planning",
  "Pantry-first cooking ideas",
];

const featuredRecipes = [
  {
    name: "Charred Tomato Bucatini",
    time: "25 min",
    note: "Silky roasted tomatoes, basil oil, toasted breadcrumbs.",
  },
  {
    name: "Miso Honey Salmon Bowl",
    time: "30 min",
    note: "Sticky glaze, jasmine rice, quick-pickled cucumbers.",
  },
  {
    name: "Crispy Gnocchi Skillet",
    time: "20 min",
    note: "Brown butter, lemon kale, ricotta clouds.",
  },
];

const pantryIdeas = [
  "Turn pantry leftovers into recipe suggestions.",
  "Save staples and track what needs restocking.",
  "Build a personal cookbook around weeknight favorites.",
];

export default function Home() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden mise-hero-gradient">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-20 px-6 pb-20 pt-10 sm:px-10 lg:px-12">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-[family:var(--font-fraunces)] text-xs font-semibold uppercase tracking-[0.28em] text-mise-accent">
              Mise
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-mise-muted">
              Recipes, discovery, and a calm kitchen workflow in one place.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Show when="signed-out">
              <SignInButton mode="redirect">
                <button className="mise-btn-secondary rounded-full px-5">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="redirect">
                <button className="mise-btn-primary rounded-full px-5">
                  Sign up
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link
                href="/recipes"
                className="mise-btn-secondary rounded-full px-5"
              >
                My recipes
              </Link>
              <UserButton />
            </Show>
          </div>
        </header>

        <div className="grid items-center gap-12 lg:grid-cols-[1.12fr_0.88fr]">
          <div>
            <p className="inline-flex rounded-full border border-mise-border bg-mise-surface/80 px-4 py-2 text-sm font-medium text-mise-muted shadow-sm backdrop-blur">
              Next.js · Tailwind · Clerk · Supabase
            </p>
            <h1 className="mt-6 max-w-3xl font-serif text-5xl leading-[1.02] tracking-tight text-mise-ink sm:text-6xl lg:text-7xl">
              Plan meals with intention. Cook from what you already have.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mise-muted">
              Save recipes, browse discovery, and get technique help without
              leaving the flow of cooking.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Show when="signed-out">
                <SignUpButton mode="redirect">
                  <button className="mise-btn-primary rounded-full px-8 py-3">
                    Create your cookbook
                  </button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <Link
                  href="/recipes"
                  className="mise-btn-primary rounded-full px-8 py-3"
                >
                  Open your recipes
                </Link>
              </Show>
              <Link
                href="#stack"
                className="mise-btn-secondary rounded-full px-8 py-3"
              >
                Explore the stack
              </Link>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="mise-card rounded-2xl border-mise-border/80 bg-mise-surface/90 p-5 backdrop-blur-sm"
                >
                  <p className="text-sm font-semibold leading-snug text-mise-ink">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl border border-mise-border bg-mise-surface p-5 shadow-[var(--shadow-mise-float)]">
              <div className="rounded-2xl bg-mise-forest p-7 text-mise-surface-soft">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                  Tonight&apos;s flow
                </p>
                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-sm">
                    <p className="text-sm text-white/75">Recommended dinner</p>
                    <p className="mt-2 font-serif text-3xl text-white">
                      Lemon Herb Roast Chicken
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-white/80">
                      Pair with blistered green beans and crispy potatoes for a
                      balanced 45-minute meal plan.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-mise-surface-soft/95 p-4 text-mise-ink">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-mise-warm">
                        Prep window
                      </p>
                      <p className="mt-2 text-2xl font-semibold">18 min</p>
                    </div>
                    <div className="rounded-2xl bg-mise-accent p-4 text-white">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80">
                        Pantry match
                      </p>
                      <p className="mt-2 text-2xl font-semibold">82%</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-mise-border bg-mise-surface-soft p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-mise-ink">
                      Shopping sync
                    </p>
                    <p className="text-sm text-mise-muted">
                      Remaining ingredients for the week
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-mise-warn-bg px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-mise-warm">
                    Fresh
                  </span>
                </div>
                <div className="mt-5 space-y-2">
                  {["Fennel", "Greek yogurt", "Flat-leaf parsley"].map(
                    (ingredient) => (
                      <div
                        key={ingredient}
                        className="flex items-center justify-between rounded-xl border border-mise-border/60 bg-mise-surface px-4 py-3"
                      >
                        <span className="text-sm font-medium text-mise-ink">
                          {ingredient}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-mise-muted">
                          Add
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="recipes"
        className="border-y border-mise-border bg-mise-surface-soft/80 py-20"
      >
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 sm:px-10 lg:grid-cols-[0.72fr_1.28fr] lg:px-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-mise-warm">
              Featured recipes
            </p>
            <h2 className="mt-4 font-serif text-4xl text-mise-ink">
              A warm, editorial feel—built for real kitchens.
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-mise-muted">
              Typography and color stay soft and readable so the food—not the
              interface—stays center stage.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {featuredRecipes.map((recipe, index) => (
              <article
                key={recipe.name}
                className="group mise-card flex flex-col rounded-2xl border-mise-border p-5 transition hover:-translate-y-1 hover:shadow-[var(--shadow-mise-float)]"
              >
                <div className="flex h-40 items-end rounded-xl bg-[linear-gradient(135deg,#e2c49a_0%,#c2573d_42%,#2a6b52_100%)] p-4">
                  <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-mise-warm">
                    0{index + 1}
                  </span>
                </div>
                <div className="mt-5 flex items-start justify-between gap-2">
                  <h3 className="font-serif text-xl text-mise-ink">
                    {recipe.name}
                  </h3>
                  <span className="shrink-0 text-sm font-semibold text-mise-accent">
                    {recipe.time}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-mise-muted">
                  {recipe.note}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="stack"
        className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-20 sm:px-10 lg:grid-cols-2 lg:px-12"
      >
        <div className="rounded-3xl border border-mise-border bg-mise-surface-soft p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-mise-warm">
            Pantry-first UX
          </p>
          <h2 className="mt-4 font-serif text-4xl text-mise-ink">
            Built to grow into lists, journals, and shared kitchens.
          </h2>
          <div className="mt-8 space-y-3">
            {pantryIdeas.map((idea) => (
              <div
                key={idea}
                className="rounded-2xl border border-mise-border bg-mise-surface px-5 py-4 text-sm leading-relaxed text-mise-muted"
              >
                {idea}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-mise-forest p-10 text-mise-surface-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">
            Stack ready
          </p>
          <h2 className="mt-4 font-serif text-4xl text-white">
            Clerk for auth. Supabase for data. Next.js to tie it together.
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-sm font-semibold text-white">Auth</p>
              <p className="mt-2 text-sm leading-relaxed text-white/75">
                Sessions and sign-in flows with Clerk already wired.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-sm font-semibold text-white">Database</p>
              <p className="mt-2 text-sm leading-relaxed text-white/75">
                Supabase ready for recipes, profiles, and server actions.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
