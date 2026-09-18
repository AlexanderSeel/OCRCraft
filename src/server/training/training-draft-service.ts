import "server-only";

import type { TrainingDraft, TrainingDraftExerciseCandidate } from "@/domain/training/draft";
import { validateTrainingSession } from "@/domain/training/validation";
import { composeAiTrainingDraft, composeReviewedAiTrainingDraft } from "./ai-training-composer";
import { getConfiguredAiTrainingProvider } from "./ai-training-provider";
import { loadAiTrainingSourceSessions } from "./ai-training-source-context";
import { applyMainPartProgramming } from "./main-part-programming";
import { composeStructuredSportsTrainingDraft } from "./structured-sports-training-composer";
import { filterCandidatesForDeclaredEquipment } from "./training-candidate-constraints";
import {
  filterCandidatesForClubRules,
  resolveTrainingClubRules,
} from "./training-club-rule-service";
import { listTrainingDraftCandidates } from "./training-draft-repository";
import type { TrainingDraftPersistenceRequest } from "./training-draft-persistence-schema";
import type { ReviewedAiTrainingPersistence } from "./reviewed-training-draft-schema";
import type { TrainingDraftRequest } from "./training-draft-schema";
import { assessStructuredTrainingGoalCoverage } from "./training-goal-coverage";
import { assessTrainingSportsQuality } from "./training-sports-quality";
import { persistTrainingDraft } from "./training-session-repository";

async function approvedCandidatesFor(
  request: TrainingDraftRequest,
  rules: Parameters<typeof filterCandidatesForClubRules>[2],
) {
  const candidates = await listTrainingDraftCandidates({
    audience: request.audience,
    minAge: request.minAge,
    locale: request.locale,
    location: request.location,
    availableObstacleExerciseIds: request.availableObstacleExerciseIds,
  });
  const equipmentFiltered = filterCandidatesForDeclaredEquipment(candidates, request.availableEquipment);
  return filterCandidatesForClubRules(request, equipmentFiltered, rules);
}

function applySportsQualityAudit(request: TrainingDraftRequest, draft: TrainingDraft, candidates: readonly TrainingDraftExerciseCandidate[]): TrainingDraft {
  const quality = assessTrainingSportsQuality(request, draft, candidates);
  const goalWarnings = assessStructuredTrainingGoalCoverage(request, draft, candidates);
  return { ...draft, warnings: [...draft.warnings, ...quality.warnings, ...goalWarnings] };
}

function finalizeDraft(
  request: TrainingDraftRequest,
  draft: TrainingDraft,
  candidates: readonly TrainingDraftExerciseCandidate[],
  rules: Parameters<typeof filterCandidatesForClubRules>[2],
): TrainingDraft {
  const withRotationGroups: TrainingDraft = {
    ...draft,
    session: {
      ...draft.session,
      group: {
        ...draft.session.group,
        groupSplitCount: request.organizationMode === "solo" ? request.groupSplitCount : undefined,
      },
    },
  };
  const programmed = applyMainPartProgramming(request, withRotationGroups);
  const revalidated: TrainingDraft = {
    ...programmed,
    validationIssues: validateTrainingSession(programmed.session, rules, request.availableEquipment),
  };
  return applySportsQualityAudit(request, revalidated, candidates);
}

export async function createTrainingDraft(request: TrainingDraftRequest): Promise<TrainingDraft> {
  const rules = await resolveTrainingClubRules(request);
  const candidates = await approvedCandidatesFor(request, rules);
  if (request.builderMode === "ai") {
    const provider = getConfiguredAiTrainingProvider();
    if (!provider) throw new Error("AI Training Builder ist nicht konfiguriert. Nutze den lokalen Sportalgorithmus oder setze OCRCRAFT_AI_BASE_URL und OCRCRAFT_AI_MODEL.");
    const sourceSessions = await loadAiTrainingSourceSessions(request.sourceTrainingIds, candidates);
    const proposal = await provider.generateTrainingPlan({ request, approvedExercises: candidates, sourceSessions });
    const draft = composeAiTrainingDraft({ proposal, request, approvedExercises: candidates, providerId: provider.id });
    const recompositionWarnings = sourceSessions.length > 0
      ? [`AI-Rekomposition verwendet ${sourceSessions.length} ausgewählte Quelltrainings als Kontext; aktuelle Trainer-Randbedingungen und der freigegebene Übungspool bleiben maßgeblich.`]
      : [];
    return finalizeDraft(request, { ...draft, warnings: [...draft.warnings, ...recompositionWarnings] }, candidates, rules);
  }

  const draft = composeStructuredSportsTrainingDraft({
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
    warmupExerciseCount: request.warmupExerciseCount,
    mainExerciseCount: request.mainExerciseCount,
    mainPartExerciseCounts: request.mainPartExerciseCounts,
    cooldownExerciseCount: request.cooldownExerciseCount,
    mainPartCount: request.mainPartCount,
    organizationMode: request.organizationMode,
    teamSize: request.teamSize,
  }, candidates);
  return finalizeDraft(request, draft, candidates, rules);
}

export async function createDeterministicTrainingDraft(request: TrainingDraftRequest): Promise<TrainingDraft> {
  return createTrainingDraft({ ...request, builderMode: "local" });
}

export async function createAndPersistDeterministicTrainingDraft(input: TrainingDraftPersistenceRequest): Promise<{ readonly id: string; readonly draft: TrainingDraft }> {
  const draft = await createDeterministicTrainingDraft(input.request);
  const id = await persistTrainingDraft(draft, {
    title: input.title,
    locale: input.request.locale,
    groupId: input.groupId,
    source: "manual",
    generation: { builderMode: "local", request: input.request, trainerReviewed: true },
  });
  return { id, draft };
}

export async function persistReviewedAiTrainingDraft(input: ReviewedAiTrainingPersistence): Promise<{ readonly id: string; readonly draft: TrainingDraft }> {
  const rules = await resolveTrainingClubRules(input.request);
  const candidates = await approvedCandidatesFor(input.request, rules);
  const reviewedDraft = composeReviewedAiTrainingDraft(input, candidates);
  const draft = finalizeDraft(input.request, reviewedDraft, candidates, rules);
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