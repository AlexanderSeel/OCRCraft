import type { DuckDBConnection } from "@duckdb/node-api";

export interface TrainingItemMutationInput {
  readonly durationMinutes: number;
  readonly format: string | null;
  readonly instructions: string | null;
  readonly levelLabel: string | null;
  readonly mainPartIndex?: number | null;
  readonly mainPartTitle?: string | null;
}

export interface AddTrainingItemCoreInput extends TrainingItemMutationInput {
  readonly itemId: string;
  readonly sessionId: string;
  readonly phaseId: string;
  readonly exerciseId: string;
}

export interface UpdateTrainingItemCoreInput extends TrainingItemMutationInput {
  readonly sessionId: string;
  readonly itemId: string;
}

export type TrainingItemMoveDirection = "up" | "down";

async function refreshSessionAfterContentChange(
  connection: DuckDBConnection,
  sessionId: string,
): Promise<void> {
  await connection.run(
    `
    UPDATE training_sessions
    SET
      total_duration_minutes=COALESCE((
        SELECT sum(i.duration_minutes)
        FROM training_phases p
        JOIN training_items i ON i.training_phase_id=p.id
        WHERE p.training_session_id=training_sessions.id
      ), 0),
      status='draft',
      updated_at=current_timestamp
    WHERE id=$sessionId::UUID
    `,
    { sessionId },
  );
}

export async function addTrainingItemCore(
  connection: DuckDBConnection,
  input: AddTrainingItemCoreInput,
): Promise<boolean> {
  const reader = await connection.runAndReadAll(
    `
    INSERT INTO training_items (
      id, training_phase_id, exercise_id, title_override, format,
      duration_minutes, instructions, level_label, sort_order,
      main_part_index, main_part_title
    )
    SELECT
      $itemId::UUID,
      p.id,
      e.id,
      NULL,
      $format,
      $durationMinutes,
      $instructions,
      $levelLabel,
      COALESCE((
        SELECT max(existing.sort_order) + 1
        FROM training_items existing
        WHERE existing.training_phase_id=p.id
      ), 0),
      CASE WHEN p.kind='main' THEN COALESCE(
        $mainPartIndex,
        (SELECT max(existing.main_part_index) FROM training_items existing WHERE existing.training_phase_id=p.id),
        1
      ) ELSE NULL END,
      CASE WHEN p.kind='main' THEN COALESCE(
        NULLIF($mainPartTitle,''),
        'Hauptteil ' || COALESCE(
          $mainPartIndex,
          (SELECT max(existing.main_part_index) FROM training_items existing WHERE existing.training_phase_id=p.id),
          1
        )::VARCHAR
      ) ELSE NULL END
    FROM training_phases p
    JOIN exercises e ON e.id=$exerciseId::UUID AND e.archived=false
    WHERE p.id=$phaseId::UUID
      AND p.training_session_id=$sessionId::UUID
    RETURNING id::VARCHAR
    `,
    {
      itemId: input.itemId,
      sessionId: input.sessionId,
      phaseId: input.phaseId,
      exerciseId: input.exerciseId,
      format: input.format,
      durationMinutes: input.durationMinutes,
      instructions: input.instructions,
      levelLabel: input.levelLabel,
      mainPartIndex: input.mainPartIndex ?? null,
      mainPartTitle: input.mainPartTitle?.trim() ?? "",
    },
  );

  const inserted = reader.getRows().length > 0;
  if (inserted) await refreshSessionAfterContentChange(connection, input.sessionId);
  return inserted;
}

export async function updateTrainingItemCore(
  connection: DuckDBConnection,
  input: UpdateTrainingItemCoreInput,
): Promise<boolean> {
  const reader = await connection.runAndReadAll(
    `
    UPDATE training_items
    SET
      format=$format,
      duration_minutes=$durationMinutes,
      instructions=$instructions,
      level_label=$levelLabel,
      main_part_index=CASE
        WHEN EXISTS (
          SELECT 1 FROM training_phases p
          WHERE p.id=training_items.training_phase_id AND p.kind='main'
        ) THEN COALESCE($mainPartIndex,main_part_index,1)
        ELSE NULL
      END,
      main_part_title=CASE
        WHEN EXISTS (
          SELECT 1 FROM training_phases p
          WHERE p.id=training_items.training_phase_id AND p.kind='main'
        ) THEN COALESCE(NULLIF($mainPartTitle,''),main_part_title,'Hauptteil')
        ELSE NULL
      END
    WHERE id=$itemId::UUID
      AND training_phase_id IN (
        SELECT id FROM training_phases WHERE training_session_id=$sessionId::UUID
      )
    RETURNING id::VARCHAR
    `,
    {
      sessionId: input.sessionId,
      itemId: input.itemId,
      format: input.format,
      durationMinutes: input.durationMinutes,
      instructions: input.instructions,
      levelLabel: input.levelLabel,
      mainPartIndex: input.mainPartIndex ?? null,
      mainPartTitle: input.mainPartTitle?.trim() ?? "",
    },
  );

  const updated = reader.getRows().length > 0;
  if (updated) await refreshSessionAfterContentChange(connection, input.sessionId);
  return updated;
}

export async function replaceTrainingItemExerciseCore(
  connection: DuckDBConnection,
  sessionId: string,
  itemId: string,
  exerciseId: string,
): Promise<boolean> {
  const reader = await connection.runAndReadAll(
    `
    UPDATE training_items
    SET exercise_id=$exerciseId::UUID, title_override=NULL
    WHERE id=$itemId::UUID
      AND training_phase_id IN (
        SELECT id FROM training_phases WHERE training_session_id=$sessionId::UUID
      )
      AND EXISTS (
        SELECT 1 FROM exercises WHERE id=$exerciseId::UUID AND archived=false
      )
    RETURNING id::VARCHAR
    `,
    { sessionId, itemId, exerciseId },
  );

  const updated = reader.getRows().length > 0;
  if (updated) await refreshSessionAfterContentChange(connection, sessionId);
  return updated;
}

export async function deleteTrainingItemCore(
  connection: DuckDBConnection,
  sessionId: string,
  itemId: string,
): Promise<boolean> {
  const reader = await connection.runAndReadAll(
    `
    DELETE FROM training_items
    WHERE id=$itemId::UUID
      AND training_phase_id IN (
        SELECT id FROM training_phases WHERE training_session_id=$sessionId::UUID
      )
    RETURNING id::VARCHAR
    `,
    { sessionId, itemId },
  );

  const deleted = reader.getRows().length > 0;
  if (deleted) await refreshSessionAfterContentChange(connection, sessionId);
  return deleted;
}

export async function moveTrainingItemCore(
  connection: DuckDBConnection,
  sessionId: string,
  itemId: string,
  direction: TrainingItemMoveDirection,
): Promise<boolean> {
  const currentReader = await connection.runAndReadAll(
    `
    SELECT i.training_phase_id::VARCHAR, i.sort_order
    FROM training_items i
    JOIN training_phases p ON p.id=i.training_phase_id
    WHERE i.id=$itemId::UUID AND p.training_session_id=$sessionId::UUID
    `,
    { sessionId, itemId },
  );
  const current = currentReader.getRows()[0];
  if (!current) return false;

  const phaseId = String(current[0]);
  const sortOrder = Number(current[1]);
  const comparison = direction === "up" ? "<" : ">";
  const ordering = direction === "up" ? "DESC" : "ASC";
  const neighborReader = await connection.runAndReadAll(
    `
    SELECT id::VARCHAR, sort_order
    FROM training_items
    WHERE training_phase_id=$phaseId::UUID AND sort_order ${comparison} $sortOrder
    ORDER BY sort_order ${ordering}
    LIMIT 1
    `,
    { phaseId, sortOrder },
  );
  const neighbor = neighborReader.getRows()[0];
  if (!neighbor) return false;

  const neighborId = String(neighbor[0]);
  const neighborSortOrder = Number(neighbor[1]);
  await connection.run(
    "UPDATE training_items SET sort_order=$sortOrder WHERE id=$id::UUID",
    { id: itemId, sortOrder: neighborSortOrder },
  );
  await connection.run(
    "UPDATE training_items SET sort_order=$sortOrder WHERE id=$id::UUID",
    { id: neighborId, sortOrder },
  );
  await connection.run(
    "UPDATE training_sessions SET status='draft', updated_at=current_timestamp WHERE id=$sessionId::UUID",
    { sessionId },
  );
  return true;
}
