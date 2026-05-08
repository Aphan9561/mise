import Link from "next/link";
import type { PantryCoverageSummary } from "@/lib/cooking/pantry-match";

type Props = {
  summary: PantryCoverageSummary;
};

export function PantryCoverageBanner({ summary }: Props) {
  const { ingredientLines, matchedIngredients, percentRounded } = summary;

  if (ingredientLines === 0) {
    return (
      <section className="rounded-2xl border border-mise-border/80 bg-mise-surface-soft px-5 py-4 text-sm text-mise-muted">
        <p>
          Add ingredients to this recipe to see how much you already have on
          hand. Keep your{" "}
          <Link
            href="/pantry"
            className="font-semibold text-mise-ink underline underline-offset-2"
          >
            pantry
          </Link>{" "}
          up to date for the best match.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-mise-accent/20 bg-mise-chip/40 px-5 py-4">
      <p className="text-sm text-mise-ink">
        <span className="font-semibold tabular-nums">{percentRounded}%</span>{" "}
        pantry match — you have about{" "}
        <span className="font-semibold tabular-nums">{matchedIngredients}</span>{" "}
        of{" "}
        <span className="font-semibold tabular-nums">{ingredientLines}</span>{" "}
        ingredients on hand.
      </p>
      {matchedIngredients < ingredientLines ? (
        <p className="mt-2 text-xs text-mise-muted">
          Tap{" "}
          <span className="font-semibold text-mise-ink">Add to grocery list</span>{" "}
          to queue what you&apos;re missing.
        </p>
      ) : (
        <p className="mt-2 text-xs text-mise-muted">
          You look stocked for this one — still check quantities before you
          cook.
        </p>
      )}
    </section>
  );
}
