import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#fff8ef_0%,#f5eadb_100%)] px-6 py-12">
      <div className="w-full max-w-5xl rounded-[2rem] border border-white/70 bg-white/70 p-4 shadow-[0_30px_120px_rgba(93,58,34,0.12)] backdrop-blur sm:p-6 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:gap-6">
        <div className="rounded-[1.5rem] bg-[#2d241d] p-8 text-[#f7ecde]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#f5c88a]">
            Welcome Back
          </p>
          <h1 className="mt-4 font-[family:var(--font-fraunces)] text-4xl text-white">
            Sign in and pick up tonight&apos;s cooking plan.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-[#e7d7c6]">
            Access saved recipes, pantry matches, and your weekly kitchen flow
            from one place.
          </p>
        </div>
        <div className="flex items-center justify-center rounded-[1.5rem] bg-[#fcf8f2] p-4 sm:p-8">
          <SignIn
            fallbackRedirectUrl="/recipes"
            signUpUrl="/sign-up"
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
