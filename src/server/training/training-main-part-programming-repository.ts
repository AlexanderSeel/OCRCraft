import "server-only";

import type { MainPartProgramming } from "@/domain/training/model";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import { mainPartProgrammingSchema } from "./training-draft-schema";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function updateTrainingMainPartProgramming(
  sessionId: string,
  mainPartIndex: number,
  programming: MainPartProgramming,
): Promise<number> {
  if (!UUID_PATTERN.test(sessionId)) throw new Error("Training ist ungültig.");
  if (!Number.isInteger(mainPartIndex) || mainPartIndex < 1 || mainPartIndex > 12) {
    throw new Error("Hauptteil ist ungültig.");
  }
  const parsed = mainPartProgrammingSchema.safeParse(programming);
  if (!parsed.success) throw new Error("Programmierung ist ungültig.");
  await ensureDatabaseReady();

  return withDuckDbConnection(async (connection) => {
    await connection.run("BEGIN TRANSACTION");
    try {
      const programmingJson = JSON.stringify(parsed.data);
      const reader = await connection.runAndReadAll(
        `
        UPDATE training_items
        SET programming_json=$programmingJson
        WHERE COALESCE(main_part_index,1)=$mainPartIndex
          AND training_phase_id IN (
            SELECT id
            FROM training_phases
            WHERE training_session_id=$sessionId::UUID AND kind='main'
          )
        RETURNING id::VARCHAR
        `,
        { sessionId, mainPartIndex, programmingJson },
      );
      const count = reader.getRows().length;
      if (count === 0) throw new Error("Hauptteil wurde nicht gefunden.");

      await connection.run(
        `
        UPDATE training_sessions
        SET status='draft',updated_at=current_timestamp
        WHERE id=$sessionId::UUID
        `,
        { sessionId },
      );
      await connection.run("COMMIT");
      return count;
    } catch (error) {
      await connection.run("ROLLBACK");
      throw error;
    }
  });
}
