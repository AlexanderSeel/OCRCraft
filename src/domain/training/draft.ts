import type {
  ExerciseCoordinationComplexity,
  ExerciseDifficulty,
  ExerciseImpactLevel,
  ExerciseTrainingGoal,
  ExerciseType,
} from "@/domain/exercise/classification";
import type { ExerciseCategory } from "@/domain/exercise/model";
import { bodyRegionsOverlap, isBodyRegion } from "../body-regions";
import {
  TRAINING_PHASE_LABELS,
  type Audience,
  type BodyRegion,
  type RiskLevel,
  type TrainingFormat,
  type TrainingEquipmentAvailability,
  type ExerciseEquipmentRequirement,
  type TrainingOrganizationMode,
  type TrainingPhaseKind,
  type TrainingSession,
} from "./model";
import { validateTrainingSession, type TrainingValidationIssue } from "./validation";

export type DraftIntensity = "technique" | "balanced" | "conditioning";

export interface TrainingDraftInput {
  readonly audience: Audience;
  readonly participantCount: number;
  readonly durationMinutes: number;
  readonly goals: readonly string[];
  readonly bodyRegions: readonly BodyRegion[];
  readonly avoidBodyRegions?: readonly BodyRegion[];
  readonly exerciseTypes?: readonly ExerciseType[];
  readonly formats: readonly TrainingFormat[];
  readonly intensity: DraftIntensity;
  readonly preferredExerciseIds: readonly string[];
  readonly availableEquipment?: readonly TrainingEquipmentAvailability[];
  readonly minAge?: number;
  readonly maxAge?: number;
  /** Exact number of warm-up exercises when supplied. */
  readonly warmupExerciseCount?: number;
  /** Legacy/default number of exercises for each main part. */
  readonly mainExerciseCount?: number;
  /** Exact per-main-part counts. Takes precedence over mainExerciseCount. */
  readonly mainPartExerciseCounts?: readonly number[];
  readonly cooldownExerciseCount?: number;
  readonly mainPartCount?: number;
  readonly organizationMode?: TrainingOrganizationMode;
  readonly teamSize?: number;
}

export interface TrainingDraftExerciseCandidate {
  readonly id: string;
  readonly name: string;
  readonly category: ExerciseCategory;
  readonly defaultPhase: TrainingPhaseKind | null;
  readonly riskLevel: RiskLevel;
  readonly minAge: number | null;
  readonly bodyRegions: readonly string[];
  readonly equipment: readonly string[];
  readonly equipmentRequirements: readonly ExerciseEquipmentRequirement[];
  readonly stationCapacity: number;
  readonly setupSeconds?: number | null;
  readonly transitionSeconds?: number | null;
  readonly tags: readonly string[];
  readonly movementPatterns?: readonly string[];
  readonly exerciseType?: ExerciseType;
  readonly difficulty?: ExerciseDifficulty;
  readonly impactLevel?: ExerciseImpactLevel;
  readonly coordinationComplexity?: ExerciseCoordinationComplexity;
  readonly trainingGoals?: readonly ExerciseTrainingGoal[];
  /** Localized structured exercise detail collapsed into planning/search context. */
  readonly planningText?: string;
  readonly defaultDurationSeconds: number | null;
  readonly instructions?: string;
  readonly level1?: string;
  readonly level2?: string;
  readonly level3?: string;
}

export interface TrainingDraft {
  readonly source: "deterministic" | "ai";
  readonly session: TrainingSession;
  readonly validationIssues: readonly TrainingValidationIssue[];
  readonly warnings: readonly string[];
}

const CATEGORY_GOAL_TERMS: Readonly<Record<ExerciseCategory, readonly string[]>> = {
  warmup: ["aufwärm", "warmup", "warm-up"],
  mobility: ["mobility", "mobilität", "beweglichkeit"],
  strength: ["kraft", "kraftausdauer", "ganzkörper", "strength"],
  core: ["core", "rumpf"],
  running: ["laufen", "lauf", "ausdauer", "running"],
  "grip-rig": ["grip", "griff", "rig"],
  "carry-lift": ["carry", "tragen", "kraftausdauer", "ganzkörper"],
  "ocr-skill": ["ocr", "hindernis", "technik"],
  "balance-agility": ["balance", "koordination", "agilität", "agility"],
  throw: ["wurf", "werfen", "throw"],
  cooldown: ["cooldown", "stretch", "regeneration", "recovery"],
  general: ["ganzkörper", "allgemein"],
};

const TRAINING_GOAL_TERMS: Readonly<Record<ExerciseTrainingGoal, readonly string[]>> = {
  strength: ["kraft", "strength"],
  strength_endurance: ["kraftausdauer", "strength endurance"],
  endurance: ["ausdauer", "endurance", "laufen", "running"],
  speed: ["schnelligkeit", "speed", "reaktion"],
  coordination: ["koordination", "coordination"],
  balance: ["balance", "gleichgewicht"],
  mobility: ["mobilität", "mobility", "beweglichkeit"],
  grip: ["grip", "griffkraft", "griff"],
  ocr_technique: ["ocr", "ocr-technik", "ocr technik", "obstacle"],
  recovery: ["regeneration", "recovery", "cooldown"],
  teamwork: ["teamwork", "team", "partner"],
};

const FORMAT_CATEGORY_BONUS: Readonly<Partial<Record<TrainingFormat, readonly ExerciseCategory[]>>> = {
  "rig-run": ["running", "grip-rig", "ocr-skill"],
  "run-exercise": ["running", "strength", "core", "carry-lift", "ocr-skill"],
  technique: ["ocr-skill", "grip-rig", "balance-agility", "throw"],
  relay: ["running", "balance-agility", "carry-lift", "general"],
  circuit: ["strength", "core", "carry-lift", "balance-agility", "general"],
  tabata: ["strength", "core", "running", "general"],
  amrap: ["strength", "core", "carry-lift", "running", "general"],
  emom: ["strength", "core", "carry-lift", "general"],
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Default time split: a bounded preparation phase, a dominant main part and a
 * short cooldown. Exact club rules can override this later without changing
 * the candidate-ranking algorithm.
 */
export function getTrainingPhaseBudgets(totalMinutes: number) {
  const warmup = clamp(Math.round(totalMinutes * 0.15), 8, 15);
  const cooldown = clamp(Math.round(totalMinutes * 0.1), 5, 10);
  return {
    warmup,
    main: Math.max(1, totalMinutes - warmup - cooldown),
    cooldown,
  } as const;
}

export function getTrainingPhaseItemCount(kind: TrainingPhaseKind, durationMinutes: number): number {
  if (kind === "warmup" || kind === "cooldown") return durationMinutes >= 8 ? 2 : 1;
  if (durationMinutes <= 35) return 3;
  if (durationMinutes <= 60) return 4;
  return 5;
}

export function distributeTrainingMinutes(total: number, count: number): readonly number[] {
  if (count <= 0) return [];
  const base = Math.floor(total / count);
  const remainder = total % count;
  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
}

export function inferTrainingPhase(candidate: TrainingDraftExerciseCandidate): TrainingPhaseKind {
  if (candidate.defaultPhase) return candidate.defaultPhase;
  if (candidate.category === "warmup" || candidate.category === "mobility") return "warmup";
  if (candidate.category === "cooldown") return "cooldown";
  return "main";
}

function isEligible(candidate: TrainingDraftExerciseCandidate, input: TrainingDraftInput): boolean {
  if (input.minAge != null && candidate.minAge != null && candidate.minAge > input.minAge) return false;
  if ((input.avoidBodyRegions ?? []).some((region) => bodyRegionsOverlap([region], candidate.bodyRegions))) return false;
  return true;
}

function planningGoalTokens(goals: readonly string[]): readonly string[] {
  return [...new Set(goals.flatMap((goal) =>
    goal
      .toLocaleLowerCase("de-DE")
      .split(/[^\p{L}\p{N}]+/u)
      .map((term) => term.trim())
      .filter((term) => term.length >= 3),
  ))];
}

function enrichedContextScore(candidate: TrainingDraftExerciseCandidate, goals: readonly string[]): number {
  const tokens = planningGoalTokens(goals);
  if (tokens.length === 0) return 0;

  const movementText = (candidate.movementPatterns ?? [])
    .join(" ")
    .toLocaleLowerCase("de-DE");
  const planningText = (candidate.planningText ?? "").toLocaleLowerCase("de-DE");

  const movementMatches = new Set(tokens.filter((token) => movementText.includes(token))).size;
  const detailMatches = new Set(tokens.filter((token) => planningText.includes(token))).size;

  return Math.min(movementMatches * 9, 18) + Math.min(detailMatches * 4, 20);
}

function explicitGoalScore(candidate: TrainingDraftExerciseCandidate, normalizedGoals: readonly string[]): number {
  return (candidate.trainingGoals ?? []).reduce((score, goal) => {
    const terms = TRAINING_GOAL_TERMS[goal];
    return score + (normalizedGoals.some((requested) => terms.some((term) => requested.includes(term))) ? 28 : 0);
  }, 0);
}

function scoreCandidate(
  candidate: TrainingDraftExerciseCandidate,
  phase: TrainingPhaseKind,
  input: TrainingDraftInput,
): number {
  let score = 0;
  if (input.preferredExerciseIds.includes(candidate.id)) score += 1000;
  if (inferTrainingPhase(candidate) === phase) score += 80;

  const normalizedGoals = input.goals.map((goal) => goal.toLocaleLowerCase("de-DE"));
  const goalTerms = CATEGORY_GOAL_TERMS[candidate.category];
  if (normalizedGoals.some((goal) => goalTerms.some((term) => goal.includes(term)))) score += 35;
  score += explicitGoalScore(candidate, normalizedGoals);

  for (const bodyRegion of input.bodyRegions) {
    if (bodyRegionsOverlap([bodyRegion], candidate.bodyRegions)) score += 12;
  }

  if (candidate.exerciseType && input.exerciseTypes?.includes(candidate.exerciseType)) {
    score += phase === "main" ? 26 : 10;
  }

  for (const format of input.formats) {
    if (FORMAT_CATEGORY_BONUS[format]?.includes(candidate.category)) score += 12;
  }

  if (input.intensity === "technique" && ["ocr-skill", "grip-rig", "balance-agility", "mobility"].includes(candidate.category)) {
    score += 12;
  }
  if (input.intensity === "conditioning" && ["running", "strength", "carry-lift", "core"].includes(candidate.category)) {
    score += 12;
  }

  if (phase !== "main") {
    if (candidate.riskLevel === "low") score += 10;
    if (candidate.impactLevel === "high") score -= 20;
  }
  if ((input.audience === "kids" || input.audience === "youth") && candidate.difficulty === "advanced") score -= 16;
  if (input.audience === "kids" && candidate.impactLevel === "high") score -= 10;

  const normalizedTags = candidate.tags.map((tag) => tag.toLocaleLowerCase("de-DE"));
  if (normalizedGoals.some((goal) => normalizedTags.some((tag) => goal.includes(tag) || tag.includes(goal)))) score += 8;

  score += enrichedContextScore(candidate, input.goals);
  return score;
}

function countOverlap(
  candidateValues: readonly string[] | undefined,
  selectedCounts: ReadonlyMap<string, number>,
): number {
  return (candidateValues ?? []).reduce((sum, value) => sum + (selectedCounts.get(value) ?? 0), 0);
}

function selectForPhase(
  candidates: readonly TrainingDraftExerciseCandidate[],
  phase: TrainingPhaseKind,
  count: number,
  input: TrainingDraftInput,
): readonly TrainingDraftExerciseCandidate[] {
  const pool = candidates
    .filter((candidate) => isEligible(candidate, input) && inferTrainingPhase(candidate) === phase)
    .map((candidate) => ({ candidate, baseScore: scoreCandidate(candidate, phase, input) }));

  const selected: TrainingDraftExerciseCandidate[] = [];
  const categoryCounts = new Map<ExerciseCategory, number>();
  const movementCounts = new Map<string, number>();
  const bodyRegionCounts = new Map<string, number>();
  const remaining = [...pool];

  while (selected.length < count && remaining.length > 0) {
    remaining.sort((left, right) => {
      const leftPenalty = (categoryCounts.get(left.candidate.category) ?? 0) * 13
        + countOverlap(left.candidate.movementPatterns, movementCounts) * 8
        + countOverlap(left.candidate.bodyRegions, bodyRegionCounts) * 4;
      const rightPenalty = (categoryCounts.get(right.candidate.category) ?? 0) * 13
        + countOverlap(right.candidate.movementPatterns, movementCounts) * 8
        + countOverlap(right.candidate.bodyRegions, bodyRegionCounts) * 4;
      return (right.baseScore - rightPenalty) - (left.baseScore - leftPenalty)
        || left.candidate.name.localeCompare(right.candidate.name);
    });

    const next = remaining.shift();
    if (!next) break;
    selected.push(next.candidate);
    categoryCounts.set(next.candidate.category, (categoryCounts.get(next.candidate.category) ?? 0) + 1);
    for (const pattern of next.candidate.movementPatterns ?? []) {
      movementCounts.set(pattern, (movementCounts.get(pattern) ?? 0) + 1);
    }
    for (const region of next.candidate.bodyRegions) {
      bodyRegionCounts.set(region, (bodyRegionCounts.get(region) ?? 0) + 1);
    }
  }

  return selected;
}

export function composeTrainingDraft(
  input: TrainingDraftInput,
  candidates: readonly TrainingDraftExerciseCandidate[],
): TrainingDraft {
  const budgets = getTrainingPhaseBudgets(input.durationMinutes);
  const phaseKinds: readonly TrainingPhaseKind[] = ["warmup", "main", "cooldown"];
  const selectedByPhase = new Map<TrainingPhaseKind, readonly TrainingDraftExerciseCandidate[]>();
  const warnings: string[] = [];

  for (const phase of phaseKinds) {
    const durationMinutes = budgets[phase];
    const count = getTrainingPhaseItemCount(phase, durationMinutes);
    if (input.minAge != null) {
      const requestedMinAge = input.minAge;
      const ageRestricted = candidates
        .filter((candidate) => inferTrainingPhase(candidate) === phase && candidate.minAge != null && candidate.minAge > requestedMinAge)
        .map((candidate) => `${candidate.name} (${candidate.id})`);
      if (ageRestricted.length > 0) {
        warnings.push(`${ageRestricted.join(", ")} wurde wegen des Mindestalters aus ${TRAINING_PHASE_LABELS[phase]} ausgeschlossen.`);
      }
    }
    const selected = selectForPhase(candidates, phase, count, input);
    if (selected.length === 0) {
      warnings.push(`Keine passende Übung für ${TRAINING_PHASE_LABELS[phase]} gefunden.`);
    }
    selectedByPhase.set(phase, selected);
  }

  const phases = phaseKinds.map((kind) => {
    const selected = selectedByPhase.get(kind) ?? [];
    const durations = distributeTrainingMinutes(budgets[kind], selected.length);
    return {
      id: `draft-${kind}`,
      kind,
      title: TRAINING_PHASE_LABELS[kind],
      items: selected.map((candidate, index) => ({
        id: `draft-${kind}-${candidate.id}`,
        exercise: {
          id: candidate.id,
          name: candidate.name,
          riskLevel: candidate.riskLevel,
          bodyRegions: candidate.bodyRegions.filter(isBodyRegion),
          equipment: candidate.equipment,
          equipmentRequirements: candidate.equipmentRequirements,
          stationCapacity: candidate.stationCapacity,
          setupSeconds: candidate.setupSeconds ?? undefined,
          transitionSeconds: candidate.transitionSeconds ?? undefined,
        },
        durationMinutes: durations[index] ?? 0,
        format: kind === "main" ? input.formats[0] : "free",
      })),
    };
  });

  const session: TrainingSession = {
    id: "training-draft",
    title: "OCR Trainingsentwurf",
    group: {
      id: "quick-create-group",
      name: "Quick Create Gruppe",
      audience: input.audience,
      minAge: input.minAge,
      maxAge: input.maxAge,
      participantCount: input.participantCount,
      organizationMode: input.organizationMode,
      teamSize: input.organizationMode === "team" ? input.teamSize : undefined,
    },
    totalDurationMinutes: input.durationMinutes,
    focus: input.goals,
    phases,
  };

  return {
    source: "deterministic",
    session,
    validationIssues: validateTrainingSession(session, undefined, input.availableEquipment),
    warnings,
  };
}
