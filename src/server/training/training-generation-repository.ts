import "server-only";

import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import {
  trainingDraftRequestSchema,
  type TrainingDraftRequest,
} from "./training-draft-schema";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface TrainingGenerationRecord {
  readonly builderMode: "local" | "ai";
  readonly providerId: string | null;
  readonly providerModel: string | null;
  readonly request: TrainingDraftRequest;
  readonly trainerReviewed: boolean;
  readonly createdAt: string;
}

export async function getLatestTrainingGeneration(
  trainingSessionId: string,
): Promise<TrainingGenerationRecord | null> {
  if (!UUID_PATTERN.test(trainingSessionId)) return null;
  await ensureDatabaseReady();

  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `
      SELECT
        builder_mode,
        provider_id,
        provider_model,
        request_json,
        trainer_reviewed,
        created_at
      FROM training_generation_history
      WHERE training_session_id=$trainingSessionId::UUID
      ORDER BY created_at DESC, id DESC
      LIMIT 1
      `,
      { trainingSessionId },
    );
    const row = reader.getRows()[0];
    if (!row) return null;

    let requestJson: unknown;
    try {
      requestJson = JSON.parse(String(row[3]));
    } catch {
      return null;
    }

    const parsed = trainingDraftRequestSchema.safeParse(requestJson);
    if (!parsed.success) return null;

    const builderMode = String(row[0]);
    if (builderMode !== "local" && builderMode !== "ai") return null;

    return {
      builderMode,
      providerId: row[1] == null ? null : String(row[1]),
      providerModel: row[2] == null ? null : String(row[2]),
      request: {
        ...parsed.data,
        builderMode,
      },
      trainerReviewed: Boolean(row[4]),
      createdAt: String(row[5]),
    };
  });
}
