"use client";

import { useState } from "react";
import { RecipeMonogram } from "@/app/recipes/recipe-monogram";

type Props = {
  src: string | null | undefined;
  title: string;
  className?: string;
  size?: "card" | "hero";
};

export function RecipeImage({
  src,
  title,
  className = "",
  size = "card",
}: Props) {
  const [failed, setFailed] = useState(false);
  const trimmed = (src ?? "").trim();
  const showImage = trimmed.length > 0 && !failed;

  if (!showImage) {
    return <RecipeMonogram title={title} className={className} size={size} />;
  }

  return (
    <div
      className={`relative overflow-hidden bg-mise-surface-soft ${className}`}
    >
      <img
        src={trimmed}
        alt={`${title} — recipe photo`}
        className="absolute inset-0 size-full object-cover"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
