import "server-only";

import { isBodyRegion } from "../../domain/body-regions";
import { getTrainingPhaseBudgets, type TrainingDraft, type TrainingDraftExerciseCandidate } from "../../domain/training/draft";
import { TRAINING_PHASE_LABELS, type TrainingPhase, type TrainingSession } from "../../domain/training/model";
import { validateTrainingSession } from "../../domain/training/validation";
import { composeAiTrainingDraft } from "./ai-training-composer";
import { getConfiguredAiTrainingProvider } from "./ai-training-provider";
import { composeStructuredSportsTrainingDraft } from "./structured-sports-training-composer";
import { filterCandidatesForDeclaredEquipment } from "./training-candidate-constraints";
import { listTrainingDraftCandidates } from "./training-draft-repository";
import type { TrainingPhaseRegenerationRequest } from "./training-phase-regeneration-schema";

export async function regenerateTrainingDraftPhase(
  input: TrainingPhaseRegenerationRequest,
): Promise<TrainingDraft> {
  const { request, phase: targetKind, current } = input;
  const rawCandidates = await listTrainingDraftCandidates({
    audience: request.audience,
    minAge: request.minAge,
    locale: request.locale,
    location: request.location,
  });
  const candidates = filterCandidatesForDeclaredEquipment(rawCandidates, request.availableEquipment);
  const candidateById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const budgets = getTrainingPhaseBudgets(request.durationMinutes);

  for (const phase of current.phases) {
    if (phase.kind === targetKind) continue;
    const minutes = phase.items.reduce((sum, item) => sum + item.durationMinutes, 0);
    if (minutes !== budgets[phase.kind]) {
      throw new Error(
        `Die bestehende Phase ${phase.kind} hat ${minutes} statt ${budgets[phase.kind]} Minuten und kann nicht sicher unverändert übernommen werden.`,
      );
    }
  }

  const preservedIds = new Set(
    current.phases
      .filter((phase) => phase.kind !== targetKind)
      .flatMap((phase) => phase.items.map((item) => item.exerciseId)),
  );
  const replacementPool = candidates.filter((candidate) => !preservedIds.has(candidate.id));
  const replacementDraft = await generateReplacementDraft(request, replacementPool);
  const replacement = replacementDraft.session.phases.find((phase) => phase.kind === targetKind);
  if (!replacement || replacement.items.length === 0) {
    throw new Error(`Für ${TRAINING_PHASE_LABELS[targetKind]} konnte keine neue Phase erzeugt werden.`);
  }

  const phases: TrainingPhase[] = current.phases.map((phase) => {
    if (phase.kind === targetKind) {
      return {
        ...replacement,
        id: `regenerated-${targetKind}`,
        title: TRAINING_PHASE_LABELS[targetKind],
      };
    }
    return rehydratePreservedPhase(phase, candidateById);
  });

  const session: TrainingSession = {
    id: "regenerated-training-draft",
    title: current.title,
    group: {
      id: "regenerated-training-group",
      name: request.builderMode === "ai" ? "AI Training Builder" : "Lokaler Sportalgorithmus",
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
    source: request.builderMode === "ai" ? "ai" : "deterministic",
    session,
    validationIssues: validateTrainingSession(session, undefined, request.availableEquipment),
    warnings: [
      ...replacementDraft.warnings,
      `${TRAINING_PHASE_LABELS[targetKind]} wurde neu erzeugt; die beiden anderen Phasen wurden unverändert aus der geprüften Auswahl übernommen.`,
    ],
  };
}

async function generateReplacementDraft(
  request: TrainingPhaseRegenerationRequest["request"],
  candidates: readonly TrainingDraftExerciseCandidate[],
): Promise<TrainingDraft> {
  if (request.builderMode === "ai") {
    const provider = getConfiguredAiTrainingProvider();
    if (!provider) {
      throw new Error(
        "AI Training Builder ist nicht konfiguriert. Nutze den lokalen Sportalgorithmus oder konfiguriere OCRCRAFT_AI_BASE_URL und OCRCRAFT_AI_MODEL.",
      );
    }
    const proposal = await provider.generateTrainingPlan({ request, approvedExercises: candidates });
    return composeAiTrainingDraft({ proposal, request, approvedExercises: candidates, providerId: provider.id });
  }

  return composeStructuredSportsTrainingDraft(
    {
      audience: request.audience,
      participantCount: request.participantCount,
      durationMinutes: request.durationMinutes,
      goals: request.goals,
      bodyRegions: request.bodyRegions,
      avoidBodyRegions: request.avoidBodyRegions,
      exerciseTypes: request.exerciseTypes,
      formats: request.formats,
      intensity: request.intensity,
      preferredExerciseIds: request.preferredExerciseIds.filter((id) => candidates.some((candidate) => candidate.id === id)),
      availableEquipment: request.availableEquipment,
      minAge: request.minAge,
      maxAge: request.maxAge,
      warmupExerciseCount: request.warmupExerciseCount,
      mainExerciseCount: request.mainExerciseCount,
      mainPartExerciseCounts: request.mainPartExerciseCounts,
      cooldownExerciseCount: request.cooldownExerciseCount,
      mainPartCount: request.mainPartCount,
      organizationMode: request.organizationMode,
      teamSize: request.teamSize,
    },
    candidates,
  );
}

function rehydratePreservedPhase(
  phase: TrainingPhaseRegenerationRequest["current"]["phases"][number],
  candidateById: ReadonlyMap<string, TrainingDraftExerciseCandidate>,
): TrainingPhase {
  return {
    id: `preserved-${phase.kind}`,
    kind: phase.kind,
    title: TRAINING_PHASE_LABELS[phase.kind],
    items: phase.items.map((item) => {
      const candidate = candidateById.get(item.exerciseId);
      if (!candidate) {
        throw new Error(`Die beizubehaltende Übung ${item.exerciseId} ist nicht mehr im freigegebenen Übungspool oder passt nicht zum deklarierten Equipment.`);
      }
      return {
        id: `preserved-${phase.kind}-${candidate.id}`,
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
        durationMinutes: item.durationMinutes,
        format: item.format,
        instructions: item.instructions || candidate.instructions,
        levelLabel: item.levelLabel || candidate.level2,
        ...(phase.kind === "main"
          ? {
              mainPartIndex: item.mainPartIndex ?? 1,
              mainPartTitle: item.mainPartTitle || `Hauptteil ${item.mainPartIndex ?? 1}`,
            }
          : {}),
      };
    }),
  };
}
