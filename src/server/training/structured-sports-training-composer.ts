import { bodyRegionsOverlap, isBodyRegion } from "../../domain/body-regions";
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
  readonly cooldownExerciseCount: number;
  readonly mainPartCount: number;
  readonly organizationMode: "solo" | "team";
  readonly teamSize?: number;
}

type CandidateWithHistory = TrainingDraftExerciseCandidate & { readonly recentUseCount?: number };

/**
 * Adds an explicit coach-controlled structure around the existing sports planner.
 * Warm-up / main / cooldown stay the canonical three training phases. Multiple
 * requested "Hauptteile" are represented as numbered blocks inside the main
 * phase so persisted sessions remain compatible with the existing editor.
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
    const selected = selectCandidates(
      "main",
      input.mainExerciseCount,
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

  const cooldown = selectCandidates("cooldown", input.cooldownExerciseCount, input, candidates, used, backboneRank);
  cooldown.forEach((candidate) => used.add(candidate.id));

  appendAvailabilityWarnings(warnings, input, warmup, mainParts, cooldown);
  appendOrganizationWarnings(warnings, input);

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
  return candidates
    .filter((candidate) => !used.has(candidate.id))
    .filter((candidate) => inferTrainingPhase(candidate) === phase)
    .filter((candidate) => input.minAge == null || candidate.minAge == null || candidate.minAge <= input.minAge)
    .filter((candidate) => !(input.avoidBodyRegions ?? []).some((region) => bodyRegionsOverlap([region], candidate.bodyRegions)))
    .map((candidate) => ({
      candidate,
      score: structuredScore(candidate, phase, input, backboneRank, partIndex, earlierMainCandidates),
    }))
    .sort((left, right) => right.score - left.score || left.candidate.name.localeCompare(right.candidate.name))
    .slice(0, count)
    .map(({ candidate }) => candidate);
}

function structuredScore(
  candidate: TrainingDraftExerciseCandidate,
  phase: TrainingPhaseKind,
  input: StructuredSportsTrainingInput,
  backboneRank: ReadonlyMap<string, number>,
  partIndex: number,
  earlierMainCandidates: readonly TrainingDraftExerciseCandidate[],
): number {
  let score = backboneRank.get(candidate.id) ?? 0;
  if (input.preferredExerciseIds.includes(candidate.id)) score += 900;
  if (input.bodyRegions.some((region) => bodyRegionsOverlap([region], candidate.bodyRegions))) score += 60;
  if (candidate.exerciseType && input.exerciseTypes?.includes(candidate.exerciseType)) score += 45;
  if (phase !== "main" && candidate.riskLevel === "low") score += 20;

  if (phase === "main" && input.organizationMode === "team") {
    if (candidate.trainingGoals?.includes("teamwork")) score += 70;
    if (candidate.exerciseType === "game" || candidate.exerciseType === "drill") score += 25;
    if (input.teamSize != null) {
      if (candidate.stationCapacity >= input.teamSize) score += 35;
      else score -= Math.min(60, (input.teamSize - candidate.stationCapacity) * 10);
    }
  }

  if (phase === "main" && partIndex > 0) {
    score += blockVarietyScore(candidate, earlierMainCandidates);
  }

  score -= Math.min(80, Number((candidate as CandidateWithHistory).recentUseCount ?? 0) * 12);
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
    if (part.length < input.mainExerciseCount) {
      warnings.push(`Hauptteil ${index + 1}: nur ${part.length} von ${input.mainExerciseCount} gewünschten unterschiedlichen Übungen verfügbar.`);
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
