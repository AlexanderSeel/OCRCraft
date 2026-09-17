import "server-only";

import { composeTrainingDraft, type TrainingDraft } from "@/domain/training/draft";
import { listTrainingDraftCandidates } from "./training-draft-repository";
import type { TrainingDraftPersistenceRequest } from "./training-draft-persistence-schema";
import type { TrainingDraftRequest } from "./training-draft-schema";
import { persistTrainingDraft } from "./training-session-repository";

export async function createDeterministicTrainingDraft(
  request: TrainingDraftRequest,
): Promise<TrainingDraft> {
  const candidates = await listTrainingDraftCandidates({
    audience: request.audience,
    minAge: request.minAge,
    locale: request.locale,
    location: request.location,
  });

  return composeTrainingDraft(
    {
      audience: request.audience,
      participantCount: request.participantCount,
      durationMinutes: request.durationMinutes,
      goals: request.goals,
      bodyRegions: request.bodyRegions,
      avoidBodyRegions: request.avoidBodyRegions,
      formats: request.formats,
      intensity: request.intensity,
      preferredExerciseIds: request.preferredExerciseIds,
      availableEquipment: request.availableEquipment,
      minAge: request.minAge,
      maxAge: request.maxAge,
    },
    candidates,
  );
}

export async function createAndPersistDeterministicTrainingDraft(
  input: TrainingDraftPersistenceRequest,
): Promise<{ readonly id: string; readonly draft: TrainingDraft }> {
  const draft = await createDeterministicTrainingDraft(input.request);
  const id = await persistTrainingDraft(draft, {
    title: input.title,
    locale: input.request.locale,
    groupId: input.groupId,
  });

  return { id, draft };
}
