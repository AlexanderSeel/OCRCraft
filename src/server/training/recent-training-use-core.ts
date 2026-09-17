import type { DuckDBConnection } from "@duckdb/node-api";

export interface RecentExerciseUse {
  readonly exerciseId: string;
  readonly useCount: number;
}

/**
 * Counts exercise use across the latest active training sessions. This is a soft
 * planning signal only: it never excludes an exercise and therefore cannot make
 * a valid plan impossible when the approved catalog is small.
 */
export async function runRecentExerciseUseQuery(
  connection: DuckDBConnection,
  sessionLimit = 6,
): Promise<readonly RecentExerciseUse[]> {
  const safeLimit = Math.max(1, Math.min(24, Math.trunc(sessionLimit)));
  const reader = await connection.runAndReadAll(
    `
    WITH recent_sessions AS (
      SELECT id
      FROM training_sessions
      WHERE status <> 'archived'
      ORDER BY updated_at DESC, created_at DESC, id
      LIMIT $sessionLimit
    )
    SELECT
      ti.exercise_id::VARCHAR,
      count(*)::INTEGER AS use_count
    FROM training_items ti
    JOIN training_phases tp ON tp.id=ti.training_phase_id
    JOIN recent_sessions rs ON rs.id=tp.training_session_id
    WHERE ti.exercise_id IS NOT NULL
    GROUP BY ti.exercise_id
    ORDER BY use_count DESC, ti.exercise_id::VARCHAR
    `,
    { sessionLimit: safeLimit },
  );

  return reader.getRows().map((row) => ({
    exerciseId: String(row[0]),
    useCount: Number(row[1]),
  }));
}
