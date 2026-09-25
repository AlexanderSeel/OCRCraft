import type { ExerciseFigurePresentation } from "./ocrcraft-exercise-illustration-v2";

export function chooseCodexImageFigurePresentation(identifier: string): ExerciseFigurePresentation {
  let hash = 0;
  for (const character of identifier) hash = ((hash * 31) + character.charCodeAt(0)) >>> 0;
  return hash % 2 === 0 ? "adult_woman" : "adult_man";
}

export function sanitizeCodexImageSlug(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "exercise";
}

export function buildCodexImageOutputFilename(
  index: number,
  seedKey: string | null,
  exerciseName: string,
): string {
  const ordinal = String(Math.max(1, Math.trunc(index))).padStart(4, "0");
  return `${ordinal}-${sanitizeCodexImageSlug(seedKey || exerciseName)}.png`;
}
