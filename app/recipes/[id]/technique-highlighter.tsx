"use client";

import {
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Loader2, Sparkles, X } from "lucide-react";
import { techniqueTerms } from "@/lib/cooking/techniques";

export type TechniqueState = {
  term: string;
  explanation: string;
  cue: string;
  source: string;
};

type AnchorPosition = {
  x: number;
  y: number;
  flipAbove: boolean;
};

const POPOVER_WIDTH = 320;
const VIEWPORT_MARGIN = 16;
const FLIP_HEIGHT_ESTIMATE = 220;

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

function clampAnchor(rect: DOMRect): AnchorPosition {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const popoverWidth = Math.min(POPOVER_WIDTH, viewportWidth - VIEWPORT_MARGIN * 2);
  const halfWidth = popoverWidth / 2;
  const minCenter = VIEWPORT_MARGIN + halfWidth;
  const maxCenter = viewportWidth - VIEWPORT_MARGIN - halfWidth;
  const rawCenter = rect.left + rect.width / 2;
  const center = Math.max(minCenter, Math.min(maxCenter, rawCenter));

  const flipAbove =
    rect.bottom + FLIP_HEIGHT_ESTIMATE + VIEWPORT_MARGIN > viewportHeight;
  const y = flipAbove ? rect.top - 12 : rect.bottom + 12;

  return { x: center, y, flipAbove };
}

export function useTechniqueHighlighter() {
  const techniquePattern = useMemo(() => {
    const terms = [...techniqueTerms]
      .sort((a, b) => b.length - a.length)
      .map(escapeRegex)
      .join("|");

    return new RegExp(`\\b(${terms})(?:s|ed|ing)?\\b`, "gi");
  }, []);

  const [technique, setTechnique] = useState<TechniqueState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [anchor, setAnchor] = useState<AnchorPosition | null>(null);

  async function explainTechnique(
    term: string,
    context: string,
    event: MouseEvent<HTMLButtonElement>,
  ) {
    const rect = event.currentTarget.getBoundingClientRect();
    setAnchor(clampAnchor(rect));
    setIsLoading(true);
    setTechnique({
      term,
      explanation: "Looking this up…",
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
          "I could not fetch an explanation. Use color, smell, texture, and heat as your cues.",
        cue: "Try again in a moment.",
        source: "local",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function closeTechnique() {
    setTechnique(null);
    setAnchor(null);
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
          onClick={(event) => explainTechnique(normalizedTerm, step, event)}
          className="mx-0.5 rounded-md bg-mise-technique px-1.5 py-0.5 font-semibold text-mise-technique-text underline-offset-2 hover:bg-mise-technique-hover hover:underline"
          title={`Explain ${normalizedTerm}`}
        >
          {segment}
        </button>
      );
    });
  }

  return {
    technique,
    isLoading,
    anchor,
    renderStepText,
    closeTechnique,
  };
}

type PopoverProps = {
  technique: TechniqueState | null;
  isLoading: boolean;
  anchor: AnchorPosition | null;
  onClose: () => void;
};

export function TechniquePopover({
  technique,
  isLoading,
  anchor,
  onClose,
}: PopoverProps) {
  useEffect(() => {
    if (!technique) {
      return;
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [technique, onClose]);

  if (!technique || !anchor || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close technique"
        className="fixed inset-0 z-40 cursor-default bg-transparent"
      />
      <div
        role="dialog"
        aria-label={`About ${technique.term}`}
        className="mise-card fixed z-50 rounded-2xl p-4"
        style={{
          left: `${anchor.x}px`,
          top: `${anchor.y}px`,
          transform: `translateX(-50%)${anchor.flipAbove ? " translateY(-100%)" : ""}`,
          width: `min(${POPOVER_WIDTH}px, calc(100vw - ${VIEWPORT_MARGIN * 2}px))`,
          boxShadow: "var(--shadow-mise-float)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles
              size={15}
              className="text-mise-accent"
              aria-hidden="true"
            />
            <h3 className="font-semibold capitalize text-mise-ink">
              {technique.term}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-7 shrink-0 place-items-center rounded-full text-mise-muted hover:bg-mise-surface-soft hover:text-mise-ink"
            aria-label="Close"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-mise-muted">
          {technique.explanation}
        </p>
        {technique.cue ? (
          <p className="mt-3 rounded-lg border border-mise-accent/20 bg-mise-surface-soft px-3 py-2 text-xs leading-relaxed text-mise-accent">
            {technique.cue}
          </p>
        ) : null}
        {isLoading ? (
          <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-mise-muted">
            <Loader2
              className="animate-spin"
              size={12}
              aria-hidden="true"
            />
            Asking assistant
          </p>
        ) : null}
      </div>
    </>,
    document.body,
  );
}
