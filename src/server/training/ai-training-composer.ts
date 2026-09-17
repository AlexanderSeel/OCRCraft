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
import { aiTrainingPlanSchema, type AiTrainingPlan } from "./ai-training-schema";
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
  readonly mainPartIndex?: number;
  readonly mainPartTitle?: string;
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
  assertRequestedStructure(plan, request);
  const budgets = getTrainingPhaseBudgets(request.durationMinutes);
  const phases: CanonicalAiPhase[] = plan.phases.map((phase) => {
    if (phase.kind !== "main") {
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
    }

    const blockBudgets = distributeTrainingMinutes(budgets.main, request.mainPartCount);
    const items: CanonicalAiItem[] = [];
    for (let part = 1; part <= request.mainPartCount; part += 1) {
      const blockItems = phase.items.filter((item) => (item.mainPart ?? 1) === part);
      const durations = distributeTrainingMinutes(blockBudgets[part - 1] ?? 0, blockItems.length);
      blockItems.forEach((item, index) => {
        items.push({
          exerciseId: item.exerciseId,
          durationMinutes: durations[index] ?? 0,
          format: item.format,
          instructions: item.trainerNote,
          levelLabel: item.level,
          mainPartIndex: part,
          mainPartTitle: request.mainPartCount > 1 ? `Hauptteil ${part}` : "Hauptteil",
        });
      });
    }
    return { kind: "main", items };
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
  assertReviewedMainPartStructure(input);
  return buildCanonicalAiDraft(
    input.request,
    approvedExercises,
    input.reviewed.phases,
    input.title || "AI Trainingsentwurf",
    ["Geprüfter AI-Vorschlag wurde vor dem Speichern erneut gegen den aktuellen OCRCraft-Katalog validiert."],
  );
}

function requestedMainPartCount(request: TrainingDraftRequest, zeroBasedIndex: number): number {
  return request.mainPartExerciseCounts?.[zeroBasedIndex] ?? request.mainExerciseCount;
}

function assertRequestedStructure(plan: AiTrainingPlan, request: TrainingDraftRequest): void {
  const warmup = plan.phases.find((phase) => phase.kind === "warmup");
  const main = plan.phases.find((phase) => phase.kind === "main");
  const cooldown = plan.phases.find((phase) => phase.kind === "cooldown");

  if (!warmup || !main || !cooldown) {
    throw new Error("AI-Vorschlag enthält nicht alle drei Pflichtphasen.");
  }
  if (warmup.items.length !== request.warmupExerciseCount) {
    throw new Error(`AI-Vorschlag enthält ${warmup.items.length} statt ${request.warmupExerciseCount} Aufwärmübungen.`);
  }
  if (cooldown.items.length !== request.cooldownExerciseCount) {
    throw new Error(`AI-Vorschlag enthält ${cooldown.items.length} statt ${request.cooldownExerciseCount} Cooldown-Übungen.`);
  }

  const expectedMainItems = Array.from({ length: request.mainPartCount }, (_, index) =>
    requestedMainPartCount(request, index),
  ).reduce((sum, count) => sum + count, 0);
  if (main.items.length !== expectedMainItems) {
    throw new Error(`AI-Vorschlag enthält ${main.items.length} statt ${expectedMainItems} Übungen im Hauptteil.`);
  }

  for (let part = 1; part <= request.mainPartCount; part += 1) {
    const expectedCount = requestedMainPartCount(request, part - 1);
    const blockCount = main.items.filter((item) => (item.mainPart ?? 1) === part).length;
    if (blockCount !== expectedCount) {
      throw new Error(`AI-Vorschlag enthält in Hauptteil ${part} ${blockCount} statt ${expectedCount} Übungen.`);
    }
  }

  if (main.items.some((item) => (item.mainPart ?? 1) > request.mainPartCount)) {
    throw new Error("AI-Vorschlag enthält einen nicht angeforderten Hauptteil.");
  }
  if (request.mainPartCount > 1 && main.items.some((item) => item.mainPart == null)) {
    throw new Error("AI-Vorschlag muss bei mehreren Hauptteilen jede Hauptteil-Übung eindeutig einem Block zuordnen.");
  }
}

function assertReviewedMainPartStructure(input: ReviewedAiTrainingPersistence): void {
  const main = input.reviewed.phases.find((phase) => phase.kind === "main");
  if (!main) throw new Error("Geprüfter AI-Entwurf enthält keinen Hauptteil.");

  for (let part = 1; part <= input.request.mainPartCount; part += 1) {
    const expectedCount = requestedMainPartCount(input.request, part - 1);
    const actualCount = main.items.filter((item) => (item.mainPartIndex ?? 1) === part).length;
    if (actualCount !== expectedCount) {
      throw new Error(`Geprüfter AI-Entwurf enthält in Hauptteil ${part} ${actualCount} statt ${expectedCount} Übungen.`);
    }
  }
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
      if (phase.kind === "main" && item.mainPartIndex != null && item.mainPartIndex > request.mainPartCount) {
        throw new Error(`AI-Vorschlag ordnet ${candidate.name} einem nicht angeforderten Hauptteil zu.`);
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
        format: canonicalFormat(item.format, phase.kind, request),
        instructions: item.instructions?.trim() || candidate.instructions,
        levelLabel: reviewedLevelText(item.levelLabel, candidate, request),
        ...(phase.kind === "main"
          ? {
              mainPartIndex: item.mainPartIndex ?? 1,
              mainPartTitle: item.mainPartTitle?.trim()
                || (request.mainPartCount > 1 ? `Hauptteil ${item.mainPartIndex ?? 1}` : "Hauptteil"),
            }
          : {}),
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

  if (request.organizationMode === "team") {
    const teamSize = request.teamSize ?? 2;
    const teamCount = Math.ceil(request.participantCount / teamSize);
    warnings.push(`Teamorganisation: ${teamCount} Teams mit Zielgröße ${teamSize}.`);
  }

  const session: TrainingSession = {
    id: "ai-training-draft",
    title,
    group: {
      id: "ai-training-group",
      name: request.organizationMode === "team" ? "AI Training Builder · Team" : "AI Training Builder",
      audience: request.audience,
      minAge: request.minAge,
      maxAge: request.maxAge,
      participantCount: request.participantCount,
      organizationMode: request.organizationMode,
      teamSize: request.organizationMode === "team" ? request.teamSize : undefined,
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

function canonicalFormat(
  value: TrainingFormat | undefined,
  phase: TrainingPhaseKind,
  request: TrainingDraftRequest,
): TrainingFormat {
  if (phase !== "main") return "free";
  if (value && !request.formats.includes(value)) {
    throw new Error(`AI-Vorschlag verwendet das nicht gewählte Trainingsformat ${value}.`);
  }
  return value ?? request.formats[0] ?? "free";
}

function reviewedLevelText(
  value: string | undefined,
  candidate: TrainingDraftExerciseCandidate,
  request: TrainingDraftRequest,
): string | undefined {
  const standard = candidate.level2 || candidate.level1 || candidate.level3;
  if (request.audience === "kids") return candidate.level1 || standard;

  if (request.audience === "youth") {
    const conservative = candidate.difficulty === "advanced"
      || candidate.riskLevel === "high"
      || candidate.impactLevel === "high"
      || candidate.coordinationComplexity === "complex";
    if (conservative) return candidate.level1 || standard;
  }

  if (value === "level1") return candidate.level1 || standard;
  if (value === "level2") return candidate.level2 || standard;
  if (value === "level3") {
    const progressionIsConservative = candidate.riskLevel === "low"
      && candidate.impactLevel !== "high"
      && candidate.coordinationComplexity !== "complex";
    return progressionIsConservative ? candidate.level3 || standard : standard;
  }
  return value || standard;
}
