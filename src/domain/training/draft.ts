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
  readonly formats: readonly TrainingFormat[];
  readonly intensity: DraftIntensity;
  readonly preferredExerciseIds: readonly string[];
  readonly availableEquipment?: readonly TrainingEquipmentAvailability[];
  readonly minAge?: number;
  readonly maxAge?: number;
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
  readonly tags: readonly string[];
  readonly defaultDurationSeconds: number | null;
  readonly instructions?: string;
  readonly level1?: string;
  readonly level2?: string;
  readonly level3?: string;
}

export interface TrainingDraft {
  readonly source: "deterministic";
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

function phaseBudgets(totalMinutes: number) {
  const warmup = clamp(Math.round(totalMinutes * 0.15), 8, 15);
  const cooldown = clamp(Math.round(totalMinutes * 0.1), 5, 10);
  return {
    warmup,
    main: Math.max(1, totalMinutes - warmup - cooldown),
    cooldown,
  } as const;
}

function itemCountForPhase(kind: TrainingPhaseKind, durationMinutes: number): number {
  if (kind === "warmup" || kind === "cooldown") return durationMinutes >= 8 ? 2 : 1;
  if (durationMinutes <= 35) return 3;
  if (durationMinutes <= 60) return 4;
  return 5;
}

function distributeMinutes(total: number, count: number): readonly number[] {
  if (count <= 0) return [];
  const base = Math.floor(total / count);
  const remainder = total % count;
  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
}

function inferredPhase(candidate: TrainingDraftExerciseCandidate): TrainingPhaseKind {
  if (candidate.defaultPhase) return candidate.defaultPhase;
  if (candidate.category === "warmup" || candidate.category === "mobility") return "warmup";
  if (candidate.category === "cooldown") return "cooldown";
  return "main";
}

function isEligible(candidate: TrainingDraftExerciseCandidate, input: TrainingDraftInput): boolean {
  if (input.minAge != null && candidate.minAge != null && candidate.minAge > input.minAge) return false;
  return true;
}

function scoreCandidate(
  candidate: TrainingDraftExerciseCandidate,
  phase: TrainingPhaseKind,
  input: TrainingDraftInput,
): number {
  let score = 0;
  if (input.preferredExerciseIds.includes(candidate.id)) score += 1000;
  if (inferredPhase(candidate) === phase) score += 80;

  const normalizedGoals = input.goals.map((goal) => goal.toLocaleLowerCase("de-DE"));
  const goalTerms = CATEGORY_GOAL_TERMS[candidate.category];
  if (normalizedGoals.some((goal) => goalTerms.some((term) => goal.includes(term)))) score += 35;

  for (const bodyRegion of input.bodyRegions) {
    if (bodyRegionsOverlap([bodyRegion], candidate.bodyRegions)) score += 10;
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
  if (phase !== "main" && candidate.riskLevel === "low") score += 8;

  const normalizedTags = candidate.tags.map((tag) => tag.toLocaleLowerCase("de-DE"));
  if (normalizedGoals.some((goal) => normalizedTags.some((tag) => goal.includes(tag) || tag.includes(goal)))) score += 8;

  return score;
}

function selectForPhase(
  candidates: readonly TrainingDraftExerciseCandidate[],
  phase: TrainingPhaseKind,
  count: number,
  input: TrainingDraftInput,
): readonly TrainingDraftExerciseCandidate[] {
  const pool = candidates
    .filter((candidate) => isEligible(candidate, input) && inferredPhase(candidate) === phase)
    .map((candidate) => ({ candidate, baseScore: scoreCandidate(candidate, phase, input) }))
    .sort((left, right) => right.baseScore - left.baseScore || left.candidate.name.localeCompare(right.candidate.name) || left.candidate.id.localeCompare(right.candidate.id));

  const selected: TrainingDraftExerciseCandidate[] = [];
  const categoryCounts = new Map<ExerciseCategory, number>();
  const remaining = [...pool];

  while (selected.length < count && remaining.length > 0) {
    remaining.sort((left, right) => {
      const leftPenalty = (categoryCounts.get(left.candidate.category) ?? 0) * 14;
      const rightPenalty = (categoryCounts.get(right.candidate.category) ?? 0) * 14;
      const leftScore = left.baseScore - leftPenalty;
      const rightScore = right.baseScore - rightPenalty;
      return rightScore - leftScore || left.candidate.name.localeCompare(right.candidate.name) || left.candidate.id.localeCompare(right.candidate.id);
    });
    const next = remaining.shift();
    if (!next) break;
    selected.push(next.candidate);
    categoryCounts.set(next.candidate.category, (categoryCounts.get(next.candidate.category) ?? 0) + 1);
  }

  return selected;
}

export function composeTrainingDraft(
  input: TrainingDraftInput,
  candidates: readonly TrainingDraftExerciseCandidate[],
): TrainingDraft {
  const budgets = phaseBudgets(input.durationMinutes);
  const phaseKinds: readonly TrainingPhaseKind[] = ["warmup", "main", "cooldown"];
  const selectedFormat = input.formats.includes("circuit")
    ? "circuit"
    : input.formats[0] ?? "free";
  const warnings: string[] = [];

  const phases = phaseKinds.map((kind) => {
    const budget = budgets[kind];
    const selected = selectForPhase(candidates, kind, itemCountForPhase(kind, budget), input);
    if (selected.length === 0) warnings.push(`Keine passende Übung für ${TRAINING_PHASE_LABELS[kind]} gefunden.`);
    const durations = distributeMinutes(budget, selected.length);

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
        },
        durationMinutes: durations[index] ?? 0,
        format: selectedFormat,
        instructions: candidate.instructions,
        levelLabel: candidate.level2,
      })),
    };
  });

  const selectedIds = new Set(phases.flatMap((phase) => phase.items.map((item) => item.exercise.id)));
  for (const preferredId of input.preferredExerciseIds) {
    if (!selectedIds.has(preferredId)) warnings.push(`Wunschübung ${preferredId} konnte nicht passend eingeplant werden.`);
  }

  const session: TrainingSession = {
    id: "quick-create-draft",
    title: "Quick Create Trainingsentwurf",
    group: {
      id: "quick-create-group",
      name: "Quick Create",
      audience: input.audience,
      minAge: input.minAge,
      maxAge: input.maxAge,
      participantCount: input.participantCount,
    },
    totalDurationMinutes: input.durationMinutes,
    focus: input.goals,
    phases,
  };

  const validationIssues = validateTrainingSession(session, undefined, input.availableEquipment);
  return {
    source: "deterministic",
    session,
    validationIssues,
    warnings,
  };
}
