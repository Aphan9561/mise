import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-mise-page px-6 py-12 mise-hero-gradient">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-mise-border/60 bg-mise-surface/90 p-4 shadow-[var(--shadow-mise-float)] backdrop-blur-md sm:p-6 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:gap-6">
        <div className="rounded-2xl bg-mise-accent p-8 text-white lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
            Start cooking
          </p>
          <h1 className="mt-4 font-serif text-3xl sm:text-4xl">
            Create an account and build your kitchen around what you love.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/85">
            Save recipes, import from the web, and discover new dishes to try
            this week.
          </p>
        </div>
        <div className="flex items-center justify-center rounded-2xl bg-mise-surface-soft p-4 sm:p-8">
          <SignUp
            fallbackRedirectUrl="/recipes"
            signInUrl="/sign-in"
            appearance={{
              elements: {
                card: "shadow-none bg-transparent",
                rootBox: "w-full",
              },
            }}
          />
        </div>
      </div>
    </main>
  );
}
