"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  BookOpen,
  Bot,
  Clock3,
  CookingPot,
  Info,
  Loader2,
  Plus,
  Search,
  Send,
  Sparkles,
  Utensils,
} from "lucide-react";
import {
  createRecipeAction,
  type RecipeActionState,
} from "@/app/kitchen/actions";
import {
  fallbackDiscoveryRecipes,
  type DiscoveryRecipe,
} from "@/lib/cooking/discovery";
import { techniqueTerms } from "@/lib/cooking/techniques";
import type { UserRecipe } from "@/lib/supabase/recipes";

type ProfileStatus =
  | {
      state: "synced";
      email: string | null;
      fullName: string | null;
    }
  | {
      state: "missing-table";
    }
  | {
      state: "error";
      message: string;
    };

type KitchenWorkspaceProps = {
  recipes: UserRecipe[];
  primaryEmail: string | null;
  profileStatus: ProfileStatus;
  recipesMissingTable: boolean;
  recipesErrorMessage: string | null;
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

type RecipeDraft = {
  title: string;
  description: string;
  cuisine: string;
  prepMinutes: string;
  ingredients: string;
  instructions: string;
};

const demoRecipe: UserRecipe = {
  id: "demo-recipe",
  clerk_user_id: "demo",
  title: "Tomato Garlic Pantry Pasta",
  description:
    "A starter recipe so technique explanations and the cooking assistant have something to work with before you add your own.",
  cuisine: "Weeknight",
  prep_minutes: 25,
  ingredients: [
    "8 oz pasta",
    "2 tbsp olive oil",
    "3 cloves garlic, minced",
    "1 can crushed tomatoes",
    "1/4 cup pasta water",
    "Parmesan and basil",
  ],
  instructions: [
    "Boil pasta until just shy of al dente and reserve some pasta water.",
    "Saute the minced garlic in olive oil until fragrant but not browned.",
    "Add tomatoes and simmer until the sauce begins to reduce.",
    "Deglaze with pasta water, fold in the pasta, and finish with basil.",
  ],
  source: "demo",
  image_url: null,
  notes: null,
  source_url: null,
  is_starred: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const initialActionState: RecipeActionState = {
  status: "idle",
  message: "",
};

const emptyDraft: RecipeDraft = {
  title: "",
  description: "",
  cuisine: "",
  prepMinutes: "",
  ingredients: "",
  instructions: "",
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
    const terms = techniqueTerms
      .toSorted((a, b) => b.length - a.length)
      .map(escapeRegex)
      .join("|");

    return new RegExp(`\\b(${terms})(?:s|ed|ing)?\\b`, "gi");
  }, []);
}

export function KitchenWorkspace({
  recipes,
  primaryEmail,
  profileStatus,
  recipesMissingTable,
  recipesErrorMessage,
}: KitchenWorkspaceProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const displayRecipes = useMemo(
    () => (recipes.length > 0 ? recipes : [demoRecipe]),
    [recipes],
  );
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const selectedRecipe =
    displayRecipes.find((recipe) => recipe.id === selectedRecipeId) ??
    displayRecipes[0];
  const techniquePattern = useTechniquePattern();
  const [draft, setDraft] = useState<RecipeDraft>(emptyDraft);
  const [actionState, formAction, isCreatingRecipe] = useActionState(
    createRecipeAction,
    initialActionState,
  );
  const [technique, setTechnique] = useState<TechniqueState>({
    term: "Tap a highlighted term",
    explanation:
      "Technique terms in recipe steps are interactive. Tap one while cooking to get a concise explanation.",
    cue: "Highlighted terms include saute, simmer, reduce, deglaze, fold, and more.",
    source: "local",
  });
  const [isTechniqueLoading, setIsTechniqueLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Ask me a cooking question about the selected recipe, a substitution, or a step that feels unclear.",
    },
  ]);
  const [question, setQuestion] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [discoveryQuery, setDiscoveryQuery] = useState("weeknight dinner");
  const [discoveryRecipes, setDiscoveryRecipes] = useState<DiscoveryRecipe[]>(
    fallbackDiscoveryRecipes,
  );
  const [discoverySource, setDiscoverySource] = useState("local");
  const [isDiscoveryLoading, setIsDiscoveryLoading] = useState(false);

  useEffect(() => {
    if (actionState.status === "success") {
      router.refresh();
    }
  }, [actionState.status, router]);

  async function explainTechnique(term: string, context: string) {
    setIsTechniqueLoading(true);
    setTechnique((current) => ({
      ...current,
      term,
      explanation: "Checking the technique in this recipe context...",
      cue: "",
    }));

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
          "I could not fetch an explanation right now. Use the recipe's texture, color, and aroma cues before moving to the next step.",
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
          recipe: selectedRecipe,
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
            "I could not reach the assistant. Keep cooking by lowering the heat and checking the next visual cue.",
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  }

  async function searchDiscovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsDiscoveryLoading(true);

    try {
      const response = await fetch(
        `/api/discovery?query=${encodeURIComponent(discoveryQuery)}`,
      );
      const data = (await response.json()) as {
        source?: string;
        recipes?: DiscoveryRecipe[];
      };

      setDiscoverySource(data.source ?? "local");
      setDiscoveryRecipes(
        data.recipes && data.recipes.length > 0
          ? data.recipes
          : fallbackDiscoveryRecipes,
      );
    } finally {
      setIsDiscoveryLoading(false);
    }
  }

  function applyDiscoveryRecipe(recipe: DiscoveryRecipe) {
    setDraft({
      title: recipe.title,
      description: recipe.summary,
      cuisine: recipe.cuisine,
      prepMinutes: String(recipe.readyInMinutes),
      ingredients: recipe.ingredients.join("\n"),
      instructions: recipe.instructions.join("\n"),
    });
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
    <main className="min-h-screen bg-[#f6f7f1] text-[#18211f]">
      <header className="border-b border-[#d8ddd4] bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-[#173f3b] text-white">
              <CookingPot size={20} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-[family:var(--font-fraunces)] text-2xl text-[#173f3b]">
                Mise Kitchen
              </h1>
              <p className="truncate text-sm text-[#66706b]">
                {primaryEmail ?? "Signed in"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded bg-[#e7f0ff] px-3 py-1.5 text-xs font-semibold text-[#164376] sm:inline-flex">
              Week 5 build
            </span>
            <UserButton />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-4 px-4 py-4 sm:px-6 xl:grid-cols-[330px_minmax(0,1fr)_380px]">
        <aside className="space-y-4">
          <section className="rounded-lg border border-[#d8ddd4] bg-white">
            <div className="flex items-center justify-between border-b border-[#e4e8df] px-4 py-3">
              <div className="flex items-center gap-2">
                <BookOpen size={17} aria-hidden="true" />
                <h2 className="font-semibold">Recipes</h2>
              </div>
              <span className="text-xs font-medium text-[#66706b]">
                {recipes.length} saved
              </span>
            </div>
            <div className="max-h-[280px] overflow-y-auto p-2">
              {displayRecipes.map((recipe) => (
                <button
                  key={recipe.id}
                  type="button"
                  onClick={() => setSelectedRecipeId(recipe.id)}
                  className={`w-full rounded-md px-3 py-3 text-left transition ${
                    selectedRecipe.id === recipe.id
                      ? "bg-[#173f3b] text-white"
                      : "hover:bg-[#f1f5ee]"
                  }`}
                >
                  <span className="block truncate text-sm font-semibold">
                    {recipe.title}
                  </span>
                  <span
                    className={`mt-1 flex items-center gap-1 text-xs ${
                      selectedRecipe.id === recipe.id
                        ? "text-[#cbe6df]"
                        : "text-[#66706b]"
                    }`}
                  >
                    <Clock3 size={13} aria-hidden="true" />
                    {recipe.prep_minutes ?? 30} min
                    {recipe.source === "demo" ? " sample" : ""}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[#d8ddd4] bg-white">
            <div className="flex items-center gap-2 border-b border-[#e4e8df] px-4 py-3">
              <Plus size={17} aria-hidden="true" />
              <h2 className="font-semibold">Add Recipe</h2>
            </div>
            <form ref={formRef} action={formAction} className="space-y-3 p-4">
              <label className="block text-sm font-medium">
                Title
                <input
                  name="title"
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-[#cfd8cf] bg-white px-3 py-2 text-sm outline-none focus:border-[#16806f]"
                  placeholder="Lemon rice bowls"
                />
              </label>
              <label className="block text-sm font-medium">
                Short note
                <input
                  name="description"
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-[#cfd8cf] bg-white px-3 py-2 text-sm outline-none focus:border-[#16806f]"
                  placeholder="Fast, bright, pantry friendly"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium">
                  Cuisine
                  <input
                    name="cuisine"
                    value={draft.cuisine}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        cuisine: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-[#cfd8cf] bg-white px-3 py-2 text-sm outline-none focus:border-[#16806f]"
                    placeholder="Italian"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Minutes
                  <input
                    name="prepMinutes"
                    type="number"
                    min="1"
                    value={draft.prepMinutes}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        prepMinutes: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-[#cfd8cf] bg-white px-3 py-2 text-sm outline-none focus:border-[#16806f]"
                    placeholder="25"
                  />
                </label>
              </div>
              <label className="block text-sm font-medium">
                Ingredients
                <textarea
                  name="ingredients"
                  value={draft.ingredients}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      ingredients: event.target.value,
                    }))
                  }
                  className="mt-1 h-28 w-full resize-none rounded-md border border-[#cfd8cf] bg-white px-3 py-2 text-sm outline-none focus:border-[#16806f]"
                  placeholder={"1 cup rice\n2 eggs\n1 lemon"}
                />
              </label>
              <label className="block text-sm font-medium">
                Instructions
                <textarea
                  name="instructions"
                  value={draft.instructions}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      instructions: event.target.value,
                    }))
                  }
                  className="mt-1 h-32 w-full resize-none rounded-md border border-[#cfd8cf] bg-white px-3 py-2 text-sm outline-none focus:border-[#16806f]"
                  placeholder={"Saute garlic until fragrant.\nSimmer sauce until reduced."}
                />
              </label>
              <button
                type="submit"
                disabled={isCreatingRecipe || recipesMissingTable}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#e85234] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#cf4228] disabled:cursor-not-allowed disabled:bg-[#aab3ad]"
              >
                {isCreatingRecipe ? (
                  <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                ) : (
                  <Plus size={16} aria-hidden="true" />
                )}
                Save recipe
              </button>
              {actionState.message ? (
                <p
                  className={`rounded-md px-3 py-2 text-sm ${
                    actionState.status === "success"
                      ? "bg-[#e7f6eb] text-[#27683b]"
                      : "bg-[#fde9e5] text-[#8d2f21]"
                  }`}
                >
                  {actionState.message}
                </p>
              ) : null}
            </form>
          </section>
        </aside>

        <section className="rounded-lg border border-[#d8ddd4] bg-white">
          <div className="border-b border-[#e4e8df] px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-[#16806f]">
                  {selectedRecipe.cuisine ?? "Recipe"}
                </p>
                <h2 className="mt-1 font-[family:var(--font-fraunces)] text-3xl text-[#173f3b]">
                  {selectedRecipe.title}
                </h2>
              </div>
              <span className="inline-flex items-center gap-1 rounded bg-[#eef4ff] px-3 py-1.5 text-sm font-semibold text-[#164376]">
                <Clock3 size={15} aria-hidden="true" />
                {selectedRecipe.prep_minutes ?? 30} min
              </span>
            </div>
            {selectedRecipe.description ? (
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#59635f]">
                {selectedRecipe.description}
              </p>
            ) : null}
          </div>

          <div className="grid gap-0 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="border-b border-[#e4e8df] p-5 lg:border-b-0 lg:border-r">
              <div className="mb-3 flex items-center gap-2">
                <Utensils size={17} aria-hidden="true" />
                <h3 className="font-semibold">Ingredients</h3>
              </div>
              <ul className="space-y-2">
                {selectedRecipe.ingredients.map((ingredient) => (
                  <li
                    key={ingredient}
                    className="rounded-md bg-[#f5f7f1] px-3 py-2 text-sm text-[#3f4a46]"
                  >
                    {ingredient}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <CookingPot size={17} aria-hidden="true" />
                <h3 className="font-semibold">Cook Mode</h3>
              </div>
              <ol className="space-y-4">
                {selectedRecipe.instructions.map((step, index) => (
                  <li key={`${step}-${index}`} className="flex gap-3">
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded bg-[#173f3b] text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                    <p className="min-w-0 text-base leading-8 text-[#26312e]">
                      {renderStepText(step)}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          {(profileStatus.state !== "synced" ||
            recipesMissingTable ||
            recipesErrorMessage) && (
            <section className="rounded-lg border border-[#f0c6a9] bg-[#fff8ed] p-4 text-sm text-[#7a4a22]">
              <div className="flex gap-2">
                <Info size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
                <p>
                  {recipesMissingTable
                    ? "Run supabase/schema.sql before saving recipes."
                    : recipesErrorMessage ??
                      "Run supabase/schema.sql before syncing profiles."}
                </p>
              </div>
            </section>
          )}

          <section className="rounded-lg border border-[#d8ddd4] bg-white">
            <div className="flex items-center justify-between border-b border-[#e4e8df] px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles size={17} aria-hidden="true" />
                <h2 className="font-semibold">Technique Help</h2>
              </div>
              <span className="rounded bg-[#eef4ff] px-2 py-1 text-xs font-semibold text-[#164376]">
                {technique.source}
              </span>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold capitalize text-[#173f3b]">
                {technique.term}
              </h3>
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
            </div>
          </section>

          <section className="rounded-lg border border-[#d8ddd4] bg-white">
            <div className="flex items-center gap-2 border-b border-[#e4e8df] px-4 py-3">
              <Bot size={17} aria-hidden="true" />
              <h2 className="font-semibold">AI Assistant</h2>
            </div>
            <div className="flex h-[320px] flex-col">
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
                  placeholder="Can I use yogurt instead?"
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
          </section>

          <section className="rounded-lg border border-[#d8ddd4] bg-white">
            <div className="flex items-center justify-between border-b border-[#e4e8df] px-4 py-3">
              <div className="flex items-center gap-2">
                <Search size={17} aria-hidden="true" />
                <h2 className="font-semibold">Discovery</h2>
              </div>
              <span className="rounded bg-[#f4ecff] px-2 py-1 text-xs font-semibold text-[#5d2d85]">
                {discoverySource}
              </span>
            </div>
            <form onSubmit={searchDiscovery} className="flex gap-2 p-3">
              <input
                value={discoveryQuery}
                onChange={(event) => setDiscoveryQuery(event.target.value)}
                className="min-w-0 flex-1 rounded-md border border-[#cfd8cf] px-3 py-2 text-sm outline-none focus:border-[#16806f]"
                placeholder="ingredient or cuisine"
              />
              <button
                type="submit"
                disabled={isDiscoveryLoading}
                className="grid size-10 place-items-center rounded-md bg-[#e85234] text-white hover:bg-[#cf4228] disabled:bg-[#aab3ad]"
                title="Search recipes"
              >
                {isDiscoveryLoading ? (
                  <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                ) : (
                  <Search size={16} aria-hidden="true" />
                )}
              </button>
            </form>
            <div className="max-h-[360px] space-y-3 overflow-y-auto px-3 pb-3">
              {discoveryRecipes.map((recipe) => (
                <article
                  key={recipe.id}
                  className="rounded-md border border-[#e4e8df] p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[#173f3b]">
                        {recipe.title}
                      </h3>
                      <p className="mt-1 text-xs text-[#66706b]">
                        {recipe.cuisine} · {recipe.readyInMinutes} min
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => applyDiscoveryRecipe(recipe)}
                      className="shrink-0 rounded-md border border-[#cfd8cf] px-2 py-1 text-xs font-semibold hover:bg-[#f1f5ee]"
                    >
                      Draft
                    </button>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm leading-5 text-[#59635f]">
                    {recipe.summary}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
