export type TrainingPhaseKind = "warmup" | "main" | "cooldown";

export type Audience = "kids" | "youth" | "adults" | "mixed";

export type RiskLevel = "low" | "medium" | "high";

export type TrainingFormat =
  | "free"
  | "circuit"
  | "tabata"
  | "amrap"
  | "emom"
  | "rig-run"
  | "run-exercise"
  | "technique"
  | "relay";

export type BodyRegion =
  | "shoulders"
  | "chest"
  | "upper-back"
  | "arms"
  | "forearms-grip"
  | "core"
  | "lower-back"
  | "hips"
  | "glutes"
  | "quadriceps"
  | "hamstrings"
  | "calves"
  | "ankles-feet"
  | "full-body";

export interface TrainingGroup {
  readonly id: string;
  readonly name: string;
  readonly audience: Audience;
  readonly minAge?: number;
  readonly maxAge?: number;
  readonly participantCount: number;
}

export interface ExerciseReference {
  readonly id: string;
  readonly name: string;
  readonly riskLevel: RiskLevel;
  readonly bodyRegions: readonly BodyRegion[];
  readonly equipment: readonly string[];
}

export interface TrainingItem {
  readonly id: string;
  readonly exercise: ExerciseReference;
  readonly durationMinutes: number;
  readonly format?: TrainingFormat;
  readonly instructions?: string;
  readonly levelLabel?: string;
}

export interface TrainingPhase {
  readonly id: string;
  readonly kind: TrainingPhaseKind;
  readonly title: string;
  readonly items: readonly TrainingItem[];
}

export interface TrainingSession {
  readonly id: string;
  readonly title: string;
  readonly group: TrainingGroup;
  readonly totalDurationMinutes: number;
  readonly focus: readonly string[];
  readonly phases: readonly TrainingPhase[];
}

export const TRAINING_PHASE_LABELS: Readonly<Record<TrainingPhaseKind, string>> = {
  warmup: "Aufwärmen",
  main: "Hauptteil",
  cooldown: "Cooldown & Stretching",
};
