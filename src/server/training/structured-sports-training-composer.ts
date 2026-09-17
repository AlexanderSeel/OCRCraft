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
    const selected = selectCandidates("main", input.mainExerciseCount, input, candidates, used, backboneRank, part);
    selected.forEach((candidate) => used.add(candidate.id));
    mainParts.push(selected);
  }

  const cooldown = selectCandidates("cooldown", input.cooldownExerciseCount, input, candidates, used, backboneRank);
  cooldown.forEach((candidate) => used.add(candidate.id));

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

  if (input.organizationMode === "team") {
    const teamSize = input.teamSize ?? 2;
    const teamCount = Math.ceil(input.participantCount / teamSize);
    const remainder = input.participantCount % teamSize;
    warnings.push(
      remainder === 0
        ? `Teamorganisation: ${teamCount} Teams mit je ${teamSize} Personen.`
        : `Teamorganisation: ${teamCount} Teams, Zielgröße ${teamSize}; ein Team ist wegen ${input.participantCount} Teilnehmenden kleiner.`,
    );
  } else {
    warnings.push("Organisation: Übungen sind für individuelles Arbeiten bzw. freie Stationsrotation geplant.");
  }

  const mainBudgets = distributeTrainingMinutes(budgets.main, input.mainPartCount);
  const phases = [
    buildPhase("warmup", "structured-warmup", TRAINING_PHASE_LABELS.warmup, warmup, budgets.warmup, input),
    ...mainParts.map((selected, index) => buildPhase(
      "main",
      `structured-main-${index + 1}`,
      input.mainPartCount > 1 ? `Hauptteil ${index + 1}` : TRAINING_PHASE_LABELS.main,
      selected,
      mainBudgets[index] ?? 0,
      input,
    )),
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
): TrainingDraftExerciseCandidate[] {
  return candidates
    .filter((candidate) => !used.has(candidate.id))
    .filter((candidate) => inferTrainingPhase(candidate) === phase)
    .filter((candidate) => input.minAge == null || candidate.minAge == null || candidate.minAge <= input.minAge)
    .filter((candidate) => !(input.avoidBodyRegions ?? []).some((region) => bodyRegionsOverlap([region], candidate.bodyRegions)))
    .map((candidate) => ({ candidate, score: structuredScore(candidate, phase, input, backboneRank, partIndex) }))
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
): number {
  let score = backboneRank.get(candidate.id) ?? 0;
  if (input.preferredExerciseIds.includes(candidate.id)) score += 900;
  if (input.bodyRegions.some((region) => bodyRegionsOverlap([region], candidate.bodyRegions))) score += 60;
  if (candidate.exerciseType && input.exerciseTypes?.includes(candidate.exerciseType)) score += 45;
  if (phase !== "main" && candidate.riskLevel === "low") score += 20;
  if (phase === "main" && input.organizationMode === "team") {
    if (candidate.trainingGoals?.includes("teamwork")) score += 70;
    if (candidate.exerciseType === "game" || candidate.exerciseType === "drill") score += 25;
    if (input.teamSize != null && candidate.stationCapacity >= input.teamSize) score += 20;
  }
  if (phase === "main" && partIndex > 0) {
    const patterns = candidate.movementPatterns ?? [];
    score += patterns.length > 0 ? Math.min(15, patterns.length * 3) : 0;
  }
  score -= Math.min(80, Number((candidate as CandidateWithHistory).recentUseCount ?? 0) * 12);
  return score;
}

function buildPhase(
  kind: TrainingPhaseKind,
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
    items: selected.map((candidate, index) => ({
      id: `${id}-${candidate.id}`,
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
      levelLabel: levelFor(candidate, kind, input),
    })),
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
