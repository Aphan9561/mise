"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Bot, Clock3, ExternalLink, Loader2, Send, Sparkles } from "lucide-react";
import { techniqueTerms } from "@/lib/cooking/techniques";
import type { UserRecipe } from "@/lib/supabase/recipes";

type RecipeDetailClientProps = {
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

export function RecipeDetailClient({ recipe }: RecipeDetailClientProps) {
  const techniquePattern = useTechniquePattern();
  const [technique, setTechnique] = useState<TechniqueState | null>(null);
  const [isTechniqueLoading, setIsTechniqueLoading] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Ask me about a step, a substitution, timing, or how to fix something while cooking this recipe.",
    },
  ]);
  const [question, setQuestion] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

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
        headers: {
          "Content-Type": "application/json",
        },
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

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: trimmedQuestion,
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

  function renderStepText(step: string) {
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
          className="mx-0.5 rounded bg-[#dff5ef] px-1.5 py-0.5 font-semibold text-[#0d6b5e] underline-offset-2 hover:bg-[#c7eadf] hover:underline"
          title={`Explain ${normalizedTerm}`}
        >
          {segment}
        </button>
      );
    });
  }

  return (
    <>
      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-lg border border-[#d8ddd4] bg-white">
          <div className="border-b border-[#e4e8df] px-5 py-5">
            <p className="text-xs font-semibold uppercase text-[#16806f]">
              {recipe.cuisine ?? recipe.source}
            </p>
            <h1 className="mt-2 font-[family:var(--font-fraunces)] text-4xl text-[#173f3b]">
              {recipe.title}
            </h1>
            {recipe.description ? (
              <p className="mt-3 text-sm leading-6 text-[#59635f]">
                {recipe.description}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[#66706b]">
              <span className="inline-flex items-center gap-1 rounded bg-[#eef4ff] px-3 py-1.5 font-semibold text-[#164376]">
                <Clock3 size={15} aria-hidden="true" />
                {recipe.prep_minutes ?? 30} min
              </span>
              {recipe.source_url ? (
                <a
                  href={recipe.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded border border-[#cfd8cf] px-3 py-1.5 font-semibold hover:bg-[#f1f5ee]"
                >
                  <ExternalLink size={15} aria-hidden="true" />
                  Source
                </a>
              ) : null}
            </div>
          </div>

          <div className="p-5">
            <h2 className="font-semibold">Ingredients</h2>
            <ul className="mt-3 space-y-2">
              {recipe.ingredients.map((ingredient) => (
                <li
                  key={ingredient}
                  className="rounded-md bg-[#f5f7f1] px-3 py-2 text-sm text-[#3f4a46]"
                >
                  {ingredient}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-lg border border-[#d8ddd4] bg-white">
          <div className="border-b border-[#e4e8df] px-5 py-4">
            <h2 className="font-semibold">Cook Mode</h2>
          </div>
          <ol className="space-y-5 p-5">
            {recipe.instructions.map((step, index) => (
              <li key={`${step}-${index}`} className="flex gap-3">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded bg-[#173f3b] text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <p className="min-w-0 text-base leading-8 text-[#26312e]">
                  {renderStepText(step)}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {technique ? (
          <section className="rounded-lg border border-[#d8ddd4] bg-white p-5 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles size={17} aria-hidden="true" />
                <h2 className="font-semibold capitalize">{technique.term}</h2>
              </div>
              <span className="rounded bg-[#eef4ff] px-2 py-1 text-xs font-semibold text-[#164376]">
                {technique.source}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#3f4a46]">
              {technique.explanation}
            </p>
            {technique.cue ? (
              <p className="mt-3 rounded-md bg-[#f0f7f5] px-3 py-2 text-sm text-[#0d6b5e]">
                {technique.cue}
              </p>
            ) : null}
            {isTechniqueLoading ? (
              <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[#66706b]">
                <Loader2 className="animate-spin" size={14} aria-hidden="true" />
                Asking assistant
              </p>
            ) : null}
          </section>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => setIsAssistantOpen((current) => !current)}
        className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-md bg-[#173f3b] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(23,63,59,0.25)] hover:bg-[#245c56]"
      >
        <Bot size={17} aria-hidden="true" />
        Ask Mise
      </button>

      {isAssistantOpen ? (
        <aside className="fixed inset-x-4 bottom-20 z-30 rounded-lg border border-[#d8ddd4] bg-white shadow-[0_24px_70px_rgba(28,45,39,0.18)] sm:left-auto sm:w-[420px]">
          <div className="flex items-center justify-between border-b border-[#e4e8df] px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot size={17} aria-hidden="true" />
              <h2 className="font-semibold">Recipe Assistant</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsAssistantOpen(false)}
              className="rounded-md border border-[#cfd8cf] px-2 py-1 text-xs font-semibold hover:bg-[#f1f5ee]"
            >
              Close
            </button>
          </div>
          <div className="flex h-[380px] flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {chatMessages.map((message, index) => (
                <p
                  key={`${message.role}-${index}`}
                  className={`rounded-md px-3 py-2 text-sm leading-6 ${
                    message.role === "user"
                      ? "ml-8 bg-[#173f3b] text-white"
                      : "mr-8 bg-[#f1f5ee] text-[#26312e]"
                  }`}
                >
                  {message.content}
                </p>
              ))}
              {isChatLoading ? (
                <p className="inline-flex items-center gap-2 rounded-md bg-[#f1f5ee] px-3 py-2 text-sm text-[#66706b]">
                  <Loader2 className="animate-spin" size={14} aria-hidden="true" />
                  Thinking
                </p>
              ) : null}
            </div>
            <form
              onSubmit={sendQuestion}
              className="flex gap-2 border-t border-[#e4e8df] p-3"
            >
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                className="min-w-0 flex-1 rounded-md border border-[#cfd8cf] px-3 py-2 text-sm outline-none focus:border-[#16806f]"
                placeholder="Can I swap this ingredient?"
              />
              <button
                type="submit"
                disabled={isChatLoading}
                className="grid size-10 place-items-center rounded-md bg-[#173f3b] text-white hover:bg-[#245c56] disabled:bg-[#aab3ad]"
                title="Send question"
              >
                <Send size={16} aria-hidden="true" />
              </button>
            </form>
          </div>
        </aside>
      ) : null}
    </>
  );
}
