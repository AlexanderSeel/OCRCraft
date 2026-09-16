import "server-only";

import { composeTrainingDraft, type TrainingDraft } from "@/domain/training/draft";
import { listTrainingDraftCandidates } from "./training-draft-repository";
import type { TrainingDraftRequest } from "./training-draft-schema";

export async function createDeterministicTrainingDraft(
  request: TrainingDraftRequest,
): Promise<TrainingDraft> {
  const candidates = await listTrainingDraftCandidates({
    audience: request.audience,
    minAge: request.minAge,
    locale: request.locale,
  });

  return composeTrainingDraft(
    {
      audience: request.audience,
      participantCount: request.participantCount,
      durationMinutes: request.durationMinutes,
      goals: request.goals,
      bodyRegions: request.bodyRegions,
      formats: request.formats,
      intensity: request.intensity,
      preferredExerciseIds: request.preferredExerciseIds,
      minAge: request.minAge,
      maxAge: request.maxAge,
    },
    candidates,
  );
}
