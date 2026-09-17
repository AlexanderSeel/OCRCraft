import { bodyRegionsOverlap } from "../../domain/body-regions";
import { inferTrainingPhase, type TrainingDraftExerciseCandidate } from "../../domain/training/draft";
import type { TrainingPhaseKind } from "../../domain/training/model";

export const DRAFT_ALTERNATIVE_MODES = ["easier", "harder", "equipment"] as const;
export type DraftAlternativeMode = (typeof DRAFT_ALTERNATIVE_MODES)[number];

const DIFFICULTY_RANK: Readonly<Record<string, number>> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

export interface DraftExerciseAlternative {
  readonly candidate: TrainingDraftExerciseCandidate;
  readonly score: number;
  readonly reason: string;
}

export function rankDraftExerciseAlternatives(
  current: TrainingDraftExerciseCandidate,
  candidates: readonly TrainingDraftExerciseCandidate[],
  phase: TrainingPhaseKind,
  mode: DraftAlternativeMode,
  excludedIds: ReadonlySet<string>,
  avoidBodyRegions: readonly string[],
  limit = 8,
): readonly DraftExerciseAlternative[] {
  const currentDifficulty = difficultyRank(current.difficulty);
  const currentEquipmentCount = current.equipmentRequirements.length;
  const currentPatterns = new Set(current.movementPatterns ?? []);

  return candidates
    .filter((candidate) => candidate.id !== current.id)
    .filter((candidate) => !excludedIds.has(candidate.id))
    .filter((candidate) => inferTrainingPhase(candidate) === phase)
    .filter((candidate) => !avoidBodyRegions.some((region) => bodyRegionsOverlap([region], candidate.bodyRegions)))
    .map((candidate) => {
      const movementOverlap = (candidate.movementPatterns ?? []).filter((pattern) => currentPatterns.has(pattern)).length;
      const bodyOverlap = current.bodyRegions.filter((region) => bodyRegionsOverlap([region], candidate.bodyRegions)).length;
      const sameCategory = candidate.category === current.category;
      const candidateDifficulty = difficultyRank(candidate.difficulty);
      const equipmentCount = candidate.equipmentRequirements.length;
      const modeScore = alternativeModeScore(
        mode,
        candidateDifficulty,
        currentDifficulty,
        equipmentCount,
        currentEquipmentCount,
      );
      const score =
        (sameCategory ? 45 : 0)
        + movementOverlap * 28
        + Math.min(bodyOverlap, 3) * 18
        + modeScore
        - (candidate.riskLevel === "high" && current.riskLevel !== "high" ? 18 : 0);

      return {
        candidate,
        score,
        reason: alternativeReason(
          mode,
          candidateDifficulty,
          currentDifficulty,
          equipmentCount,
          currentEquipmentCount,
          movementOverlap,
          bodyOverlap,
          sameCategory,
        ),
      };
    })
    .sort((left, right) => right.score - left.score
      || left.candidate.name.localeCompare(right.candidate.name)
      || left.candidate.id.localeCompare(right.candidate.id))
    .slice(0, Math.max(1, Math.min(limit, 20)));
}

function difficultyRank(value?: string): number {
  return value ? DIFFICULTY_RANK[value] ?? 1 : 1;
}

function alternativeModeScore(
  mode: DraftAlternativeMode,
  difficulty: number,
  currentDifficulty: number,
  equipmentCount: number,
  currentEquipmentCount: number,
): number {
  if (mode === "easier") {
    if (difficulty < currentDifficulty) return 65;
    if (difficulty === currentDifficulty) return 8;
    return -70;
  }
  if (mode === "harder") {
    if (difficulty > currentDifficulty) return 65;
    if (difficulty === currentDifficulty) return 8;
    return -70;
  }
  if (equipmentCount === 0) return 65;
  if (equipmentCount < currentEquipmentCount) return 48;
  if (equipmentCount > currentEquipmentCount) return -35;
  return 6;
}

function alternativeReason(
  mode: DraftAlternativeMode,
  difficulty: number,
  currentDifficulty: number,
  equipmentCount: number,
  currentEquipmentCount: number,
  movementOverlap: number,
  bodyOverlap: number,
  sameCategory: boolean,
): string {
  const details = [
    movementOverlap > 0 ? `${movementOverlap} gemeinsame Bewegungsmuster` : null,
    bodyOverlap > 0 ? `${bodyOverlap} überlappende Körperregionen` : null,
    sameCategory ? "gleicher Trainingsbereich" : null,
  ].filter(Boolean);

  let primary: string;
  if (mode === "easier") {
    primary = difficulty < currentDifficulty ? "niedrigere Schwierigkeitsstufe" : "bestpassende verfügbare Alternative";
  } else if (mode === "harder") {
    primary = difficulty > currentDifficulty ? "höhere Schwierigkeitsstufe" : "bestpassende verfügbare Alternative";
  } else {
    primary = equipmentCount === 0
      ? "ohne Equipment"
      : equipmentCount < currentEquipmentCount
        ? "weniger Equipment-Arten"
        : "ähnlicher Equipment-Bedarf";
  }
  return [primary, ...details].join(" · ");
}
