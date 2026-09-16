"use client";

import { polygonToClipPath, type MuscleMapPart } from "@/data/muscle-map-regions";

export type RasterMuscleTone = "selected" | "primary" | "secondary" | "hover" | "antagonist";

const FILTERS: Readonly<Record<RasterMuscleTone, string>> = {
  selected: "grayscale(1) sepia(1) saturate(8) hue-rotate(338deg) brightness(.98) contrast(1.08)",
  primary: "grayscale(1) sepia(1) saturate(10) hue-rotate(312deg) brightness(.94) contrast(1.1)",
  secondary: "grayscale(1) sepia(1) saturate(9) hue-rotate(168deg) brightness(.93) contrast(1.08)",
  hover: "grayscale(1) sepia(1) saturate(10) hue-rotate(338deg) brightness(1.08) contrast(1.12)",
  antagonist: "grayscale(1) sepia(1) saturate(8) hue-rotate(205deg) brightness(1.03) contrast(1.06)",
};

/**
 * Reuses the exact anatomy raster and clips it to a muscle hit region.
 *
 * `color` blend mode keeps the luminance of the anatomy below the layer.
 * Pure/near-white background pixels therefore stay white instead of becoming
 * coloured polygon wedges, while the darker muscle fibres receive the tone.
 */
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
      alt=""
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full select-none object-fill"
      draggable={false}
      src="/assets/muscle-map-base.webp"
      style={{
        clipPath: polygonToClipPath(part.coordinates),
        filter: FILTERS[tone],
        mixBlendMode: "color",
        opacity: subtle ? 0.24 : tone === "hover" ? 0.9 : tone === "antagonist" ? 0.52 : 0.86,
      }}
    />
  );
}
