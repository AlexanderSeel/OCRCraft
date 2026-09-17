import {
  bodyRegionParent,
  bodyRegionsOverlap,
  getBodyRegionAntagonists,
  isBodyRegion,
  normalizeBodyRegionId,
} from "../../domain/body-regions";
import type { ExerciseTrainingGoal } from "../../domain/exercise/classification";
import {
  distributeTrainingMinutes,
  getTrainingPhaseBudgets,
  getTrainingPhaseItemCount,
  inferTrainingPhase,
  type TrainingDraft,
  type TrainingDraftExerciseCandidate,
  type TrainingDraftInput,
} from "../../domain/training/draft";
import {
  TRAINING_PHASE_LABELS,
  type TrainingFormat,
  type TrainingPhaseKind,
  type TrainingSession,
} from "../../domain/training/model";
import { validateTrainingSession } from "../../domain/training/validation";

const GOAL_TERMS: Readonly<Record<ExerciseTrainingGoal, readonly string[]>> = {
  strength: ["kraft", "strength"],
  strength_endurance: ["kraftausdauer", "strength endurance"],
  endurance: ["ausdauer", "endurance", "laufen", "running"],
  speed: ["schnelligkeit", "speed", "reaktion", "reaction"],
  coordination: ["koordination", "coordination"],
  balance: ["balance", "gleichgewicht"],
  mobility: ["mobilität", "mobility", "beweglichkeit"],
  grip: ["grip", "griff", "griffkraft"],
  ocr_technique: ["ocr", "ocr-technik", "ocr technik", "obstacle", "hindernis"],
  recovery: ["regeneration", "recovery", "cooldown"],
  teamwork: ["team", "teamwork", "partner"],
};

const FORMAT_CATEGORY_BONUS: Readonly<Partial<Record<TrainingFormat, readonly string[]>>> = {
  circuit: ["strength", "core", "carry-lift", "balance-agility", "general"],
  tabata: ["strength", "core", "running", "general"],
  amrap: ["strength", "core", "carry-lift", "running", "general"],
  emom: ["strength", "core", "carry-lift", "general"],
  "rig-run": ["running", "grip-rig", "ocr-skill"],
  "run-exercise": ["running", "strength", "core", "carry-lift", "ocr-skill"],
  technique: ["ocr-skill", "grip-rig", "balance-agility", "throw", "mobility"],
  relay: ["running", "balance-agility", "carry-lift", "general"],
};

const MOVEMENT_COUNTERPARTS: Readonly<Record<string, readonly string[]>> = {
  push: ["pull"],
  pull: ["push"],
  squat: ["hinge"],
  hinge: ["squat"],
  rotate: ["brace"],
  brace: ["rotate"],
  jump: ["balance"],
};

const UPPER_BODY = new Set([
  "neck", "traps", "shoulders", "rear-delts", "chest", "upper-back", "lats",
  "upper-arms", "biceps", "triceps", "forearms-grip",
]);
const CORE_BODY = new Set(["core", "abs", "obliques", "serratus", "lower-back"]);
const LOWER_BODY = new Set([
  "hips", "glutes", "quadriceps", "hamstrings", "adductors", "calves", "tibialis", "ankles-feet",
]);

/**
 * Local, deterministic training planner. It never calls an AI provider. Selection
 * is based on approved exercise metadata plus conservative training heuristics:
 * phase suitability, requested goals/types/muscles, movement and muscle balance,
 * impact spacing, fatigue sequencing, audience suitability and equipment reality.
 */
export function composeSportsTrainingDraft(
  input: TrainingDraftInput,
  candidates: readonly TrainingDraftExerciseCandidate[],
): TrainingDraft {
  const budgets = getTrainingPhaseBudgets(input.durationMinutes);
  const phaseKinds: readonly TrainingPhaseKind[] = ["warmup", "main", "cooldown"];
  const warnings: string[] = [
    "Lokaler Sportalgorithmus: deterministische Auswahl ohne AI; Fokus auf Phasenlogik, Bewegungsvielfalt, Muskelbalance, Belastungsreihenfolge und Sicherheitsmetadaten.",
  ];

  const phases = phaseKinds.map((kind) => {
    const budget = budgets[kind];
    const count = getTrainingPhaseItemCount(kind, budget);
    const selected = selectForPhase(candidates, kind, count, input);
    if (selected.length === 0) {
      warnings.push(`Keine passende Übung für ${TRAINING_PHASE_LABELS[kind]} gefunden.`);
    }
    const durations = distributeTrainingMinutes(budget, selected.length);
    return {
      id: `sports-${kind}`,
      kind,
      title: TRAINING_PHASE_LABELS[kind],
      items: selected.map((candidate, index) => ({
        id: `sports-${kind}-${candidate.id}`,
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
        format: formatForPhase(kind, input),
        instructions: candidate.instructions,
        levelLabel: candidate.level2,
      })),
    };
  });

  const selectedCandidates = phases.flatMap((phase) =>
    phase.items.flatMap((item) => candidates.find((candidate) => candidate.id === item.exercise.id) ?? []),
  );
  appendCoverageWarnings(warnings, input, selectedCandidates);

  const session: TrainingSession = {
    id: "local-sports-training-draft",
    title: "Lokaler OCR-Trainingsentwurf",
    group: {
      id: "local-sports-training-group",
      name: "Lokaler Sportalgorithmus",
      audience: input.audience,
      minAge: input.minAge,
      maxAge: input.maxAge,
      participantCount: input.participantCount,
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

function selectForPhase(
  candidates: readonly TrainingDraftExerciseCandidate[],
  phase: TrainingPhaseKind,
  count: number,
  input: TrainingDraftInput,
): readonly TrainingDraftExerciseCandidate[] {
  const pool = candidates
    .filter((candidate) => isEligible(candidate, phase, input))
    .map((candidate) => ({ candidate, baseScore: baseScore(candidate, phase, input) }));

  const selected: TrainingDraftExerciseCandidate[] = [];
  const remaining = [...pool];
  while (selected.length < count && remaining.length > 0) {
    const slot = selected.length;
    remaining.sort((left, right) => {
      const leftScore = left.baseScore + dynamicScore(left.candidate, selected, slot, count, phase, input);
      const rightScore = right.baseScore + dynamicScore(right.candidate, selected, slot, count, phase, input);
      return rightScore - leftScore
        || left.candidate.name.localeCompare(right.candidate.name)
        || left.candidate.id.localeCompare(right.candidate.id);
    });
    const next = remaining.shift();
    if (!next) break;
    selected.push(next.candidate);
  }
  return selected;
}

function isEligible(
  candidate: TrainingDraftExerciseCandidate,
  phase: TrainingPhaseKind,
  input: TrainingDraftInput,
): boolean {
  if (inferTrainingPhase(candidate) !== phase) return false;
  if (input.minAge != null && candidate.minAge != null && candidate.minAge > input.minAge) return false;
  if ((input.avoidBodyRegions ?? []).some((region) => bodyRegionsOverlap([region], candidate.bodyRegions))) return false;
  return true;
}

function baseScore(
  candidate: TrainingDraftExerciseCandidate,
  phase: TrainingPhaseKind,
  input: TrainingDraftInput,
): number {
  let score = 0;
  if (input.preferredExerciseIds.includes(candidate.id)) score += 1000;

  const requestedGoals = input.goals.map(normalizeText);
  for (const goal of candidate.trainingGoals ?? []) {
    if (requestedGoals.some((requested) => GOAL_TERMS[goal].some((term) => requested.includes(term)))) score += 34;
  }

  for (const region of input.bodyRegions) {
    if (bodyRegionsOverlap([region], candidate.bodyRegions)) score += phase === "main" ? 24 : 12;
  }

  if (candidate.exerciseType && input.exerciseTypes?.includes(candidate.exerciseType)) {
    score += phase === "main" ? 34 : 10;
  }

  for (const format of input.formats) {
    if (FORMAT_CATEGORY_BONUS[format]?.includes(candidate.category)) score += 14;
  }

  const planningText = normalizeText([
    candidate.name,
    candidate.category,
    ...(candidate.tags ?? []),
    ...(candidate.movementPatterns ?? []),
    candidate.planningText ?? "",
  ].join(" "));
  for (const goal of requestedGoals) {
    for (const token of goal.split(/[^\p{L}\p{N}]+/u).filter((value) => value.length >= 3)) {
      if (planningText.includes(token)) score += 3;
    }
  }

  score += phaseSuitabilityScore(candidate, phase, input);
  score += equipmentScore(candidate, input);
  return score;
}

function phaseSuitabilityScore(
  candidate: TrainingDraftExerciseCandidate,
  phase: TrainingPhaseKind,
  input: TrainingDraftInput,
): number {
  let score = 0;
  const type = candidate.exerciseType;
  if (phase === "warmup") {
    if (type === "mobility" || type === "drill" || type === "game") score += 30;
    if (candidate.impactLevel === "low") score += 18;
    if (candidate.riskLevel === "low") score += 14;
    if (candidate.impactLevel === "high") score -= 30;
    if (candidate.riskLevel === "high") score -= 35;
  } else if (phase === "cooldown") {
    if (type === "recovery" || type === "mobility") score += 38;
    if (candidate.impactLevel === "low") score += 22;
    if (candidate.riskLevel === "low") score += 16;
    if (type === "obstacle" || type === "strength" || candidate.impactLevel === "high") score -= 35;
  } else {
    if (input.intensity === "technique" && (type === "skill" || type === "obstacle" || type === "drill")) score += 24;
    if (input.intensity === "conditioning" && (type === "endurance" || type === "strength")) score += 24;
    if (input.intensity === "balanced" && candidate.impactLevel !== "high") score += 6;
  }

  if (input.audience === "kids") {
    if (type === "game" || type === "drill") score += 18;
    if (candidate.coordinationComplexity === "complex") score -= 14;
    if (candidate.difficulty === "advanced") score -= 22;
    if (candidate.impactLevel === "high") score -= 16;
    if (candidate.riskLevel === "high") score -= 28;
  } else if (input.audience === "youth") {
    if (candidate.difficulty === "advanced") score -= 10;
    if (candidate.riskLevel === "high") score -= 12;
  }
  return score;
}

function equipmentScore(candidate: TrainingDraftExerciseCandidate, input: TrainingDraftInput): number {
  if (!input.availableEquipment?.length || candidate.equipmentRequirements.length === 0) return 0;
  const available = new Map(input.availableEquipment.map((item) => [item.equipmentId, item.quantityAvailable]));
  let score = 0;
  for (const requirement of candidate.equipmentRequirements) {
    const stock = available.get(requirement.equipmentId);
    if (stock == null) continue;
    if (stock === 0) score -= 100;
    else if (stock < requirement.quantityPerStation) score -= 45;
    else score += 4;
  }
  return score;
}

function dynamicScore(
  candidate: TrainingDraftExerciseCandidate,
  selected: readonly TrainingDraftExerciseCandidate[],
  slot: number,
  count: number,
  phase: TrainingPhaseKind,
  input: TrainingDraftInput,
): number {
  let score = 0;
  const selectedPatterns = new Set(selected.flatMap((item) => item.movementPatterns ?? []));
  const selectedRegions = new Set(selected.flatMap((item) => item.bodyRegions.map(parentRegion)).filter(Boolean));
  const selectedMacros = new Set(selected.flatMap(macroRegions));
  const selectedTypes = new Set(selected.flatMap((item) => item.exerciseType ? [item.exerciseType] : []));

  const categoryRepeats = selected.filter((item) => item.category === candidate.category).length;
  score -= categoryRepeats * 14;
  const patternRepeats = (candidate.movementPatterns ?? []).filter((pattern) => selectedPatterns.has(pattern)).length;
  score -= patternRepeats * 9;

  for (const focus of input.bodyRegions) {
    if (!selected.some((item) => bodyRegionsOverlap([focus], item.bodyRegions)) && bodyRegionsOverlap([focus], candidate.bodyRegions)) {
      score += 26;
    }
  }
  if (candidate.exerciseType && input.exerciseTypes?.includes(candidate.exerciseType) && !selectedTypes.has(candidate.exerciseType)) {
    score += 28;
  }

  const candidateParents = candidate.bodyRegions.map(parentRegion).filter(Boolean);
  for (const selectedRegion of selectedRegions) {
    if (getBodyRegionAntagonists(selectedRegion).some((antagonist) => candidateParents.includes(bodyRegionParent(antagonist)))) {
      score += 16;
      break;
    }
  }

  for (const selectedPattern of selectedPatterns) {
    if ((MOVEMENT_COUNTERPARTS[selectedPattern] ?? []).some((counterpart) => candidate.movementPatterns?.includes(counterpart))) {
      score += 14;
      break;
    }
  }

  for (const macro of macroRegions(candidate)) {
    if (!selectedMacros.has(macro)) score += 8;
  }

  const previous = selected.at(-1);
  if (previous?.impactLevel === "high" && candidate.impactLevel === "high") score -= 34;
  if (previous?.riskLevel === "high" && candidate.riskLevel === "high") score -= 20;
  if (previous && shareBodyLoad(previous, candidate)) score -= 10;

  if (phase === "main") {
    const early = slot < Math.ceil(count / 2);
    if (early && (candidate.exerciseType === "skill" || candidate.exerciseType === "obstacle" || candidate.exerciseType === "drill")) score += 14;
    if (!early && input.intensity === "conditioning" && (candidate.exerciseType === "endurance" || candidate.exerciseType === "strength")) score += 12;
    if (!early && candidate.coordinationComplexity === "complex" && candidate.impactLevel === "high") score -= 12;
  }
  return score;
}

function shareBodyLoad(left: TrainingDraftExerciseCandidate, right: TrainingDraftExerciseCandidate): boolean {
  return left.bodyRegions.some((region) => bodyRegionsOverlap([region], right.bodyRegions));
}

function macroRegions(candidate: TrainingDraftExerciseCandidate): readonly string[] {
  const result = new Set<string>();
  for (const region of candidate.bodyRegions.map(parentRegion).filter(Boolean)) {
    if (UPPER_BODY.has(region)) result.add("upper");
    if (CORE_BODY.has(region)) result.add("core");
    if (LOWER_BODY.has(region)) result.add("lower");
    if (region === "full-body") result.add("full");
  }
  return [...result];
}

function parentRegion(value: string): string {
  const normalized = normalizeBodyRegionId(value);
  return normalized ? bodyRegionParent(normalized) : value;
}

function formatForPhase(kind: TrainingPhaseKind, input: TrainingDraftInput): TrainingFormat {
  if (kind !== "main") return "free";
  if (input.formats.includes("circuit")) return "circuit";
  return input.formats[0] ?? "free";
}

function appendCoverageWarnings(
  warnings: string[],
  input: TrainingDraftInput,
  selected: readonly TrainingDraftExerciseCandidate[],
): void {
  for (const focus of input.bodyRegions) {
    if (!selected.some((candidate) => bodyRegionsOverlap([focus], candidate.bodyRegions))) {
      warnings.push(`Körperfokus ${focus} konnte mit dem freigegebenen Übungspool nicht abgedeckt werden.`);
    }
  }
  for (const type of input.exerciseTypes ?? []) {
    if (!selected.some((candidate) => candidate.exerciseType === type)) {
      warnings.push(`Gewünschter Übungstyp ${type} konnte nicht sinnvoll in die Einheit integriert werden.`);
    }
  }

  const main = selected.filter((candidate) => inferTrainingPhase(candidate) === "main");
  const patterns = new Set(main.flatMap((candidate) => candidate.movementPatterns ?? []));
  for (const [pattern, counterparts] of Object.entries(MOVEMENT_COUNTERPARTS)) {
    if (patterns.has(pattern) && !counterparts.some((counterpart) => patterns.has(counterpart))) {
      warnings.push(`Bewegungsbalance: ${pattern} ist enthalten, aber kein typisches Gegenmuster (${counterparts.join("/")}).`);
    }
  }

  const focusParents = new Set(input.bodyRegions.map(parentRegion));
  const selectedParents = new Set(selected.flatMap((candidate) => candidate.bodyRegions.map(parentRegion)));
  for (const focus of focusParents) {
    const antagonists = getBodyRegionAntagonists(focus);
    if (antagonists.length > 0 && !antagonists.some((antagonist) => selectedParents.has(bodyRegionParent(antagonist)))) {
      warnings.push(`Muskelbalance: zum Fokus ${focus} wurde kein typischer Gegenmuskel eingeplant.`);
    }
  }
}

function normalizeText(value: string): string {
  return value.trim().toLocaleLowerCase("de-DE");
}
