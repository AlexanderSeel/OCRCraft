import "server-only";

import type { TrainingDraft, TrainingDraftExerciseCandidate } from "@/domain/training/draft";
import { composeAiTrainingDraft, composeReviewedAiTrainingDraft } from "./ai-training-composer";
import { getConfiguredAiTrainingProvider } from "./ai-training-provider";
import { composeSportsTrainingDraft } from "./sports-training-composer";
import { filterCandidatesForDeclaredEquipment } from "./training-candidate-constraints";
import { listTrainingDraftCandidates } from "./training-draft-repository";
import type { TrainingDraftPersistenceRequest } from "./training-draft-persistence-schema";
import type { ReviewedAiTrainingPersistence } from "./reviewed-training-draft-schema";
import type { TrainingDraftRequest } from "./training-draft-schema";
import { assessTrainingSportsQuality } from "./training-sports-quality";
import { persistTrainingDraft } from "./training-session-repository";

async function approvedCandidatesFor(request: TrainingDraftRequest) {
  const candidates = await listTrainingDraftCandidates({
    audience: request.audience,
    minAge: request.minAge,
    locale: request.locale,
    location: request.location,
  });
  return filterCandidatesForDeclaredEquipment(candidates, request.availableEquipment);
}

function applySportsQualityAudit(
  request: TrainingDraftRequest,
  draft: TrainingDraft,
  candidates: readonly TrainingDraftExerciseCandidate[],
): TrainingDraft {
  const quality = assessTrainingSportsQuality(request, draft, candidates);
  return {
    ...draft,
    warnings: [...draft.warnings, ...quality.warnings],
  };
}

export async function createTrainingDraft(request: TrainingDraftRequest): Promise<TrainingDraft> {
  const candidates = await approvedCandidatesFor(request);
  if (request.builderMode === "ai") {
    const provider = getConfiguredAiTrainingProvider();
    if (!provider) {
      throw new Error(
        "AI Training Builder ist nicht konfiguriert. Nutze den lokalen Sportalgorithmus oder setze OCRCRAFT_AI_BASE_URL und OCRCRAFT_AI_MODEL.",
      );
    }
    const proposal = await provider.generateTrainingPlan({ request, approvedExercises: candidates });
    const draft = composeAiTrainingDraft({
      proposal,
      request,
      approvedExercises: candidates,
      providerId: provider.id,
    });
    return applySportsQualityAudit(request, draft, candidates);
  }

  const draft = composeSportsTrainingDraft(
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
      preferredExerciseIds: request.preferredExerciseIds,
      availableEquipment: request.availableEquipment,
      minAge: request.minAge,
      maxAge: request.maxAge,
    },
    candidates,
  );
  return applySportsQualityAudit(request, draft, candidates);
}

/** Kept as a stable explicit entry point for local-only callers/tests. */
export async function createDeterministicTrainingDraft(
  request: TrainingDraftRequest,
): Promise<TrainingDraft> {
  return createTrainingDraft({ ...request, builderMode: "local" });
}

export async function createAndPersistDeterministicTrainingDraft(
  input: TrainingDraftPersistenceRequest,
): Promise<{ readonly id: string; readonly draft: TrainingDraft }> {
  const draft = await createDeterministicTrainingDraft(input.request);
  const id = await persistTrainingDraft(draft, {
    title: input.title,
    locale: input.request.locale,
    groupId: input.groupId,
    source: "manual",
    generation: {
      builderMode: "local",
      request: input.request,
      trainerReviewed: true,
    },
  });

  return { id, draft };
}

export async function persistReviewedAiTrainingDraft(
  input: ReviewedAiTrainingPersistence,
): Promise<{ readonly id: string; readonly draft: TrainingDraft }> {
  const candidates = await approvedCandidatesFor(input.request);
  const reviewedDraft = composeReviewedAiTrainingDraft(input, candidates);
  const draft = applySportsQualityAudit(input.request, reviewedDraft, candidates);
  const provider = getConfiguredAiTrainingProvider();
  const id = await persistTrainingDraft(draft, {
    title: input.title,
    locale: input.request.locale,
    groupId: input.groupId,
    source: "ai",
    notes: "Quick Create · reviewed AI proposal · deterministic OCRCraft revalidation",
    generation: {
      builderMode: "ai",
      providerId: provider?.id ?? null,
      providerModel: provider?.modelId ?? null,
      request: input.request,
      trainerReviewed: true,
    },
  });
  return { id, draft };
}
