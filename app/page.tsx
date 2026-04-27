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
    <main className="relative isolate overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_top,rgba(255,214,153,0.85),transparent_55%),linear-gradient(180deg,#fff8ef_0%,#f5eadb_100%)]" />
      <div className="absolute right-[-6rem] top-24 -z-10 h-72 w-72 rounded-full bg-[#d96c3c]/15 blur-3xl" />
      <div className="absolute left-[-4rem] top-[28rem] -z-10 h-64 w-64 rounded-full bg-[#6f8f56]/15 blur-3xl" />

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-6 pb-16 pt-8 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between">
          <div>
            <p className="font-[family:var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.35em] text-[#a4512d]">
              Mise
            </p>
            <p className="mt-2 max-w-sm text-sm text-[#755845]">
              Cooking app starter for recipes, meal plans, and pantry-driven
              discovery.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Show when="signed-out">
              <SignInButton mode="redirect">
                <button className="rounded-full border border-[#2d241d]/10 bg-white/70 px-4 py-2 text-sm font-semibold text-[#2d241d] shadow-sm backdrop-blur transition hover:bg-white">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="redirect">
                <button className="rounded-full bg-[#2d241d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#43352b]">
                  Sign up
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link
                href="/recipes"
                className="rounded-full border border-[#2d241d]/10 bg-white/70 px-4 py-2 text-sm font-semibold text-[#2d241d] shadow-sm backdrop-blur transition hover:bg-white"
              >
                My recipes
              </Link>
              <UserButton />
            </Show>
          </div>
        </header>

        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="inline-flex rounded-full border border-[#a4512d]/10 bg-white/80 px-4 py-2 text-sm font-medium text-[#8c4526] shadow-sm backdrop-blur">
              Built with Next.js, Tailwind, Clerk, and Supabase
            </p>
            <h1 className="mt-6 max-w-3xl font-[family:var(--font-fraunces)] text-5xl leading-[0.95] tracking-tight text-[#2c2118] sm:text-6xl lg:text-7xl">
              Plan meals like a chef, cook from your pantry, and keep every
              recipe in reach.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5f4b3f]">
              This starter gives your cooking app a warm editorial feel out of
              the box, with room for auth, saved recipes, grocery planning, and
              user kitchens.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Show when="signed-out">
                <SignUpButton mode="redirect">
                  <button className="inline-flex items-center justify-center rounded-full bg-[#2f6a4a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#27583d]">
                    Create your cookbook
                  </button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <Link
                  href="/recipes"
                  className="inline-flex items-center justify-center rounded-full bg-[#2f6a4a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#27583d]"
                >
                  Open your recipes
                </Link>
              </Show>
              <Link
                href="#stack"
                className="inline-flex items-center justify-center rounded-full border border-[#2d241d]/10 bg-white/70 px-6 py-3 text-sm font-semibold text-[#2d241d] shadow-sm backdrop-blur transition hover:bg-white"
              >
                View app foundation
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="rounded-3xl border border-white/70 bg-white/70 p-4 shadow-[0_20px_60px_rgba(104,67,39,0.08)] backdrop-blur"
                >
                  <p className="text-sm font-semibold text-[#2d241d]">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[2rem] border border-white/80 bg-[#fffaf3] p-5 shadow-[0_30px_120px_rgba(93,58,34,0.16)]">
              <div className="rounded-[1.5rem] bg-[#2d241d] p-6 text-[#f7ecde]">
                <p className="font-[family:var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.35em] text-[#f5c88a]">
                  Tonight&apos;s Flow
                </p>
                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl bg-white/8 p-4">
                    <p className="text-sm text-[#d9c9b6]">Recommended dinner</p>
                    <p className="mt-2 font-[family:var(--font-fraunces)] text-3xl text-white">
                      Lemon Herb Roast Chicken
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[#e7d7c6]">
                      Pair with blistered green beans and crispy potatoes for a
                      balanced 45-minute meal plan.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-[#f5e6d4] p-4 text-[#412e22]">
                      <p className="text-xs uppercase tracking-[0.28em] text-[#99633f]">
                        Prep Window
                      </p>
                      <p className="mt-2 text-2xl font-semibold">18 min</p>
                    </div>
                    <div className="rounded-2xl bg-[#315f46] p-4 text-white">
                      <p className="text-xs uppercase tracking-[0.28em] text-[#dcebd8]">
                        Pantry Match
                      </p>
                      <p className="mt-2 text-2xl font-semibold">82%</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-[#e9d8c5] bg-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#2d241d]">
                      Shopping sync
                    </p>
                    <p className="text-sm text-[#7d6656]">
                      Remaining ingredients for the week
                    </p>
                  </div>
                  <span className="rounded-full bg-[#fff1dd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#9a5f2d]">
                    Fresh
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {["Fennel", "Greek yogurt", "Flat-leaf parsley"].map(
                    (ingredient) => (
                      <div
                        key={ingredient}
                        className="flex items-center justify-between rounded-2xl bg-[#fbf6ef] px-4 py-3"
                      >
                        <span className="text-sm font-medium text-[#3c2e24]">
                          {ingredient}
                        </span>
                        <span className="text-xs uppercase tracking-[0.24em] text-[#8f735f]">
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
        className="border-y border-[#e8dccf] bg-[#fcf8f2] py-16"
      >
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-6 sm:px-10 lg:grid-cols-[0.7fr_1.3fr] lg:px-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#9e5931]">
              Featured Recipes
            </p>
            <h2 className="mt-4 font-[family:var(--font-fraunces)] text-4xl text-[#2c2118]">
              An editorial landing page for a modern kitchen product.
            </h2>
            <p className="mt-4 max-w-md text-base leading-7 text-[#695345]">
              The visual system leans warm, tactile, and ingredient-led instead
              of looking like a generic SaaS dashboard.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {featuredRecipes.map((recipe, index) => (
              <article
                key={recipe.name}
                className="group rounded-[1.75rem] border border-[#eadbca] bg-white p-5 transition hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(111,74,44,0.12)]"
              >
                <div className="flex h-44 items-end rounded-[1.25rem] bg-[linear-gradient(135deg,#e5b274_0%,#d46939_48%,#6f8f56_100%)] p-5">
                  <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#7c4624]">
                    0{index + 1}
                  </span>
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <h3 className="font-[family:var(--font-fraunces)] text-2xl text-[#2f231b]">
                    {recipe.name}
                  </h3>
                  <span className="text-sm font-semibold text-[#9b5d34]">
                    {recipe.time}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#6b5649]">
                  {recipe.note}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="stack"
        className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-16 sm:px-10 lg:grid-cols-2 lg:px-12"
      >
        <div className="rounded-[2rem] bg-[#fff3e2] p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#9b5b2f]">
            Pantry-first UX
          </p>
          <h2 className="mt-4 font-[family:var(--font-fraunces)] text-4xl text-[#2c2118]">
            Built to grow into saved recipes, grocery lists, and user kitchens.
          </h2>
          <div className="mt-6 space-y-4">
            {pantryIdeas.map((idea) => (
              <div
                key={idea}
                className="rounded-2xl border border-[#e5cdb6] bg-white/80 px-4 py-4 text-[#5f4b3f]"
              >
                {idea}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] bg-[#2d241d] p-8 text-[#f7ecde]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#f4c788]">
            Stack Ready
          </p>
          <h2 className="mt-4 font-[family:var(--font-fraunces)] text-4xl text-white">
            Clerk handles auth. Supabase handles your data. Next.js ties it
            together.
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/8 p-4">
              <p className="text-sm font-semibold text-white">Auth</p>
              <p className="mt-2 text-sm leading-6 text-[#decfbc]">
                Email, sessions, and user flows with Clerk environment variables
                already scaffolded.
              </p>
            </div>
            <div className="rounded-2xl bg-white/8 p-4">
              <p className="text-sm font-semibold text-white">Database</p>
              <p className="mt-2 text-sm leading-6 text-[#decfbc]">
                Supabase keys are set up for public reads plus future server-side
                actions.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
