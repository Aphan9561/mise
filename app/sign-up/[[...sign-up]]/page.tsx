import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#fff8ef_0%,#f5eadb_100%)] px-6 py-12">
      <div className="w-full max-w-5xl rounded-[2rem] border border-white/70 bg-white/70 p-4 shadow-[0_30px_120px_rgba(93,58,34,0.12)] backdrop-blur sm:p-6 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:gap-6">
        <div className="rounded-[1.5rem] bg-[#315f46] p-8 text-[#f4f7f1]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#d9e8d3]">
            Start Cooking
          </p>
          <h1 className="mt-4 font-[family:var(--font-fraunces)] text-4xl text-white">
            Create an account and build your kitchen around what you love.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-[#edf3ea]">
            Save meal plans, track pantry staples, and turn recipe ideas into a
            personalized weekly routine.
          </p>
        </div>
        <div className="flex items-center justify-center rounded-[1.5rem] bg-[#fcf8f2] p-4 sm:p-8">
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
