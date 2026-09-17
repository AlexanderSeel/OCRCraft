import "server-only";

import { randomUUID } from "node:crypto";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import { combineTrainingSessionsCore } from "./training-session-combine-core";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface CombineTrainingSessionsInput {
  readonly firstSessionId: string;
  readonly secondSessionId: string;
  readonly title?: string;
}

export async function combineTrainingSessions(
  input: CombineTrainingSessionsInput,
): Promise<string> {
  if (!UUID_PATTERN.test(input.firstSessionId) || !UUID_PATTERN.test(input.secondSessionId)) {
    throw new Error("Training ist ungültig.");
  }
  if (input.firstSessionId === input.secondSessionId) {
    throw new Error("Ein Training kann nicht mit sich selbst kombiniert werden.");
  }

  const targetSessionId = randomUUID();
  await ensureDatabaseReady();

  await withDuckDbConnection(async (connection) => {
    await connection.run("BEGIN TRANSACTION");
    try {
      await combineTrainingSessionsCore(connection, {
        targetSessionId,
        firstSessionId: input.firstSessionId,
        secondSessionId: input.secondSessionId,
        title: input.title,
      });
      await connection.run("COMMIT");
    } catch (error) {
      await connection.run("ROLLBACK");
      throw error;
    }
  });

  return targetSessionId;
}
