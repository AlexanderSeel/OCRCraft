import "server-only";

import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import {
  listTrainingItemAlternativesCore,
  TRAINING_ALTERNATIVE_MODES,
  type TrainingAlternativeMode,
  type TrainingItemAlternative,
} from "./training-item-alternative-core";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MODE_SET = new Set<string>(TRAINING_ALTERNATIVE_MODES);

export type { TrainingAlternativeMode, TrainingItemAlternative } from "./training-item-alternative-core";

export async function listTrainingItemAlternatives(
  sessionId: string,
  itemId: string,
  mode: string,
  limit = 12,
): Promise<readonly TrainingItemAlternative[]> {
  if (!UUID_PATTERN.test(sessionId) || !UUID_PATTERN.test(itemId)) return [];
  if (!MODE_SET.has(mode)) return [];

  await ensureDatabaseReady();
  return withDuckDbConnection((connection) =>
    listTrainingItemAlternativesCore(
      connection,
      sessionId,
      itemId,
      mode as TrainingAlternativeMode,
      limit,
    ),
  );
}
