import type { DuckDBConnection } from "@duckdb/node-api";

export interface ExerciseLibraryPersonalization {
  readonly favoriteExerciseIds: readonly string[];
  readonly recentExercises: readonly {
    readonly exerciseId: string;
    readonly useCount: number;
    readonly lastUsedAt: string;
  }[];
}

export async function runExerciseLibraryPersonalizationQuery(
  connection: DuckDBConnection,
  userId: string,
  recentSessionLimit = 8,
  recentExerciseLimit = 24,
): Promise<ExerciseLibraryPersonalization> {
  const sessionLimit = Math.max(1, Math.min(24, Math.trunc(recentSessionLimit)));
  const exerciseLimit = Math.max(1, Math.min(100, Math.trunc(recentExerciseLimit)));

  const favorites = await connection.runAndReadAll(`
    SELECT f.exercise_id::VARCHAR
    FROM user_exercise_favorites f
    JOIN exercises e ON e.id=f.exercise_id
    WHERE f.user_id=$userId::UUID AND e.archived=false
    ORDER BY f.created_at DESC,f.exercise_id
  `, { userId });

  const recent = await connection.runAndReadAll(`
    WITH recent_sessions AS (
      SELECT id,updated_at
      FROM training_sessions
      WHERE status<>'archived' AND created_by=$userId::UUID
      ORDER BY updated_at DESC,created_at DESC,id
      LIMIT $sessionLimit
    )
    SELECT
      ti.exercise_id::VARCHAR,
      count(*)::INTEGER,
      max(rs.updated_at)::VARCHAR
    FROM recent_sessions rs
    JOIN training_phases tp ON tp.training_session_id=rs.id
    JOIN training_items ti ON ti.training_phase_id=tp.id
    JOIN exercises e ON e.id=ti.exercise_id
    WHERE ti.exercise_id IS NOT NULL AND e.archived=false
    GROUP BY ti.exercise_id
    ORDER BY max(rs.updated_at) DESC,count(*) DESC,ti.exercise_id::VARCHAR
    LIMIT $exerciseLimit
  `, { userId, sessionLimit, exerciseLimit });

  return {
    favoriteExerciseIds: favorites.getRows().map((row) => String(row[0])),
    recentExercises: recent.getRows().map((row) => ({
      exerciseId: String(row[0]),
      useCount: Number(row[1]),
      lastUsedAt: String(row[2]),
    })),
  };
}
