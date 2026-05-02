"use client";

import {
  useActionState,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bot,
  ChefHat,
  Clock3,
  ExternalLink,
  Loader2,
  Pencil,
  Save,
  Send,
  X,
} from "lucide-react";
import {
  deleteRecipeAction,
  updateRecipeAction,
  type RecipeActionState,
} from "@/app/recipes/actions";
import { AddToGrocery } from "@/app/recipes/[id]/add-to-grocery";
import {
  TechniquePopover,
  useTechniqueHighlighter,
} from "@/app/recipes/[id]/technique-highlighter";
import type { UserRecipe } from "@/lib/supabase/recipes";

type RecipeDetailClientProps = {
  recipe: UserRecipe;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const initialEditState: RecipeActionState = {
  status: "idle",
  message: "",
};

export function RecipeDetailClient({ recipe }: RecipeDetailClientProps) {
  const router = useRouter();
  const {
    technique,
    isLoading: isTechniqueLoading,
    anchor: techniqueAnchor,
    renderStepText,
    closeTechnique,
  } = useTechniqueHighlighter();
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

  return (
    <>
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <article className="mise-card overflow-hidden rounded-3xl">
          {recipe.image_url ? (
            <div
              className="aspect-[21/9] bg-cover bg-center"
              style={{ backgroundImage: `url(${recipe.image_url})` }}
              role="img"
              aria-label={recipe.title}
            />
          ) : null}
          <div className="px-6 py-8 sm:px-10 sm:py-12">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mise-accent">
              {recipe.cuisine ?? recipe.source}
            </p>
            <h1 className="mt-3 font-serif text-4xl leading-[1.05] tracking-tight text-mise-ink sm:text-5xl lg:text-6xl">
              {recipe.title}
            </h1>
            {recipe.description ? (
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-mise-muted sm:text-lg">
                {recipe.description}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-mise-muted">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 size={15} aria-hidden="true" />
                {recipe.prep_minutes ?? 30} min
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {recipe.ingredients.length}{" "}
                {recipe.ingredients.length === 1 ? "ingredient" : "ingredients"}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {recipe.instructions.length}{" "}
                {recipe.instructions.length === 1 ? "step" : "steps"}
              </span>
              {recipe.source_url ? (
                <>
                  <span aria-hidden="true">·</span>
                  <a
                    href={recipe.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 underline-offset-2 hover:text-mise-ink hover:underline"
                  >
                    <ExternalLink size={14} aria-hidden="true" />
                    Source
                  </a>
                </>
              ) : null}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-2">
              <Link
                href={`/recipes/${recipe.id}/cook`}
                className="mise-btn-primary rounded-xl px-4 py-2.5 text-sm"
              >
                <ChefHat size={16} aria-hidden="true" />
                Cook
              </Link>
              <AddToGrocery recipeId={recipe.id} />
              <button
                type="button"
                onClick={() => setIsEditing((current) => !current)}
                className="mise-btn-secondary rounded-xl px-4 py-2.5 text-sm"
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
        </article>

        {isEditing ? (
          <section className="mise-card mt-6 overflow-hidden rounded-2xl">
            <div className="border-b border-mise-border px-6 py-5">
              <h2 className="font-serif text-lg text-mise-ink">Edit recipe</h2>
            </div>
            <form action={editAction} className="space-y-4 p-6">
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
              <div className="grid gap-3 lg:grid-cols-2">
                <label className="mise-label">
                  Ingredients
                  <textarea
                    name="ingredients"
                    required
                    defaultValue={recipe.ingredients.join("\n")}
                    className="mise-textarea h-44"
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
              </div>
              <label className="mise-label">
                Notes
                <textarea
                  name="notes"
                  defaultValue={recipe.notes ?? ""}
                  className="mise-textarea h-24"
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
          </section>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.4fr)]">
          <section className="mise-card overflow-hidden rounded-2xl lg:sticky lg:top-24 lg:self-start">
            <div className="border-b border-mise-border px-6 py-5">
              <h2 className="font-serif text-xl text-mise-ink">Ingredients</h2>
              <p className="mt-1 text-xs text-mise-muted">
                {recipe.ingredients.length}{" "}
                {recipe.ingredients.length === 1 ? "item" : "items"}
              </p>
            </div>
            <ul className="divide-y divide-mise-border/60">
              {recipe.ingredients.map((ingredient, index) => (
                <li
                  key={`${ingredient}-${index}`}
                  className="px-6 py-3 text-sm leading-relaxed text-mise-ink"
                >
                  {ingredient}
                </li>
              ))}
            </ul>
          </section>

          <section className="mise-card overflow-hidden rounded-2xl">
            <div className="border-b border-mise-border px-6 py-5">
              <h2 className="font-serif text-xl text-mise-ink">Steps</h2>
              <p className="mt-1 text-xs text-mise-muted">
                Tap a highlighted term for a quick technique note.
              </p>
            </div>
            <ol className="space-y-6 p-6 sm:p-8">
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
        </div>

        {recipe.notes ? (
          <section className="mise-card mt-8 overflow-hidden rounded-2xl border-mise-warm/25 bg-mise-warn-bg">
            <div className="px-6 py-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-mise-warm">
                Your notes
              </h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-mise-warn-text">
                {recipe.notes}
              </p>
            </div>
          </section>
        ) : null}

        <section className="mt-10 rounded-2xl border border-mise-border bg-mise-surface/60 p-5">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-mise-muted hover:text-mise-danger">
              <span>Delete this recipe</span>
              <span
                aria-hidden="true"
                className="text-xs transition-transform group-open:rotate-90"
              >
                ›
              </span>
            </summary>
            <form action={deleteRecipeAction} className="mt-4 space-y-3">
              <input name="recipeId" type="hidden" value={recipe.id} />
              <label className="flex items-start gap-2 text-sm text-mise-muted">
                <input
                  checked={deleteConfirmed}
                  onChange={(event) =>
                    setDeleteConfirmed(event.target.checked)
                  }
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
          </details>
        </section>
      </div>

      <TechniquePopover
        technique={technique}
        isLoading={isTechniqueLoading}
        anchor={techniqueAnchor}
        onClose={closeTechnique}
      />

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
