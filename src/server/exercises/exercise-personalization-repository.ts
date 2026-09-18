import "server-only";

import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import { runExerciseLibraryPersonalizationQuery } from "./exercise-personalization-core";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getExerciseLibraryPersonalization(userId: string) {
  if (!UUID_PATTERN.test(userId)) {
    return { favoriteExerciseIds: [], recentExercises: [] } as const;
  }
  await ensureDatabaseReady();
  return withDuckDbConnection((connection) =>
    runExerciseLibraryPersonalizationQuery(connection,userId),
  );
}

export async function setExerciseFavorite(
  userId: string,
  exerciseId: string,
  favorite: boolean,
): Promise<boolean> {
  if (!UUID_PATTERN.test(userId) || !UUID_PATTERN.test(exerciseId)) return false;
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    if (favorite) {
      const exercise = await connection.runAndReadAll(
        "SELECT 1 FROM exercises WHERE id=$exerciseId::UUID AND archived=false",
        { exerciseId },
      );
      if (!exercise.getRows().length) return false;
      await connection.run(`
        INSERT OR IGNORE INTO user_exercise_favorites (user_id,exercise_id)
        VALUES ($userId::UUID,$exerciseId::UUID)
      `, { userId,exerciseId });
      return true;
    }

    await connection.run(`
      DELETE FROM user_exercise_favorites
      WHERE user_id=$userId::UUID AND exercise_id=$exerciseId::UUID
    `, { userId,exerciseId });
    return true;
  });
}
