import type { DuckDBConnection } from "@duckdb/node-api";

export const TRAINING_ITEM_LEVELS = ["", "Level 1", "Level 2", "Level 3"] as const;
export type TrainingItemLevel = (typeof TRAINING_ITEM_LEVELS)[number];

export async function setTrainingItemLevelCore(
  connection: DuckDBConnection,
  sessionId: string,
  itemId: string,
  level: TrainingItemLevel,
): Promise<boolean> {
  const reader = await connection.runAndReadAll(
    `
    UPDATE training_items
    SET level_label=$levelLabel
    WHERE id=$itemId::UUID
      AND training_phase_id IN (
        SELECT id FROM training_phases WHERE training_session_id=$sessionId::UUID
      )
    RETURNING id::VARCHAR
    `,
    {
      sessionId,
      itemId,
      levelLabel: level || null,
    },
  );

  const updated = reader.getRows().length > 0;
  if (!updated) return false;

  await connection.run(
    `
    UPDATE training_sessions
    SET status='draft', updated_at=current_timestamp
    WHERE id=$sessionId::UUID
    `,
    { sessionId },
  );
  return true;
}
