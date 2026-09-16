import "server-only";

import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import { reorderTrainingItemsCore } from "./training-item-reorder-core";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertUuid(value: string, label: string): void {
  if (!UUID_PATTERN.test(value)) throw new Error(`${label} ist ungültig.`);
}

export async function reorderTrainingItems(
  sessionId: string,
  phaseId: string,
  orderedItemIds: readonly string[],
): Promise<void> {
  assertUuid(sessionId, "Training");
  assertUuid(phaseId, "Phase");
  if (orderedItemIds.length === 0) throw new Error("Mindestens ein Trainingseintrag ist erforderlich.");
  for (const itemId of orderedItemIds) assertUuid(itemId, "Trainingseintrag");

  await ensureDatabaseReady();
  await withDuckDbConnection(async (connection) => {
    await connection.run("BEGIN TRANSACTION");
    try {
      const reordered = await reorderTrainingItemsCore(connection, sessionId, phaseId, orderedItemIds);
      if (!reordered) throw new Error("Trainingsphase wurde nicht gefunden oder enthält keine Einträge.");
      await connection.run("COMMIT");
    } catch (error) {
      await connection.run("ROLLBACK");
      throw error;
    }
  });
}
