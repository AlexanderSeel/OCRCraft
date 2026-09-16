export const exerciseCategories = [
  "warmup",
  "mobility",
  "strength",
  "core",
  "running",
  "grip-rig",
  "carry-lift",
  "ocr-skill",
  "balance-agility",
  "throw",
  "cooldown",
  "general",
] as const;

export type ExerciseCategory = (typeof exerciseCategories)[number];

export const exercisePhases = ["warmup", "main", "cooldown"] as const;
export type ExercisePhase = (typeof exercisePhases)[number];

export const exerciseRiskLevels = ["low", "medium", "high"] as const;
export type ExerciseRiskLevel = (typeof exerciseRiskLevels)[number];

export const exerciseCategoryLabels: Record<ExerciseCategory, string> = {
  warmup: "Aufwärmen",
  mobility: "Mobilität",
  strength: "Kraft",
  core: "Core",
  running: "Laufen",
  "grip-rig": "Grip & Rig",
  "carry-lift": "Carries & Lifts",
  "ocr-skill": "OCR Skills",
  "balance-agility": "Balance & Agilität",
  throw: "Werfen",
  cooldown: "Cooldown",
  general: "Allgemein",
};

export const exercisePhaseLabels: Record<ExercisePhase, string> = {
  warmup: "Warm-up",
  main: "Hauptteil",
  cooldown: "Cooldown / Stretching",
};

export interface ExerciseDraft {
  readonly nameDe: string;
  readonly nameEn: string;
  readonly summaryDe: string;
  readonly summaryEn: string;
  readonly aliasesDe: readonly string[];
  readonly aliasesEn: readonly string[];
  readonly category: ExerciseCategory;
  readonly phase: ExercisePhase;
  readonly riskLevel: ExerciseRiskLevel;
  readonly minAge: number | null;
}
