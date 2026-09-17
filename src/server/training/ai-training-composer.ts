import { bodyRegionsOverlap, isBodyRegion } from "../../domain/body-regions";
import {
  distributeTrainingMinutes,
  getTrainingPhaseBudgets,
  inferTrainingPhase,
  type TrainingDraft,
  type TrainingDraftExerciseCandidate,
} from "../../domain/training/draft";
import { TRAINING_PHASE_LABELS, type TrainingFormat, type TrainingPhaseKind, type TrainingSession } from "../../domain/training/model";
import { validateTrainingSession } from "../../domain/training/validation";
import { aiTrainingPlanSchema } from "./ai-training-schema";
import type { ReviewedAiTrainingPersistence } from "./reviewed-training-draft-schema";
import type { TrainingDraftRequest } from "./training-draft-schema";

export interface ComposeAiTrainingDraftInput {
  readonly proposal: unknown;
  readonly request: TrainingDraftRequest;
  readonly approvedExercises: readonly TrainingDraftExerciseCandidate[];
  readonly providerId: string;
}

interface CanonicalAiItem {
  readonly exerciseId: string;
  readonly durationMinutes?: number;
  readonly format?: TrainingFormat;
  readonly instructions?: string;
  readonly levelLabel?: string;
}

interface CanonicalAiPhase {
  readonly kind: TrainingPhaseKind;
  readonly items: readonly CanonicalAiItem[];
}

/** Converts untrusted provider output into a canonical OCRCraft TrainingDraft. */
export function composeAiTrainingDraft({
  proposal,
  request,
  approvedExercises,
  providerId,
}: ComposeAiTrainingDraftInput): TrainingDraft {
  const plan = aiTrainingPlanSchema.parse(proposal);
  const budgets = getTrainingPhaseBudgets(request.durationMinutes);
  const phases: CanonicalAiPhase[] = plan.phases.map((phase) => {
    const durations = distributeTrainingMinutes(budgets[phase.kind], phase.items.length);
    return {
      kind: phase.kind,
      items: phase.items.map((item, index) => ({
        exerciseId: item.exerciseId,
        durationMinutes: durations[index] ?? 0,
        format: item.format,
        instructions: item.trainerNote,
        levelLabel: item.level,
      })),
    };
  });
  const rationaleWarnings = plan.rationale ? [`AI-Begründung: ${plan.rationale}`] : [];
  return buildCanonicalAiDraft(
    request,
    approvedExercises,
    phases,
    plan.title || "AI Trainingsentwurf",
    [`AI-Anbieter: ${providerId}. Vorschlag wurde gegen OCRCraft-Regeln validiert.`, ...rationaleWarnings],
  );
}

/** Rehydrates the exact reviewed AI selection against the current approved pool. */
export function composeReviewedAiTrainingDraft(
  input: ReviewedAiTrainingPersistence,
  approvedExercises: readonly TrainingDraftExerciseCandidate[],
): TrainingDraft {
  const budgets = getTrainingPhaseBudgets(input.request.durationMinutes);
  for (const phase of input.reviewed.phases) {
    const actual = phase.items.reduce((sum, item) => sum + item.durationMinutes, 0);
    if (actual !== budgets[phase.kind]) {
      throw new Error(`Geprüfter AI-Entwurf hat für ${phase.kind} ${actual} statt ${budgets[phase.kind]} Minuten.`);
    }
  }
  return buildCanonicalAiDraft(
    input.request,
    approvedExercises,
    input.reviewed.phases,
    input.title || "AI Trainingsentwurf",
    ["Geprüfter AI-Vorschlag wurde vor dem Speichern erneut gegen den aktuellen OCRCraft-Katalog validiert."],
  );
}

function buildCanonicalAiDraft(
  request: TrainingDraftRequest,
  approvedExercises: readonly TrainingDraftExerciseCandidate[],
  phaseSelections: readonly CanonicalAiPhase[],
  title: string,
  initialWarnings: readonly string[],
): TrainingDraft {
  const byId = new Map(approvedExercises.map((exercise) => [exercise.id, exercise]));
  const warnings = [...initialWarnings];
  const phases = phaseSelections.map((phase) => ({
    id: `ai-${phase.kind}`,
    kind: phase.kind,
    title: TRAINING_PHASE_LABELS[phase.kind],
    items: phase.items.map((item) => {
      const candidate = byId.get(item.exerciseId);
      if (!candidate) throw new Error(`AI-Vorschlag enthält eine nicht freigegebene Übung: ${item.exerciseId}.`);
      if (inferTrainingPhase(candidate) !== phase.kind) {
        throw new Error(`AI-Vorschlag ordnet ${candidate.name} einer unpassenden Phase ${phase.kind} zu.`);
      }
      if (request.avoidBodyRegions.some((region) => bodyRegionsOverlap([region], candidate.bodyRegions))) {
        throw new Error(`AI-Vorschlag verwendet ${candidate.name} trotz ausgeschlossener Körperregion.`);
      }
      return {
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
        durationMinutes: item.durationMinutes ?? 0,
        format: item.format ?? (phase.kind === "main" ? request.formats[0] : "free"),
        instructions: item.instructions?.trim() || candidate.instructions,
        levelLabel: reviewedLevelText(item.levelLabel, candidate),
      };
    }),
  }));

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

  const session: TrainingSession = {
    id: "ai-training-draft",
    title,
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
    warnings,
  };
}

function reviewedLevelText(value: string | undefined, candidate: TrainingDraftExerciseCandidate): string | undefined {
  if (value === "level1") return candidate.level1 || "Level 1";
  if (value === "level2") return candidate.level2 || "Level 2";
  if (value === "level3") return candidate.level3 || "Level 3";
  return value || candidate.level2;
}
