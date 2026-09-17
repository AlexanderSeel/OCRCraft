import "server-only";

import type { TrainingDraftExerciseCandidate } from "@/domain/training/draft";
import type { AiTrainingSourceSession } from "./ai-training-provider";
import { getTrainingSessionById } from "./training-session-repository";

export async function loadAiTrainingSourceSessions(
  sourceTrainingIds: readonly string[],
  approvedExercises: readonly TrainingDraftExerciseCandidate[],
): Promise<readonly AiTrainingSourceSession[]> {
  if (sourceTrainingIds.length === 0) return [];

  const approvedIds = new Set(approvedExercises.map((exercise) => exercise.id));
  const sessions = await Promise.all(sourceTrainingIds.map((id) => getTrainingSessionById(id)));

  return sessions.flatMap((session) => {
    if (!session) return [];
    const phases = session.phases.map((phase) => ({
      kind: phase.kind,
      exerciseIds: phase.items.flatMap((item) =>
        item.exerciseId && approvedIds.has(item.exerciseId) ? [item.exerciseId] : []
      ),
    }));
    return [{ id: session.id, title: session.title, phases }];
  });
}
