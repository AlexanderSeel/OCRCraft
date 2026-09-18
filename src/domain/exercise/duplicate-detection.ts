export interface DuplicateExerciseRecord {
  readonly id: string;
  readonly names: readonly string[];
  readonly aliases: readonly string[];
  readonly category?: string | null;
  readonly equipment: readonly string[];
  readonly bodyRegions: readonly string[];
  readonly sourceRecordId?: string | null;
}

export interface DuplicateAssessment {
  readonly score: number;
  readonly reasons: readonly string[];
  readonly classification: DuplicateClassification;
}

export type DuplicateClassification = "same" | "new" | "probable_duplicate" | "conflict";

export function normalizeExerciseText(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function tokenSet(values: readonly string[]): Set<string> {
  return new Set(values.flatMap((value) => normalizeExerciseText(value).split(" ").filter((token) => token.length > 1)));
}

function jaccard(left: Set<string>, right: Set<string>): number {
  if (!left.size || !right.size) return 0;
  const intersection = [...left].filter((token) => right.has(token)).length;
  return intersection / (left.size + right.size - intersection);
}

export function assessExerciseDuplicate(left: DuplicateExerciseRecord, right: DuplicateExerciseRecord): DuplicateAssessment {
  const leftNames = left.names.map(normalizeExerciseText).filter(Boolean);
  const rightNames = right.names.map(normalizeExerciseText).filter(Boolean);
  const reasons: string[] = [];
  if (left.sourceRecordId && left.sourceRecordId === right.sourceRecordId) reasons.push("gleiche externe Datensatz-ID");
  if (leftNames.some((name) => rightNames.includes(name))) reasons.push("gleicher normalisierter Name");
  const nameScore = Math.max(jaccard(tokenSet(left.names), tokenSet(right.names)), jaccard(tokenSet(left.aliases), tokenSet(right.aliases)));
  const contextScore = (jaccard(tokenSet(left.equipment), tokenSet(right.equipment)) + jaccard(tokenSet(left.bodyRegions), tokenSet(right.bodyRegions))) / 2;
  if (nameScore >= 0.8) reasons.push("sehr ähnliche Bezeichnung");
  if (contextScore >= 0.75) reasons.push("gleiches Equipment und Körperregion");
  const score = Math.min(1, (leftNames.some((name) => rightNames.includes(name)) ? 0.7 : nameScore * 0.55) + contextScore * 0.25 + (reasons.includes("gleiche externe Datensatz-ID") ? 0.3 : 0));
  const sameIdentity = reasons.includes("gleiche externe Datensatz-ID") || reasons.includes("gleicher normalisierter Name");
  const classification: DuplicateClassification = sameIdentity
    ? "same"
    : score >= 0.72
      ? "probable_duplicate"
      : contextScore >= 0.5 && nameScore >= 0.35
        ? "conflict"
        : "new";
  return { score, reasons, classification };
}

export function shouldReviewDuplicate(assessment: DuplicateAssessment): boolean {
  return assessment.classification !== "new" && assessment.reasons.length > 0;
}
