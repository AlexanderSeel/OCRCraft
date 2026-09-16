import type { DuckDBConnection } from "@duckdb/node-api";

export async function reorderTrainingItemsCore(
  connection: DuckDBConnection,
  sessionId: string,
  phaseId: string,
  orderedItemIds: readonly string[],
): Promise<boolean> {
  const currentReader = await connection.runAndReadAll(
    `
    SELECT i.id::VARCHAR
    FROM training_items i
    JOIN training_phases p ON p.id=i.training_phase_id
    WHERE p.id=$phaseId::UUID
      AND p.training_session_id=$sessionId::UUID
    ORDER BY i.sort_order, i.id::VARCHAR
    `,
    { sessionId, phaseId },
  );
  const currentIds = currentReader.getRows().map((row) => String(row[0]));
  if (currentIds.length === 0) return false;

  const requested = new Set(orderedItemIds);
  if (
    requested.size !== orderedItemIds.length
    || currentIds.length !== orderedItemIds.length
    || currentIds.some((id) => !requested.has(id))
  ) {
    throw new Error("Die neue Reihenfolge passt nicht zu den Einträgen dieser Trainingsphase.");
  }

  for (const [sortOrder, itemId] of orderedItemIds.entries()) {
    await connection.run(
      `
      UPDATE training_items
      SET sort_order=$sortOrder
      WHERE id=$itemId::UUID AND training_phase_id=$phaseId::UUID
      `,
      { sortOrder, itemId, phaseId },
    );
  }

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
