"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Clock3,
  ExternalLink,
  Loader2,
  Pencil,
  Save,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import {
  deleteRecipeAction,
  updateRecipeAction,
  type RecipeActionState,
} from "@/app/recipes/actions";
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

const initialEditState: RecipeActionState = {
  status: "idle",
  message: "",
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
  const router = useRouter();
  const techniquePattern = useTechniquePattern();
  const [technique, setTechnique] = useState<TechniqueState | null>(null);
  const [isTechniqueLoading, setIsTechniqueLoading] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [editState, editAction, isSavingEdit] = useActionState(
    updateRecipeAction,
    initialEditState,
  );
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Ask me about a step, a substitution, timing, or how to fix something while cooking this recipe.",
    },
  ]);
  const [question, setQuestion] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    if (editState.status === "success") {
      router.refresh();
    }
  }, [editState.status, router]);

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
          className="mx-0.5 rounded-md bg-mise-technique px-1.5 py-0.5 font-semibold text-mise-technique-text underline-offset-2 hover:bg-mise-technique-hover hover:underline"
          title={`Explain ${normalizedTerm}`}
        >
          {segment}
        </button>
      );
    });
  }

  return (
    <>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
        <section className="mise-card overflow-hidden rounded-2xl">
          <div
            className="aspect-[16/10] bg-[linear-gradient(145deg,#eef4ee_0%,#f4efe8_100%)] bg-cover bg-center"
            style={
              recipe.image_url
                ? { backgroundImage: `url(${recipe.image_url})` }
                : undefined
            }
            role={recipe.image_url ? "img" : undefined}
            aria-label={recipe.image_url ? recipe.title : undefined}
          />
          <div className="border-b border-mise-border px-6 py-6">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-mise-accent">
              {recipe.cuisine ?? recipe.source}
            </p>
            <div className="mt-2 flex items-start justify-between gap-3">
              <h1 className="font-serif text-3xl leading-tight text-mise-ink sm:text-4xl">
                {recipe.title}
              </h1>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing((current) => !current)}
                  className="mise-btn-secondary rounded-xl py-2 pl-3 pr-3 text-xs sm:text-sm"
                >
                  {isEditing ? (
                    <X size={16} aria-hidden="true" />
                  ) : (
                    <Pencil size={16} aria-hidden="true" />
                  )}
                  {isEditing ? "Close" : "Edit"}
                </button>
              </div>
            </div>
            {recipe.description ? (
              <p className="mt-4 text-sm leading-relaxed text-mise-muted">
                {recipe.description}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-mise-chip px-3 py-1.5 text-xs font-semibold text-mise-chip-text">
                <Clock3 size={14} aria-hidden="true" />
                {recipe.prep_minutes ?? 30} min
              </span>
              {recipe.source_url ? (
                <a
                  href={recipe.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mise-btn-secondary rounded-full py-1.5 pl-3 pr-3 text-xs"
                >
                  <ExternalLink size={14} aria-hidden="true" />
                  Source
                </a>
              ) : null}
            </div>
          </div>

          {isEditing ? (
            <form
              action={editAction}
              className="space-y-4 border-b border-mise-border p-6"
            >
              <input name="recipeId" type="hidden" value={recipe.id} />
              <label className="mise-label">
                Title
                <input
                  name="title"
                  required
                  defaultValue={recipe.title}
                  className="mise-input"
                />
              </label>
              <label className="mise-label">
                Short note
                <input
                  name="description"
                  defaultValue={recipe.description ?? ""}
                  className="mise-input"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="mise-label">
                  Cuisine
                  <input
                    name="cuisine"
                    defaultValue={recipe.cuisine ?? ""}
                    className="mise-input"
                  />
                </label>
                <label className="mise-label">
                  Minutes
                  <input
                    name="prepMinutes"
                    type="number"
                    min="1"
                    defaultValue={recipe.prep_minutes ?? ""}
                    className="mise-input"
                  />
                </label>
              </div>
              <label className="mise-label">
                Image URL
                <input
                  name="imageUrl"
                  type="url"
                  defaultValue={recipe.image_url ?? ""}
                  className="mise-input"
                  placeholder="https://…"
                />
              </label>
              <label className="mise-label">
                Ingredients
                <textarea
                  name="ingredients"
                  required
                  defaultValue={recipe.ingredients.join("\n")}
                  className="mise-textarea h-36"
                />
              </label>
              <label className="mise-label">
                Instructions
                <textarea
                  name="instructions"
                  required
                  defaultValue={recipe.instructions.join("\n")}
                  className="mise-textarea h-44"
                />
              </label>
              <label className="mise-label">
                Notes
                <textarea
                  name="notes"
                  defaultValue={recipe.notes ?? ""}
                  className="mise-textarea h-28"
                  placeholder="Adjustments for next time"
                />
              </label>
              <button
                type="submit"
                disabled={isSavingEdit}
                className="mise-btn-primary"
              >
                {isSavingEdit ? (
                  <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                ) : (
                  <Save size={16} aria-hidden="true" />
                )}
                Save edits
              </button>
              {editState.message ? (
                <p
                  className={`rounded-xl px-3 py-2 text-sm ${
                    editState.status === "success"
                      ? "bg-mise-success-bg text-mise-success-text"
                      : "bg-mise-danger-bg text-mise-danger"
                  }`}
                >
                  {editState.message}
                </p>
              ) : null}
            </form>
          ) : null}

          <div className="p-6">
            <h2 className="text-sm font-semibold text-mise-ink">Ingredients</h2>
            <ul className="mt-4 space-y-2">
              {recipe.ingredients.map((ingredient) => (
                <li
                  key={ingredient}
                  className="rounded-xl border border-mise-border/70 bg-mise-surface-soft px-4 py-2.5 text-sm text-mise-ink"
                >
                  {ingredient}
                </li>
              ))}
            </ul>
          </div>
          {recipe.notes ? (
            <div className="border-t border-mise-border p-6">
              <h2 className="text-sm font-semibold text-mise-ink">Notes</h2>
              <p className="mt-3 whitespace-pre-line rounded-xl border border-mise-warm/20 bg-mise-warn-bg px-4 py-3 text-sm leading-relaxed text-mise-warn-text">
                {recipe.notes}
              </p>
            </div>
          ) : null}
          <div className="border-t border-mise-border p-6">
            <form action={deleteRecipeAction} className="space-y-3">
              <input name="recipeId" type="hidden" value={recipe.id} />
              <label className="flex items-start gap-2 text-sm text-mise-muted">
                <input
                  checked={deleteConfirmed}
                  onChange={(event) => setDeleteConfirmed(event.target.checked)}
                  className="mt-1 rounded border-mise-border"
                  type="checkbox"
                />
                I understand this will permanently delete this recipe.
              </label>
              <button
                type="submit"
                disabled={!deleteConfirmed}
                className="inline-flex items-center gap-2 rounded-xl border border-mise-danger-border bg-mise-surface px-4 py-2.5 text-sm font-semibold text-mise-danger hover:bg-mise-danger-bg disabled:cursor-not-allowed disabled:border-mise-border disabled:text-mise-muted"
              >
                Delete recipe
              </button>
            </form>
          </div>
        </section>

        <section className="mise-card overflow-hidden rounded-2xl">
          <div className="border-b border-mise-border px-6 py-4">
            <h2 className="font-serif text-lg text-mise-ink">Cook mode</h2>
            <p className="mt-1 text-xs text-mise-muted">
              Tap highlighted terms for a quick technique note.
            </p>
          </div>
          <ol className="space-y-6 p-6">
            {recipe.instructions.map((step, index) => (
              <li key={`${step}-${index}`} className="flex gap-4">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-mise-forest text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <p className="min-w-0 text-base leading-7 text-mise-ink">
                  {renderStepText(step)}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {technique ? (
          <section className="mise-card rounded-2xl p-6 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles
                  size={17}
                  className="text-mise-accent"
                  aria-hidden="true"
                />
                <h2 className="font-semibold capitalize text-mise-ink">
                  {technique.term}
                </h2>
              </div>
              <span className="rounded-full bg-mise-chip px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-mise-chip-text">
                {technique.source}
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-mise-muted">
              {technique.explanation}
            </p>
            {technique.cue ? (
              <p className="mt-4 rounded-xl border border-mise-accent/20 bg-mise-surface-soft px-4 py-3 text-sm text-mise-accent">
                {technique.cue}
              </p>
            ) : null}
            {isTechniqueLoading ? (
              <p className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-mise-muted">
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
        className="fixed bottom-6 right-6 z-30 mise-btn-primary rounded-full px-5 py-3 shadow-[var(--shadow-mise-float)]"
      >
        <Bot size={17} aria-hidden="true" />
        Ask Mise
      </button>

      {isAssistantOpen ? (
        <aside className="fixed inset-x-4 bottom-24 z-30 mise-card max-h-[min(70vh,440px)] overflow-hidden rounded-2xl sm:left-auto sm:right-6 sm:w-[400px]">
          <div className="flex items-center justify-between border-b border-mise-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot size={17} className="text-mise-accent" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-mise-ink">Assistant</h2>
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
                  <Loader2 className="animate-spin" size={14} aria-hidden="true" />
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
                placeholder="Can I swap this ingredient?"
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
    </>
  );
}
