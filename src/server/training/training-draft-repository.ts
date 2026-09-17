import "server-only";

import type { TrainingDraftExerciseCandidate } from "@/domain/training/draft";
import type { Audience, TrainingLocation } from "@/domain/training/model";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import { runRecentExerciseUseQuery } from "./recent-training-use-core";
import {
  runTrainingEquipmentOptionsQuery,
  type TrainingEquipmentOption,
} from "./training-draft-catalog-core";
import { runTrainingDraftCandidateQuery } from "./training-draft-candidate-core";
export type { TrainingEquipmentOption } from "./training-draft-catalog-core";

interface ListTrainingDraftCandidatesOptions {
  readonly audience: Audience;
  readonly minAge?: number;
  readonly locale?: "de" | "en";
  readonly location?: TrainingLocation;
}

export type TrainingDraftCandidateWithHistory = TrainingDraftExerciseCandidate & {
  readonly recentUseCount: number;
};

export async function listTrainingEquipmentOptions(
  locale: "de" | "en" = "de",
): Promise<readonly TrainingEquipmentOption[]> {
  await ensureDatabaseReady();

  return withDuckDbConnection((connection) => runTrainingEquipmentOptionsQuery(connection, locale));
}

export async function listTrainingDraftCandidates({
  audience,
  minAge,
  locale = "de",
  location = "mixed",
}: ListTrainingDraftCandidatesOptions): Promise<readonly TrainingDraftCandidateWithHistory[]> {
  await ensureDatabaseReady();

  return withDuckDbConnection(async (connection) => {
    const candidates = await runTrainingDraftCandidateQuery(connection, { audience, minAge, locale, location });
    const recentUse = await runRecentExerciseUseQuery(connection);
    const recentUseByExercise = new Map(recentUse.map((item) => [item.exerciseId, item.useCount]));
    return candidates.map((candidate) => ({
      ...candidate,
      recentUseCount: recentUseByExercise.get(candidate.id) ?? 0,
    }));
  });
}
