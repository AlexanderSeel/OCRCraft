import { randomUUID } from "node:crypto";
import type { DuckDBConnection } from "@duckdb/node-api";

export interface CombineTrainingSessionsCoreInput {
  readonly targetSessionId: string;
  readonly firstSessionId: string;
  readonly secondSessionId: string;
  readonly title?: string;
}

const PHASES = [
  ["warmup", "Aufwärmen"],
  ["main", "Hauptteil"],
  ["cooldown", "Cooldown & Stretching"],
] as const;

function combinedTitle(firstTitle: string, secondTitle: string, requestedTitle?: string): string {
  const value = requestedTitle?.trim() || `${firstTitle.trim()} + ${secondTitle.trim()}`;
  return value.slice(0, 120);
}

export async function combineTrainingSessionsCore(
  connection: DuckDBConnection,
  input: CombineTrainingSessionsCoreInput,
): Promise<void> {
  if (input.firstSessionId === input.secondSessionId) {
    throw new Error("Ein Training kann nicht mit sich selbst kombiniert werden.");
  }

  const sessionReader = await connection.runAndReadAll(
    `
    SELECT id::VARCHAR, title, group_id::VARCHAR, locale
    FROM training_sessions
    WHERE id IN ($firstSessionId::UUID, $secondSessionId::UUID)
    `,
    {
      firstSessionId: input.firstSessionId,
      secondSessionId: input.secondSessionId,
    },
  );
  const sessions = new Map(sessionReader.getRows().map((row) => [String(row[0]), row]));
  const first = sessions.get(input.firstSessionId);
  const second = sessions.get(input.secondSessionId);
  if (!first || !second) throw new Error("Mindestens ein Training wurde nicht gefunden.");

  const firstGroupId = first[2] == null ? null : String(first[2]);
  const secondGroupId = second[2] == null ? null : String(second[2]);
  const groupId = firstGroupId === secondGroupId ? firstGroupId : null;
  const locale = String(first[3]);
  const title = combinedTitle(String(first[1]), String(second[1]), input.title);

  await connection.run(
    `
    INSERT INTO training_sessions (
      id, title, group_id, status, source, total_duration_minutes, locale, notes
    ) VALUES (
      $targetSessionId::UUID,
      $title,
      $groupId::UUID,
      'draft',
      'combined',
      0,
      $locale,
      $notes
    )
    `,
    {
      targetSessionId: input.targetSessionId,
      title,
      groupId,
      locale,
      notes: `Kombiniert aus „${String(first[1])}“ und „${String(second[1])}“.`,
    },
  );

  for (const [phaseIndex, [kind, fallbackTitle]] of PHASES.entries()) {
    const phaseReader = await connection.runAndReadAll(
      `
      SELECT training_session_id::VARCHAR, title
      FROM training_phases
      WHERE kind=$kind
        AND training_session_id IN ($firstSessionId::UUID, $secondSessionId::UUID)
      ORDER BY CASE WHEN training_session_id=$firstSessionId::UUID THEN 0 ELSE 1 END, sort_order
      `,
      {
        kind,
        firstSessionId: input.firstSessionId,
        secondSessionId: input.secondSessionId,
      },
    );
    const sourcePhases = phaseReader.getRows();
    if (sourcePhases.length === 0) continue;

    const targetPhaseId = randomUUID();
    await connection.run(
      `
      INSERT INTO training_phases (id, training_session_id, kind, title, sort_order)
      VALUES ($id::UUID, $sessionId::UUID, $kind, $title, $sortOrder)
      `,
      {
        id: targetPhaseId,
        sessionId: input.targetSessionId,
        kind,
        title: String(sourcePhases[0]?.[1] ?? fallbackTitle),
        sortOrder: phaseIndex,
      },
    );

    const itemReader = await connection.runAndReadAll(
      `
      SELECT
        p.training_session_id::VARCHAR,
        i.exercise_id::VARCHAR,
        i.title_override,
        i.format,
        i.duration_minutes,
        i.instructions,
        i.level_label,
        i.sort_order
      FROM training_phases p
      JOIN training_items i ON i.training_phase_id=p.id
      WHERE p.kind=$kind
        AND p.training_session_id IN ($firstSessionId::UUID, $secondSessionId::UUID)
      ORDER BY
        CASE WHEN p.training_session_id=$firstSessionId::UUID THEN 0 ELSE 1 END,
        i.sort_order,
        i.id
      `,
      {
        kind,
        firstSessionId: input.firstSessionId,
        secondSessionId: input.secondSessionId,
      },
    );

    for (const [sortOrder, row] of itemReader.getRows().entries()) {
      await connection.run(
        `
        INSERT INTO training_items (
          id, training_phase_id, exercise_id, title_override, format,
          duration_minutes, instructions, level_label, sort_order
        ) VALUES (
          $id::UUID, $phaseId::UUID, $exerciseId::UUID, $titleOverride, $format,
          $duration, $instructions, $levelLabel, $sortOrder
        )
        `,
        {
          id: randomUUID(),
          phaseId: targetPhaseId,
          exerciseId: row[1] == null ? null : String(row[1]),
          titleOverride: row[2] == null ? null : String(row[2]),
          format: row[3] == null ? null : String(row[3]),
          duration: Number(row[4]),
          instructions: row[5] == null ? null : String(row[5]),
          levelLabel: row[6] == null ? null : String(row[6]),
          sortOrder,
        },
      );
    }
  }

  await connection.run(
    `
    UPDATE training_sessions
    SET total_duration_minutes=COALESCE((
      SELECT sum(i.duration_minutes)
      FROM training_phases p
      JOIN training_items i ON i.training_phase_id=p.id
      WHERE p.training_session_id=$targetSessionId::UUID
    ), 0), updated_at=current_timestamp
    WHERE id=$targetSessionId::UUID
    `,
    { targetSessionId: input.targetSessionId },
  );
}
