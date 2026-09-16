import "server-only";

import { randomUUID } from "node:crypto";
import type { DuckDBConnection } from "@duckdb/node-api";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import {
  addTrainingItemCore,
  deleteTrainingItemCore,
  moveTrainingItemCore,
  replaceTrainingItemExerciseCore,
  updateTrainingItemCore,
  type TrainingItemMoveDirection,
  type TrainingItemMutationInput,
} from "./training-session-mutation-core";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface AddTrainingItemInput extends TrainingItemMutationInput {
  readonly exerciseId: string;
}

function assertUuid(value: string, label: string): void {
  if (!UUID_PATTERN.test(value)) throw new Error(`${label} ist ungültig.`);
}

async function inTransaction<T>(
  operation: (connection: DuckDBConnection) => Promise<T>,
): Promise<T> {
  return withDuckDbConnection(async (connection) => {
    await connection.run("BEGIN TRANSACTION");
    try {
      const result = await operation(connection);
      await connection.run("COMMIT");
      return result;
    } catch (error) {
      await connection.run("ROLLBACK");
      throw error;
    }
  });
}

export async function addTrainingItem(
  sessionId: string,
  phaseId: string,
  input: AddTrainingItemInput,
): Promise<string> {
  assertUuid(sessionId, "Training");
  assertUuid(phaseId, "Phase");
  assertUuid(input.exerciseId, "Übung");
  await ensureDatabaseReady();

  const itemId = randomUUID();
  const inserted = await inTransaction((connection) =>
    addTrainingItemCore(connection, {
      ...input,
      itemId,
      sessionId,
      phaseId,
    }),
  );
  if (!inserted) throw new Error("Übung konnte dieser Trainingsphase nicht hinzugefügt werden.");
  return itemId;
}

export async function updateTrainingItem(
  sessionId: string,
  itemId: string,
  input: TrainingItemMutationInput,
): Promise<void> {
  assertUuid(sessionId, "Training");
  assertUuid(itemId, "Trainingseintrag");
  await ensureDatabaseReady();

  const updated = await inTransaction((connection) =>
    updateTrainingItemCore(connection, { ...input, sessionId, itemId }),
  );
  if (!updated) throw new Error("Trainingseintrag wurde nicht gefunden.");
}

export async function replaceTrainingItemExercise(
  sessionId: string,
  itemId: string,
  exerciseId: string,
): Promise<void> {
  assertUuid(sessionId, "Training");
  assertUuid(itemId, "Trainingseintrag");
  assertUuid(exerciseId, "Übung");
  await ensureDatabaseReady();

  const updated = await inTransaction((connection) =>
    replaceTrainingItemExerciseCore(connection, sessionId, itemId, exerciseId),
  );
  if (!updated) throw new Error("Übung konnte im Training nicht ersetzt werden.");
}

export async function deleteTrainingItem(sessionId: string, itemId: string): Promise<void> {
  assertUuid(sessionId, "Training");
  assertUuid(itemId, "Trainingseintrag");
  await ensureDatabaseReady();

  const deleted = await inTransaction((connection) =>
    deleteTrainingItemCore(connection, sessionId, itemId),
  );
  if (!deleted) throw new Error("Trainingseintrag wurde nicht gefunden.");
}

export async function moveTrainingItem(
  sessionId: string,
  itemId: string,
  direction: TrainingItemMoveDirection,
): Promise<boolean> {
  assertUuid(sessionId, "Training");
  assertUuid(itemId, "Trainingseintrag");
  await ensureDatabaseReady();

  return inTransaction((connection) =>
    moveTrainingItemCore(connection, sessionId, itemId, direction),
  );
}
