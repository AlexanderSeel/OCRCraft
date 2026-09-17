import { bodyRegionsOverlap, isBodyRegion } from "@/domain/body-regions";
import {
  distributeTrainingMinutes,
  getTrainingPhaseBudgets,
  inferTrainingPhase,
  type TrainingDraft,
  type TrainingDraftExerciseCandidate,
} from "@/domain/training/draft";
import { TRAINING_PHASE_LABELS, type TrainingSession } from "@/domain/training/model";
import { validateTrainingSession } from "@/domain/training/validation";
import { aiTrainingPlanSchema } from "./ai-training-schema";
import type { TrainingDraftRequest } from "./training-draft-schema";

export interface ComposeAiTrainingDraftInput {
  readonly proposal: unknown;
  readonly request: TrainingDraftRequest;
  readonly approvedExercises: readonly TrainingDraftExerciseCandidate[];
  readonly providerId: string;
}

/**
 * Converts untrusted provider output into a canonical OCRCraft TrainingDraft.
 * Provider-selected IDs are rehydrated exclusively from the approved pool;
 * duration, equipment, risk and validation data always come from OCRCraft.
 */
export function composeAiTrainingDraft({
  proposal,
  request,
  approvedExercises,
  providerId,
}: ComposeAiTrainingDraftInput): TrainingDraft {
  const plan = aiTrainingPlanSchema.parse(proposal);
  const byId = new Map(approvedExercises.map((exercise) => [exercise.id, exercise]));
  const budgets = getTrainingPhaseBudgets(request.durationMinutes);
  const warnings: string[] = [];

  const phases = plan.phases.map((phase) => {
    const candidates = phase.items.map((item) => {
      const candidate = byId.get(item.exerciseId);
      if (!candidate) {
        throw new Error(`AI-Vorschlag enthält eine nicht freigegebene Übung: ${item.exerciseId}.`);
      }
      if (inferTrainingPhase(candidate) !== phase.kind) {
        throw new Error(`AI-Vorschlag ordnet ${candidate.name} einer unpassenden Phase ${phase.kind} zu.`);
      }
      if (request.avoidBodyRegions.some((region) => bodyRegionsOverlap([region], candidate.bodyRegions))) {
        throw new Error(`AI-Vorschlag verwendet ${candidate.name} trotz ausgeschlossener Körperregion.`);
      }
      return { item, candidate };
    });

    const durations = distributeTrainingMinutes(budgets[phase.kind], candidates.length);
    return {
      id: `ai-${phase.kind}`,
      kind: phase.kind,
      title: TRAINING_PHASE_LABELS[phase.kind],
      items: candidates.map(({ item, candidate }, index) => ({
        id: `ai-${phase.kind}-${candidate.id}`,
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
        format: item.format ?? (phase.kind === "main" ? request.formats[0] : "free"),
        instructions: item.trainerNote?.trim() || candidate.instructions,
        levelLabel: levelText(item.level, candidate),
      })),
    };
  });

  const selected = phases.flatMap((phase) => phase.items);
  for (const focus of request.bodyRegions) {
    if (!selected.some((item) => bodyRegionsOverlap([focus], item.exercise.bodyRegions))) {
      warnings.push(`Der gewünschte Körperfokus ${focus} wurde im AI-Vorschlag nicht abgedeckt.`);
    }
  }
  for (const exerciseType of request.exerciseTypes) {
    if (!selected.some((item) => byId.get(item.exercise.id)?.exerciseType === exerciseType)) {
      warnings.push(`Der gewünschte Übungstyp ${exerciseType} wurde im AI-Vorschlag nicht abgedeckt.`);
    }
  }
  if (plan.rationale) warnings.unshift(`AI-Begründung: ${plan.rationale}`);

  const session: TrainingSession = {
    id: "ai-training-draft",
    title: plan.title || "AI Trainingsentwurf",
    group: {
      id: "ai-training-group",
      name: "AI Training Builder",
      audience: request.audience,
      minAge: request.minAge,
      maxAge: request.maxAge,
      participantCount: request.participantCount,
    },
    totalDurationMinutes: request.durationMinutes,
    focus: request.goals,
    phases,
  };

  return {
    source: "ai",
    session,
    validationIssues: validateTrainingSession(session, undefined, request.availableEquipment),
    warnings: [`AI-Anbieter: ${providerId}. Vorschlag wurde gegen OCRCraft-Regeln validiert.`, ...warnings],
  };
}

function levelText(
  level: "level1" | "level2" | "level3" | undefined,
  candidate: TrainingDraftExerciseCandidate,
): string | undefined {
  if (level === "level1") return candidate.level1 || "Level 1";
  if (level === "level3") return candidate.level3 || "Level 3";
  if (level === "level2") return candidate.level2 || "Level 2";
  return candidate.level2;
}
