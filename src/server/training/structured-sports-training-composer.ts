import {
  bodyRegionsOverlap,
  getBodyRegionAntagonists,
  isBodyRegion,
} from "../../domain/body-regions";
import {
  exerciseTrainingGoalLabels,
  type ExerciseTrainingGoal,
} from "../../domain/exercise/classification";
import type { ExerciseCategory } from "../../domain/exercise/model";
import {
  distributeTrainingMinutes,
  getTrainingPhaseBudgets,
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
import { composeSportsTrainingDraft } from "./sports-training-composer";

export interface StructuredSportsTrainingInput extends TrainingDraftInput {
  readonly warmupExerciseCount: number;
  readonly mainExerciseCount: number;
  readonly mainPartExerciseCounts?: readonly number[];
  readonly cooldownExerciseCount: number;
  readonly mainPartCount: number;
  readonly organizationMode: "solo" | "team";
  readonly teamSize?: number;
}

type CandidateWithHistory = TrainingDraftExerciseCandidate & { readonly recentUseCount?: number };

const FORMAT_CATEGORY_BONUS: Readonly<Partial<Record<TrainingFormat, readonly ExerciseCategory[]>>> = {
  circuit: ["strength", "core", "carry-lift", "balance-agility", "general"],
  tabata: ["strength", "core", "running", "general"],
  amrap: ["strength", "core", "carry-lift", "running", "general"],
  emom: ["strength", "core", "carry-lift", "general"],
  "rig-run": ["running", "grip-rig", "ocr-skill"],
  "run-exercise": ["running", "strength", "core", "carry-lift", "ocr-skill"],
  technique: ["ocr-skill", "grip-rig", "balance-agility", "throw", "mobility"],
  relay: ["running", "balance-agility", "carry-lift", "general"],
  partner: ["strength", "core", "carry-lift", "balance-agility", "general"],
};

const MOVEMENT_COUNTERPARTS: Readonly<Record<string, readonly string[]>> = {
  push: ["pull"],
  pull: ["push"],
  squat: ["hinge"],
  hinge: ["squat"],
  rotate: ["brace"],
  brace: ["rotate"],
  jump: ["balance"],
  balance: ["jump"],
};

/**
 * Adds an explicit coach-controlled structure around the existing sports planner.
 * The canonical session still has warm-up/main/cooldown, while requested main
 * parts are persisted as numbered blocks inside the main phase. Candidate choice
 * is greedy per slot so goal fit, antagonist/counterpart balance and diversity
 * can react to exercises already chosen in the same and previous blocks.
 */
export function composeStructuredSportsTrainingDraft(
  input: StructuredSportsTrainingInput,
  candidates: readonly TrainingDraftExerciseCandidate[],
): TrainingDraft {
  const backbone = composeSportsTrainingDraft(input, candidates);
  const budgets = getTrainingPhaseBudgets(input.durationMinutes);
  const backboneRank = new Map<string, number>();
  backbone.session.phases.flatMap((phase) => phase.items).forEach((item, index) => {
    backboneRank.set(item.exercise.id, 500 - index * 10);
  });

  const used = new Set<string>();
  const warnings = [...backbone.warnings];
  const warmup = selectCandidates("warmup", input.warmupExerciseCount, input, candidates, used, backboneRank);
  warmup.forEach((candidate) => used.add(candidate.id));

  const mainParts: TrainingDraftExerciseCandidate[][] = [];
  for (let part = 0; part < input.mainPartCount; part += 1) {
    const requestedCount = mainPartExerciseCount(input, part);
    const selected = selectCandidates(
      "main",
      requestedCount,
      input,
      candidates,
      used,
      backboneRank,
      part,
      mainParts.flat(),
    );
    selected.forEach((candidate) => used.add(candidate.id));
    mainParts.push(selected);
  }

  const mainDemands = mainParts.flat();
  const cooldown = selectCandidates(
    "cooldown",
    input.cooldownExerciseCount,
    input,
    candidates,
    used,
    backboneRank,
    0,
    mainDemands,
  );
  cooldown.forEach((candidate) => used.add(candidate.id));

  appendAvailabilityWarnings(warnings, input, warmup, mainParts, cooldown);
  appendOrganizationWarnings(warnings, input);
  appendBalanceWarnings(warnings, input, mainDemands);

  const mainBudgets = distributeTrainingMinutes(budgets.main, input.mainPartCount);
  const mainItems = mainParts.flatMap((selected, partIndex) => {
    const durations = distributeTrainingMinutes(mainBudgets[partIndex] ?? 0, selected.length);
    return selected.map((candidate, itemIndex) => buildItem(
      candidate,
      `structured-main-${partIndex + 1}-${candidate.id}`,
      durations[itemIndex] ?? 0,
      "main",
      input,
      partIndex + 1,
    ));
  });

  const phases = [
    buildPhase("warmup", "structured-warmup", TRAINING_PHASE_LABELS.warmup, warmup, budgets.warmup, input),
    {
      id: "structured-main",
      kind: "main" as const,
      title: TRAINING_PHASE_LABELS.main,
      items: mainItems,
    },
    buildPhase("cooldown", "structured-cooldown", TRAINING_PHASE_LABELS.cooldown, cooldown, budgets.cooldown, input),
  ];

  const session: TrainingSession = {
    id: "structured-local-sports-training-draft",
    title: "Strukturierter OCR-Trainingsentwurf",
    group: {
      id: "structured-local-sports-training-group",
      name: input.organizationMode === "team" ? "Lokaler Sportalgorithmus · Team" : "Lokaler Sportalgorithmus · Solo",
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

function mainPartExerciseCount(input: StructuredSportsTrainingInput, partIndex: number): number {
  return input.mainPartExerciseCounts?.[partIndex] ?? input.mainExerciseCount;
}

function selectCandidates(
  phase: TrainingPhaseKind,
  count: number,
  input: StructuredSportsTrainingInput,
  candidates: readonly TrainingDraftExerciseCandidate[],
  used: ReadonlySet<string>,
  backboneRank: ReadonlyMap<string, number>,
  partIndex = 0,
  earlierMainCandidates: readonly TrainingDraftExerciseCandidate[] = [],
): TrainingDraftExerciseCandidate[] {
  const remaining = candidates
    .filter((candidate) => !used.has(candidate.id))
    .filter((candidate) => inferTrainingPhase(candidate) === phase)
    .filter((candidate) => input.minAge == null || candidate.minAge == null || candidate.minAge <= input.minAge)
    .filter((candidate) => !(input.avoidBodyRegions ?? []).some((region) => bodyRegionsOverlap([region], candidate.bodyRegions)));

  const selected: TrainingDraftExerciseCandidate[] = [];
  while (selected.length < count && remaining.length > 0) {
    const alreadySelected = [...earlierMainCandidates, ...selected];
    remaining.sort((left, right) => {
      const leftScore = structuredScore(left, phase, input, backboneRank, partIndex, alreadySelected, selected);
      const rightScore = structuredScore(right, phase, input, backboneRank, partIndex, alreadySelected, selected);
      return rightScore - leftScore
        || left.name.localeCompare(right.name)
        || left.id.localeCompare(right.id);
    });
    const next = remaining.shift();
    if (!next) break;
    selected.push(next);
  }
  return selected;
}

function structuredScore(
  candidate: TrainingDraftExerciseCandidate,
  phase: TrainingPhaseKind,
  input: StructuredSportsTrainingInput,
  backboneRank: ReadonlyMap<string, number>,
  partIndex: number,
  allEarlierMainCandidates: readonly TrainingDraftExerciseCandidate[],
  currentBlock: readonly TrainingDraftExerciseCandidate[],
): number {
  let score = backboneRank.get(candidate.id) ?? 0;
  if (input.preferredExerciseIds.includes(candidate.id)) score += 900;

  score += goalScore(candidate, input.goals, phase);
  score += formatScore(candidate, input.formats, phase);

  for (const region of input.bodyRegions) {
    if (bodyRegionsOverlap([region], candidate.bodyRegions)) score += phase === "main" ? 60 : 24;
  }
  if (candidate.exerciseType && input.exerciseTypes?.includes(candidate.exerciseType)) {
    score += phase === "main" ? 45 : 14;
  }

  if (phase !== "main") {
    if (candidate.riskLevel === "low") score += 20;
    if (candidate.impactLevel === "high") score -= 30;
  }

  if (phase === "main" && input.formats.includes("partner")) {
    if (candidate.trainingGoals?.includes("teamwork")) score += 100;
    const partnerContext = `${candidate.tags.join(" ")} ${candidate.planningText ?? ""}`.toLocaleLowerCase("de-DE");
    if (partnerContext.includes("partner") || partnerContext.includes("team")) score += 45;
    if (candidate.exerciseType === "game" || candidate.exerciseType === "drill") score += 30;
    if (candidate.stationCapacity >= 2) score += 20;
  }

  if (phase === "main" && input.organizationMode === "team") {
    if (candidate.trainingGoals?.includes("teamwork")) score += 70;
    if (candidate.exerciseType === "game" || candidate.exerciseType === "drill") score += 25;
    if (input.teamSize != null) {
      if (candidate.stationCapacity >= input.teamSize) score += 35;
      else score -= Math.min(60, (input.teamSize - candidate.stationCapacity) * 10);
    }
  }

  if (phase === "main") {
    score += movementCounterpartScore(candidate, allEarlierMainCandidates);
    score += antagonistScore(candidate, allEarlierMainCandidates);
    score += currentBlockDiversityScore(candidate, currentBlock);
    if (partIndex > 0) score += blockVarietyScore(candidate, allEarlierMainCandidates);
  } else if (phase === "warmup") {
    if (candidate.exerciseType === "mobility" || candidate.exerciseType === "drill") score += 25;
  } else if (phase === "cooldown") {
    if (candidate.exerciseType === "recovery" || candidate.exerciseType === "mobility") score += 30;
    score += recoveryDemandScore(candidate, allEarlierMainCandidates);
  }

  score -= Math.min(80, Number((candidate as CandidateWithHistory).recentUseCount ?? 0) * 12);
  return score;
}

function goalScore(
  candidate: TrainingDraftExerciseCandidate,
  goals: readonly string[],
  phase: TrainingPhaseKind,
): number {
  const requested = goals.map(normalizeText);
  let score = 0;
  for (const goal of candidate.trainingGoals ?? []) {
    const labels = goalTerms(goal);
    if (requested.some((value) => labels.some((term) => value.includes(term) || term.includes(value)))) {
      score += phase === "main" ? 42 : 16;
    }
  }
  const context = normalizeText(`${candidate.name} ${candidate.category} ${(candidate.tags ?? []).join(" ")} ${(candidate.planningText ?? "")}`);
  for (const requestedGoal of requested) {
    const tokens = requestedGoal.split(/[^\p{L}\p{N}]+/u).filter((token) => token.length >= 3);
    if (tokens.some((token) => context.includes(token))) score += phase === "main" ? 8 : 3;
  }
  return Math.min(score, phase === "main" ? 84 : 30);
}

function goalTerms(goal: ExerciseTrainingGoal): readonly string[] {
  const labels = exerciseTrainingGoalLabels[goal];
  const base = [goal.replaceAll("_", " "), labels.de, labels.en].map(normalizeText);
  if (goal === "grip") return [...base, "griff", "griffkraft"];
  if (goal === "ocr_technique") return [...base, "ocr", "hindernis", "obstacle", "technik"];
  if (goal === "strength_endurance") return [...base, "kraftausdauer"];
  return base;
}

function formatScore(
  candidate: TrainingDraftExerciseCandidate,
  formats: readonly TrainingFormat[],
  phase: TrainingPhaseKind,
): number {
  if (phase !== "main") return 0;
  return formats.reduce((sum, format) =>
    sum + (FORMAT_CATEGORY_BONUS[format]?.includes(candidate.category) ? 20 : 0), 0);
}

function movementCounterpartScore(
  candidate: TrainingDraftExerciseCandidate,
  selected: readonly TrainingDraftExerciseCandidate[],
): number {
  const selectedPatterns = new Set(selected.flatMap((item) => item.movementPatterns ?? []));
  let score = 0;
  for (const pattern of candidate.movementPatterns ?? []) {
    if ((MOVEMENT_COUNTERPARTS[pattern] ?? []).some((counterpart) => selectedPatterns.has(counterpart))) {
      score += 24;
    }
  }
  return Math.min(score, 48);
}

function antagonistScore(
  candidate: TrainingDraftExerciseCandidate,
  selected: readonly TrainingDraftExerciseCandidate[],
): number {
  const selectedRegions = selected.flatMap((item) => item.bodyRegions);
  if (selectedRegions.length === 0) return 0;
  const desiredAntagonists = new Set(selectedRegions.flatMap((region) => getBodyRegionAntagonists(region)));
  if (desiredAntagonists.size === 0) return 0;
  return candidate.bodyRegions.some((region) => bodyRegionsOverlap([...desiredAntagonists], [region])) ? 28 : 0;
}

function currentBlockDiversityScore(
  candidate: TrainingDraftExerciseCandidate,
  block: readonly TrainingDraftExerciseCandidate[],
): number {
  if (block.length === 0) return 0;
  let score = 0;
  const categories = new Set(block.map((item) => item.category));
  const patterns = new Set(block.flatMap((item) => item.movementPatterns ?? []));
  const regions = block.flatMap((item) => item.bodyRegions);
  if (!categories.has(candidate.category)) score += 16;
  if ((candidate.movementPatterns ?? []).some((pattern) => !patterns.has(pattern))) score += 14;
  if (candidate.bodyRegions.length > 0 && !candidate.bodyRegions.every((region) => bodyRegionsOverlap([region], regions))) score += 12;
  return score;
}

function blockVarietyScore(
  candidate: TrainingDraftExerciseCandidate,
  earlier: readonly TrainingDraftExerciseCandidate[],
): number {
  if (earlier.length === 0) return 0;
  const previousCategories = new Set(earlier.map((item) => item.category));
  const previousPatterns = new Set(earlier.flatMap((item) => item.movementPatterns ?? []));
  const previousRegions = earlier.flatMap((item) => item.bodyRegions);

  let score = 0;
  if (!previousCategories.has(candidate.category)) score += 24;
  const patterns = candidate.movementPatterns ?? [];
  if (patterns.length > 0 && patterns.every((pattern) => !previousPatterns.has(pattern))) score += 22;
  if (candidate.bodyRegions.length > 0 && !candidate.bodyRegions.some((region) => bodyRegionsOverlap([region], previousRegions))) {
    score += 18;
  }
  return score;
}

function recoveryDemandScore(
  candidate: TrainingDraftExerciseCandidate,
  main: readonly TrainingDraftExerciseCandidate[],
): number {
  if (main.length === 0) return 0;
  const mainRegions = main.flatMap((item) => item.bodyRegions);
  const regionMatch = candidate.bodyRegions.some((region) => bodyRegionsOverlap([region], mainRegions));
  return regionMatch ? 18 : 0;
}

function appendAvailabilityWarnings(
  warnings: string[],
  input: StructuredSportsTrainingInput,
  warmup: readonly TrainingDraftExerciseCandidate[],
  mainParts: readonly (readonly TrainingDraftExerciseCandidate[])[],
  cooldown: readonly TrainingDraftExerciseCandidate[],
): void {
  if (warmup.length < input.warmupExerciseCount) {
    warnings.push(`Aufwärmen: nur ${warmup.length} von ${input.warmupExerciseCount} gewünschten Übungen verfügbar.`);
  }
  mainParts.forEach((part, index) => {
    const requestedCount = mainPartExerciseCount(input, index);
    if (part.length < requestedCount) {
      warnings.push(`Hauptteil ${index + 1}: nur ${part.length} von ${requestedCount} gewünschten unterschiedlichen Übungen verfügbar.`);
    }
  });
  if (cooldown.length < input.cooldownExerciseCount) {
    warnings.push(`Cooldown: nur ${cooldown.length} von ${input.cooldownExerciseCount} gewünschten Übungen verfügbar.`);
  }
}

function appendOrganizationWarnings(warnings: string[], input: StructuredSportsTrainingInput): void {
  if (input.organizationMode === "team") {
    const teamSize = input.teamSize ?? 2;
    const fullTeams = Math.floor(input.participantCount / teamSize);
    const remainder = input.participantCount % teamSize;
    const teamCount = fullTeams + (remainder > 0 ? 1 : 0);
    warnings.push(
      remainder === 0
        ? `Teamorganisation: ${teamCount} Teams mit je ${teamSize} Personen.`
        : `Teamorganisation: ${teamCount} Teams mit Zielgröße ${teamSize}; das letzte Team hat ${remainder} Personen.`,
    );
  } else {
    warnings.push("Organisation: individuelles Arbeiten bzw. freie Stationsrotation.");
  }
}

function appendBalanceWarnings(
  warnings: string[],
  input: StructuredSportsTrainingInput,
  main: readonly TrainingDraftExerciseCandidate[],
): void {
  if (main.length === 0) return;
  for (const focus of input.bodyRegions) {
    const antagonists = getBodyRegionAntagonists(focus);
    if (antagonists.length === 0) continue;
    const covered = main.some((candidate) => bodyRegionsOverlap(antagonists, candidate.bodyRegions));
    if (!covered) {
      warnings.push(`Für den Fokus ${focus} konnte im Hauptteil keine passende typische Gegenmuskel-Übung aus dem freigegebenen Pool ergänzt werden.`);
    }
  }
}

function buildPhase(
  kind: Exclude<TrainingPhaseKind, "main">,
  id: string,
  title: string,
  selected: readonly TrainingDraftExerciseCandidate[],
  budgetMinutes: number,
  input: StructuredSportsTrainingInput,
) {
  const durations = distributeTrainingMinutes(budgetMinutes, selected.length);
  return {
    id,
    kind,
    title,
    items: selected.map((candidate, index) => buildItem(
      candidate,
      `${id}-${candidate.id}`,
      durations[index] ?? 0,
      kind,
      input,
    )),
  };
}

function buildItem(
  candidate: TrainingDraftExerciseCandidate,
  id: string,
  durationMinutes: number,
  kind: TrainingPhaseKind,
  input: StructuredSportsTrainingInput,
  mainPartIndex?: number,
) {
  return {
    id,
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
    durationMinutes,
    format: formatForPhase(kind, input),
    instructions: candidate.instructions,
    levelLabel: levelFor(candidate, kind, input),
    ...(kind === "main" && mainPartIndex != null
      ? { mainPartIndex, mainPartTitle: input.mainPartCount > 1 ? `Hauptteil ${mainPartIndex}` : "Hauptteil" }
      : {}),
  };
}

function formatForPhase(kind: TrainingPhaseKind, input: StructuredSportsTrainingInput): TrainingFormat {
  if (kind !== "main") return "free";
  if (input.formats.includes("partner")) return "partner";
  if (input.organizationMode === "team" && input.formats.includes("relay")) return "relay";
  return input.formats[0] ?? "free";
}

function levelFor(
  candidate: TrainingDraftExerciseCandidate,
  kind: TrainingPhaseKind,
  input: StructuredSportsTrainingInput,
): string | undefined {
  const standard = candidate.level2 || candidate.level1 || candidate.level3;
  if (input.audience === "kids") return candidate.level1 || standard;
  if (kind !== "main") return candidate.level1 || standard;
  if (input.intensity === "conditioning" && candidate.riskLevel === "low" && candidate.impactLevel !== "high") {
    return candidate.level3 || standard;
  }
  return standard;
}

function normalizeText(value: string): string {
  return value.trim().toLocaleLowerCase("de-DE");
}
