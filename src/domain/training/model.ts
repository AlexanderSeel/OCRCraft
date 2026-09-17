import { BODY_REGION_IDS, type BodyRegion } from "../body-regions";

export const TRAINING_PHASES = ["warmup", "main", "cooldown"] as const;
export type TrainingPhaseKind = (typeof TRAINING_PHASES)[number];

export const AUDIENCES = ["kids", "youth", "adults", "mixed"] as const;
export type Audience = (typeof AUDIENCES)[number];

export const RISK_LEVELS = ["low", "medium", "high"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const TRAINING_LOCATIONS = ["indoor", "outdoor", "mixed"] as const;
export type TrainingLocation = (typeof TRAINING_LOCATIONS)[number];

export const TRAINING_FORMATS = [
  "free",
  "circuit",
  "tabata",
  "amrap",
  "emom",
  "rig-run",
  "run-exercise",
  "technique",
  "relay",
] as const;
export type TrainingFormat = (typeof TRAINING_FORMATS)[number];

/** Programming applied to a numbered main-part block independently of exercise selection. */
export const MAIN_PART_PROGRAMMING_MODES = [
  "standard",
  "interval",
  "rounds",
  "ladder",
  "reverse-ladder",
  "pyramid",
  "chipper",
  "every",
] as const;
export type MainPartProgrammingMode = (typeof MAIN_PART_PROGRAMMING_MODES)[number];

export const MAIN_PART_SCORE_MODES = ["time", "quality"] as const;
export type MainPartScoreMode = (typeof MAIN_PART_SCORE_MODES)[number];

export const MAIN_PART_EVERY_UNITS = ["metres", "minutes", "checkpoint"] as const;
export type MainPartEveryUnit = (typeof MAIN_PART_EVERY_UNITS)[number];

export interface MainPartProgramming {
  readonly mode: MainPartProgrammingMode;
  /** Work/rest prescription for generic interval blocks. */
  readonly workSeconds?: number;
  readonly restSeconds?: number;
  /** Fixed rounds for time or quality. */
  readonly rounds?: number;
  readonly scoreMode?: MainPartScoreMode;
  /** Repetition range for ladder/reverse-ladder/pyramid programming. */
  readonly ladderStart?: number;
  readonly ladderEnd?: number;
  readonly ladderStep?: number;
  /** Trigger cadence for running/checkpoint combinations. */
  readonly everyValue?: number;
  readonly everyUnit?: MainPartEveryUnit;
}

export const TRAINING_ORGANIZATION_MODES = ["solo", "team"] as const;
export type TrainingOrganizationMode = (typeof TRAINING_ORGANIZATION_MODES)[number];

export const BODY_REGIONS = BODY_REGION_IDS;
export type { BodyRegion } from "../body-regions";

export interface TrainingGroup {
  readonly id: string;
  readonly name: string;
  readonly audience: Audience;
  readonly minAge?: number;
  readonly maxAge?: number;
  readonly participantCount: number;
  /** How athletes are expected to work through the main part. */
  readonly organizationMode?: TrainingOrganizationMode;
  /** Target team size when organizationMode is team. */
  readonly teamSize?: number;
}

export interface TrainingEquipmentAvailability {
  readonly equipmentId: string;
  readonly quantityAvailable: number;
}

export interface ExerciseEquipmentRequirement {
  readonly equipmentId: string;
  readonly name: string;
  readonly quantityPerStation: number;
}

export interface ExerciseReference {
  readonly id: string;
  readonly name: string;
  readonly riskLevel: RiskLevel;
  readonly bodyRegions: readonly BodyRegion[];
  readonly equipment: readonly string[];
  readonly equipmentRequirements?: readonly ExerciseEquipmentRequirement[];
  /** Maximum number of people who can use this exercise setup at once. */
  readonly stationCapacity?: number;
  /** Approximate preparation time from the exercise catalog. */
  readonly setupSeconds?: number;
  /** Approximate time to move from this exercise to the next one. */
  readonly transitionSeconds?: number;
  readonly minimumAge?: number | null;
  readonly suitableForAudience?: boolean;
  readonly impactLevel?: "low" | "moderate" | "high";
  readonly difficulty?: "beginner" | "intermediate" | "advanced";
  readonly supervision?: "normal" | "increased" | "direct";
}

export interface TrainingItem {
  readonly id: string;
  readonly exercise: ExerciseReference;
  readonly durationMinutes: number;
  readonly format?: TrainingFormat;
  readonly instructions?: string;
  readonly levelLabel?: string;
  /** 1-based main-part block. Omitted outside the main phase. */
  readonly mainPartIndex?: number;
  /** Optional trainer-facing title for the block, e.g. "Hauptteil 2". */
  readonly mainPartTitle?: string;
  /** Structured programming shared by all exercises in the same main-part block. */
  readonly programming?: MainPartProgramming;
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
