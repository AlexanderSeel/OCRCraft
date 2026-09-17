import "server-only";

import { randomUUID } from "node:crypto";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function duplicateTitle(title: string): string {
  const suffix = " – Kopie";
  const maxBaseLength = Math.max(1, 120 - suffix.length);
  return `${title.trim().slice(0, maxBaseLength)}${suffix}`;
}

export async function duplicateTrainingSession(sourceSessionId: string): Promise<string> {
  if (!UUID_PATTERN.test(sourceSessionId)) throw new Error("Training ist ungültig.");
  await ensureDatabaseReady();

  const targetSessionId = randomUUID();

  await withDuckDbConnection(async (connection) => {
    await connection.run("BEGIN TRANSACTION");
    try {
      const sessionReader = await connection.runAndReadAll(
        `
        SELECT title, group_id::VARCHAR, total_duration_minutes, locale, notes,
          COALESCE(organization_mode,'solo'), team_size
        FROM training_sessions
        WHERE id=$sourceSessionId::UUID
        `,
        { sourceSessionId },
      );
      const sourceSession = sessionReader.getRows()[0];
      if (!sourceSession) throw new Error("Training wurde nicht gefunden.");

      await connection.run(
        `
        INSERT INTO training_sessions (
          id, title, group_id, status, source, total_duration_minutes, locale, notes,
          organization_mode, team_size
        ) VALUES (
          $id::UUID, $title, $groupId::UUID, 'draft', 'copied', $duration, $locale, $notes,
          $organizationMode, $teamSize
        )
        `,
        {
          id: targetSessionId,
          title: duplicateTitle(String(sourceSession[0])),
          groupId: sourceSession[1] == null ? null : String(sourceSession[1]),
          duration: Number(sourceSession[2]),
          locale: String(sourceSession[3]),
          notes: sourceSession[4] == null ? null : String(sourceSession[4]),
          organizationMode: String(sourceSession[5] ?? "solo"),
          teamSize: sourceSession[6] == null ? null : Number(sourceSession[6]),
        },
      );

      const phaseReader = await connection.runAndReadAll(
        `
        SELECT id::VARCHAR, kind, title, sort_order
        FROM training_phases
        WHERE training_session_id=$sourceSessionId::UUID
        ORDER BY sort_order
        `,
        { sourceSessionId },
      );

      for (const phaseRow of phaseReader.getRows()) {
        const sourcePhaseId = String(phaseRow[0]);
        const targetPhaseId = randomUUID();
        await connection.run(
          `
          INSERT INTO training_phases (id, training_session_id, kind, title, sort_order)
          VALUES ($id::UUID, $sessionId::UUID, $kind, $title, $sortOrder)
          `,
          {
            id: targetPhaseId,
            sessionId: targetSessionId,
            kind: String(phaseRow[1]),
            title: String(phaseRow[2]),
            sortOrder: Number(phaseRow[3]),
          },
        );

        const itemReader = await connection.runAndReadAll(
          `
          SELECT exercise_id::VARCHAR, title_override, format, duration_minutes, instructions,
            level_label, sort_order, main_part_index, main_part_title, programming_json
          FROM training_items
          WHERE training_phase_id=$sourcePhaseId::UUID
          ORDER BY sort_order
          `,
          { sourcePhaseId },
        );

        for (const itemRow of itemReader.getRows()) {
          await connection.run(
            `
            INSERT INTO training_items (
              id, training_phase_id, exercise_id, title_override, format,
              duration_minutes, instructions, level_label, sort_order,
              main_part_index, main_part_title, programming_json
            ) VALUES (
              $id::UUID, $phaseId::UUID, $exerciseId::UUID, $titleOverride, $format,
              $duration, $instructions, $levelLabel, $sortOrder,
              $mainPartIndex, $mainPartTitle, $programmingJson
            )
            `,
            {
              id: randomUUID(),
              phaseId: targetPhaseId,
              exerciseId: itemRow[0] == null ? null : String(itemRow[0]),
              titleOverride: itemRow[1] == null ? null : String(itemRow[1]),
              format: itemRow[2] == null ? null : String(itemRow[2]),
              duration: Number(itemRow[3]),
              instructions: itemRow[4] == null ? null : String(itemRow[4]),
              levelLabel: itemRow[5] == null ? null : String(itemRow[5]),
              sortOrder: Number(itemRow[6]),
              mainPartIndex: itemRow[7] == null ? null : Number(itemRow[7]),
              mainPartTitle: itemRow[8] == null ? null : String(itemRow[8]),
              programmingJson: itemRow[9] == null ? null : String(itemRow[9]),
            },
          );
        }
      }

      await connection.run("COMMIT");
    } catch (error) {
      await connection.run("ROLLBACK");
      throw error;
    }
  });

  return targetSessionId;
}
