"use client";

import { polygonToClipPath, type MuscleMapPart } from "@/data/muscle-map-regions";

export type RasterMuscleTone = "selected" | "primary" | "secondary" | "hover";

const FILTERS: Readonly<Record<RasterMuscleTone, string>> = {
  selected: "grayscale(1) sepia(1) saturate(8) hue-rotate(338deg) brightness(.98) contrast(1.08)",
  primary: "grayscale(1) sepia(1) saturate(10) hue-rotate(312deg) brightness(.94) contrast(1.1)",
  secondary: "grayscale(1) sepia(1) saturate(9) hue-rotate(168deg) brightness(.93) contrast(1.08)",
  hover: "grayscale(1) sepia(1) saturate(10) hue-rotate(338deg) brightness(1.08) contrast(1.12)",
};

export function RasterMuscleLayer({
  part,
  tone,
  subtle = false,
}: {
  readonly part: MuscleMapPart;
  readonly tone: RasterMuscleTone;
  readonly subtle?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full select-none object-fill"
      draggable={false}
      src="/assets/muscle-map-base.webp"
      style={{
        clipPath: polygonToClipPath(part.coordinates),
        filter: FILTERS[tone],
        mixBlendMode: "multiply",
        opacity: subtle ? 0.2 : tone === "hover" ? 0.82 : 0.68,
      }}
    />
  );
}
