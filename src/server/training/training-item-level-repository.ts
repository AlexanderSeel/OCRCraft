import "server-only";

import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import {
  setTrainingItemLevelCore,
  TRAINING_ITEM_LEVELS,
  type TrainingItemLevel,
} from "./training-item-level-core";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LEVEL_SET = new Set<string>(TRAINING_ITEM_LEVELS);

export async function setTrainingItemLevel(
  sessionId: string,
  itemId: string,
  level: string,
): Promise<boolean> {
  if (!UUID_PATTERN.test(sessionId) || !UUID_PATTERN.test(itemId)) return false;
  if (!LEVEL_SET.has(level)) throw new Error("Trainingslevel ist ungültig.");

  await ensureDatabaseReady();
  return withDuckDbConnection((connection) =>
    setTrainingItemLevelCore(connection, sessionId, itemId, level as TrainingItemLevel),
  );
}
