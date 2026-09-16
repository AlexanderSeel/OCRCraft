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

export type ExerciseBodyRegionEmphasis = "primary" | "secondary";

export interface ExerciseBodyRegionDraft {
  readonly id: string;
  readonly emphasis: ExerciseBodyRegionEmphasis;
}

export interface ExerciseEquipmentDraft {
  readonly id: string;
  readonly quantityRequired: number;
}

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
  readonly bodyRegions: readonly ExerciseBodyRegionDraft[];
  readonly movementPatternIds: readonly string[];
  readonly tagIds: readonly string[];
  readonly equipment: readonly ExerciseEquipmentDraft[];
}
