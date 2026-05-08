type Props = {
  title: string;
  className?: string;
  size?: "card" | "hero";
};

function deriveLetter(title: string) {
  const trimmed = title.trim();
  if (!trimmed) {
    return "M";
  }
  const first = trimmed[0];
  return first.toUpperCase();
}

export function RecipeMonogram({ title, className = "", size = "card" }: Props) {
  const letter = deriveLetter(title);
  const letterSize =
    size === "hero"
      ? "text-[clamp(6rem,18vw,12rem)]"
      : "text-7xl";

  return (
    <div
      className={`relative grid place-items-center bg-mise-accent/10 ${className}`}
      role="img"
      aria-label={`${title} — placeholder image`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-3 border border-mise-accent/25"
      />
      <span
        aria-hidden="true"
        className={`font-serif font-medium leading-none tracking-tight text-mise-accent ${letterSize}`}
      >
        {letter}
      </span>
      {size === "hero" ? (
        <span
          aria-hidden="true"
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase text-mise-accent/80"
          style={{ letterSpacing: "0.3em" }}
        >
          Recipe
        </span>
      ) : null}
    </div>
  );
}
