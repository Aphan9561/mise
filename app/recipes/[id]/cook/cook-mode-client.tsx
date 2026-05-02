"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  Loader2,
  PartyPopper,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { techniqueTerms } from "@/lib/cooking/techniques";
import type { UserRecipe } from "@/lib/supabase/recipes";

type Props = {
  recipe: UserRecipe;
};

type TechniqueState = {
  term: string;
  explanation: string;
  cue: string;
  source: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeTechniqueTerm(value: string) {
  const lowerValue = value.toLowerCase();

  return (
    techniqueTerms.find((term) => lowerValue.startsWith(term.toLowerCase())) ??
    value
  );
}

function useTechniquePattern() {
  return useMemo(() => {
    const terms = [...techniqueTerms]
      .sort((a, b) => b.length - a.length)
      .map(escapeRegex)
      .join("|");

    return new RegExp(`\\b(${terms})(?:s|ed|ing)?\\b`, "gi");
  }, []);
}

export function CookModeClient({ recipe }: Props) {
  const steps = recipe.instructions;
  const totalSteps = steps.length;

  const [stepIndex, setStepIndex] = useState(0);
  const [technique, setTechnique] = useState<TechniqueState | null>(null);
  const [isTechniqueLoading, setIsTechniqueLoading] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Ask me about anything in this step — substitutions, timing, what to look for.",
    },
  ]);
  const [question, setQuestion] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  const techniquePattern = useTechniquePattern();

  const isLastStep = stepIndex >= totalSteps - 1;
  const isFinished = totalSteps > 0 && stepIndex === totalSteps;
  const currentStep = stepIndex < totalSteps ? steps[stepIndex] : null;

  useEffect(() => {
    if (typeof window === "undefined" || !("wakeLock" in navigator)) {
      return;
    }

    let wakeLock: WakeLockSentinel | null = null;
    let cancelled = false;

    async function request() {
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (cancelled) {
          await lock.release().catch(() => {});
          return;
        }
        wakeLock = lock;
      } catch {
        // Wake lock not available or blocked; cooking still works fine.
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && !wakeLock) {
        request();
      }
    }

    request();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      wakeLock?.release().catch(() => {});
      wakeLock = null;
    };
  }, []);

  useEffect(() => {
    function handler(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (event.key === "ArrowRight" || event.key === " ") {
        event.preventDefault();
        setStepIndex((index) => Math.min(index + 1, totalSteps));
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setStepIndex((index) => Math.max(index - 1, 0));
      } else if (event.key === "Escape") {
        setTechnique(null);
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [totalSteps]);

  async function explainTechnique(term: string, context: string) {
    setIsTechniqueLoading(true);
    setTechnique({
      term,
      explanation: "Checking this technique in context...",
      cue: "",
      source: "assistant",
    });

    try {
      const response = await fetch("/api/technique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term, context }),
      });
      const data = (await response.json()) as TechniqueState;

      setTechnique({
        term,
        explanation: data.explanation,
        cue: data.cue,
        source: data.source,
      });
    } catch {
      setTechnique({
        term,
        explanation:
          "I could not fetch an explanation. Use color, smell, texture, and heat level as your cues.",
        cue: "Try again in a moment.",
        source: "local",
      });
    } finally {
      setIsTechniqueLoading(false);
    }
  }

  async function sendQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      return;
    }

    setQuestion("");
    setIsChatLoading(true);
    setChatMessages((messages) => [
      ...messages,
      { role: "user", content: trimmedQuestion },
    ]);

    const stepContext = currentStep
      ? `I'm on step ${stepIndex + 1} of ${totalSteps}: "${currentStep}". `
      : "";

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `${stepContext}${trimmedQuestion}`,
          recipe,
          messages: chatMessages,
        }),
      });
      const data = (await response.json()) as { answer?: string };

      setChatMessages((messages) => [
        ...messages,
        {
          role: "assistant",
          content: data.answer ?? "I could not answer that yet.",
        },
      ]);
    } catch {
      setChatMessages((messages) => [
        ...messages,
        {
          role: "assistant",
          content:
            "I could not reach the assistant. Lower the heat if things are moving fast, then check the next visual cue.",
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  }

  function renderStepText(step: string): ReactNode {
    const segments = step.split(techniquePattern);

    return segments.map((segment, index) => {
      const isTechnique = techniquePattern.test(segment);
      techniquePattern.lastIndex = 0;

      if (!isTechnique) {
        return <span key={`${segment}-${index}`}>{segment}</span>;
      }

      const normalizedTerm = normalizeTechniqueTerm(segment);

      return (
        <button
          key={`${segment}-${index}`}
          type="button"
          onClick={() => explainTechnique(normalizedTerm, step)}
          className="mx-0.5 rounded-md bg-mise-technique px-1.5 py-0.5 font-semibold text-mise-technique-text underline-offset-2 hover:bg-mise-technique-hover hover:underline"
          title={`Explain ${normalizedTerm}`}
        >
          {segment}
        </button>
      );
    });
  }

  if (totalSteps === 0) {
    return (
      <main className="grid min-h-screen place-items-center bg-mise-page p-6 text-center text-mise-ink">
        <div>
          <h1 className="font-serif text-2xl">No steps to cook</h1>
          <p className="mt-2 text-sm text-mise-muted">
            This recipe has no instructions yet.
          </p>
          <Link
            href={`/recipes/${recipe.id}`}
            className="mise-btn-secondary mt-6"
          >
            Back to recipe
          </Link>
        </div>
      </main>
    );
  }

  const progress = Math.min(
    100,
    Math.round(((stepIndex + (isFinished ? 0 : 1)) / totalSteps) * 100),
  );

  return (
    <main className="flex min-h-screen flex-col bg-mise-page text-mise-ink">
      <header className="mise-header sticky top-0 z-20">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link
            href={`/recipes/${recipe.id}`}
            className="mise-btn-ghost rounded-full text-sm"
          >
            <X size={16} aria-hidden="true" />
            Exit
          </Link>
          <div className="min-w-0 flex-1 px-2 text-center">
            <p className="truncate font-serif text-base text-mise-ink">
              {recipe.title}
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-mise-muted">
              {isFinished
                ? "Done"
                : `Step ${stepIndex + 1} of ${totalSteps}`}
            </p>
          </div>
          <div className="w-[68px] shrink-0" aria-hidden="true" />
        </div>
        <div className="h-1 w-full bg-mise-border/60">
          <div
            className="h-full bg-mise-accent transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12">
        {isFinished ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="grid size-16 place-items-center rounded-3xl bg-mise-forest text-white shadow-sm">
              <PartyPopper size={28} aria-hidden="true" />
            </div>
            <h2 className="mt-6 font-serif text-4xl text-mise-ink">
              You finished cooking
            </h2>
            <p className="mt-3 max-w-sm text-base text-mise-muted">
              Great work. Plate it up while it&apos;s hot.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => setStepIndex(0)}
                className="mise-btn-secondary"
              >
                Cook again
              </button>
              <Link
                href={`/recipes/${recipe.id}`}
                className="mise-btn-primary"
              >
                Back to recipe
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col justify-center">
              <p className="font-serif text-3xl leading-snug tracking-tight text-mise-ink sm:text-4xl sm:leading-snug md:text-[2.75rem] md:leading-[1.2]">
                {renderStepText(currentStep ?? "")}
              </p>
            </div>

            {technique ? (
              <section className="mise-card mt-8 rounded-2xl p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles
                      size={16}
                      className="text-mise-accent"
                      aria-hidden="true"
                    />
                    <h3 className="font-semibold capitalize text-mise-ink">
                      {technique.term}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTechnique(null)}
                    className="mise-btn-ghost text-xs"
                  >
                    Close
                  </button>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-mise-muted">
                  {technique.explanation}
                </p>
                {technique.cue ? (
                  <p className="mt-3 rounded-xl border border-mise-accent/20 bg-mise-surface-soft px-3 py-2 text-sm text-mise-accent">
                    {technique.cue}
                  </p>
                ) : null}
                {isTechniqueLoading ? (
                  <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-mise-muted">
                    <Loader2
                      className="animate-spin"
                      size={14}
                      aria-hidden="true"
                    />
                    Asking assistant
                  </p>
                ) : null}
              </section>
            ) : null}
          </div>
        )}
      </section>

      <footer className="sticky bottom-0 z-10 border-t border-mise-border bg-mise-surface/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => setStepIndex((index) => Math.max(index - 1, 0))}
            disabled={stepIndex === 0}
            className="mise-btn-secondary"
          >
            <ChevronLeft size={18} aria-hidden="true" />
            Previous
          </button>
          {isFinished ? (
            <Link href={`/recipes/${recipe.id}`} className="mise-btn-primary">
              Back to recipe
            </Link>
          ) : (
            <button
              type="button"
              onClick={() =>
                setStepIndex((index) => Math.min(index + 1, totalSteps))
              }
              className="mise-btn-primary"
            >
              {isLastStep ? "Finish" : "Next"}
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      </footer>

      <button
        type="button"
        onClick={() => setIsAssistantOpen((current) => !current)}
        className="fixed bottom-24 right-6 z-30 mise-btn-primary rounded-full px-5 py-3 shadow-[var(--shadow-mise-float)]"
      >
        <Bot size={17} aria-hidden="true" />
        Ask Mise
      </button>

      {isAssistantOpen ? (
        <aside className="fixed inset-x-4 bottom-44 z-30 mise-card max-h-[min(60vh,420px)] overflow-hidden rounded-2xl sm:left-auto sm:right-6 sm:w-[400px]">
          <div className="flex items-center justify-between border-b border-mise-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot size={17} className="text-mise-accent" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-mise-ink">
                Assistant · Step {stepIndex + 1}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsAssistantOpen(false)}
              className="mise-btn-ghost text-xs"
            >
              Close
            </button>
          </div>
          <div className="flex max-h-[340px] flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {chatMessages.map((message, index) => (
                <p
                  key={`${message.role}-${index}`}
                  className={`rounded-xl px-3 py-2.5 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "ml-6 bg-mise-chat-user text-white"
                      : "mr-6 bg-mise-chat-assistant text-mise-ink"
                  }`}
                >
                  {message.content}
                </p>
              ))}
              {isChatLoading ? (
                <p className="inline-flex items-center gap-2 rounded-xl bg-mise-chat-assistant px-3 py-2 text-sm text-mise-muted">
                  <Loader2
                    className="animate-spin"
                    size={14}
                    aria-hidden="true"
                  />
                  Thinking
                </p>
              ) : null}
            </div>
            <form
              onSubmit={sendQuestion}
              className="flex gap-2 border-t border-mise-border bg-mise-surface-soft p-3"
            >
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                className="mise-input !mt-0 min-w-0 flex-1"
                placeholder="Ask about this step"
              />
              <button
                type="submit"
                disabled={isChatLoading}
                className="grid size-11 shrink-0 place-items-center rounded-xl bg-mise-accent text-white hover:bg-mise-accent-hover disabled:opacity-45"
                title="Send question"
              >
                <Send size={16} aria-hidden="true" />
              </button>
            </form>
          </div>
        </aside>
      ) : null}
    </main>
  );
}
