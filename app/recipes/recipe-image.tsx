"use client";

import { useEffect, useMemo, useState } from "react";
import { RecipeMonogram } from "@/app/recipes/recipe-monogram";

type Props = {
  src: string | null | undefined;
  title: string;
  className?: string;
  size?: "card" | "hero";
};

/** Normalize DB noise; reject obvious non-URLs so we skip straight to monogram. */
function usableImageUrl(raw: string | null | undefined): string | null {
  const s = (raw ?? "").trim();
  if (!s || s === "null" || s === "undefined") {
    return null;
  }
  if (s.startsWith("/")) {
    return s;
  }
  try {
    if (s.startsWith("//")) {
      return `https:${s}`;
    }
    const parsed = new URL(s);
    if (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:" ||
      parsed.protocol === "data:"
    ) {
      return parsed.href;
    }
  } catch {
    return null;
  }
  return null;
}

function frameAspectStyle(size: "card" | "hero") {
  return size === "hero"
    ? ({ aspectRatio: "21 / 9", width: "100%" } as const)
    : ({ aspectRatio: "4 / 3", width: "100%" } as const);
}

export function RecipeImage({
  src,
  title,
  className = "",
  size = "card",
}: Props) {
  const [failed, setFailed] = useState(false);
  const url = useMemo(() => usableImageUrl(src), [src]);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  const showImage = Boolean(url) && !failed;
  const aspectStyle = frameAspectStyle(size);

  if (!showImage) {
    return (
      <RecipeMonogram
        title={title}
        className={className}
        size={size}
      />
    );
  }

  return (
    <div
      className={`relative w-full shrink-0 overflow-hidden bg-mise-surface-soft ${className}`}
      style={aspectStyle}
    >
      <img
        src={url ?? ""}
        alt={`${title} — recipe photo`}
        className="absolute inset-0 size-full object-cover"
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
