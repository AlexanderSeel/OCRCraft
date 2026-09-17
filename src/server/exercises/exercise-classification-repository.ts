import "server-only";

import type {
  ExerciseCoordinationComplexity,
  ExerciseDifficulty,
  ExerciseImpactLevel,
  ExerciseLaterality,
  ExerciseMovementPlane,
  ExerciseTrainingGoal,
  ExerciseType,
} from "@/domain/exercise/classification";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import { refreshExerciseSearchDocuments } from "@/server/search/exercise-search-documents";
import {
  replaceExerciseClassification,
  type ExerciseClassificationInput,
} from "./exercise-classification-core";

export interface ExerciseClassificationEditorData extends ExerciseClassificationInput {}

export async function getExerciseClassificationEditorData(
  exerciseId: string,
): Promise<ExerciseClassificationEditorData | null> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `
      SELECT
        COALESCE(exercise_type,'drill'),
        COALESCE(difficulty,'beginner'),
        COALESCE(impact_level,'low'),
        COALESCE(coordination_complexity,'simple'),
        COALESCE(progression_required,false),
        COALESCE(laterality,'bilateral'),
        COALESCE(movement_plane,'sagittal'),
        COALESCE(suitable_for_kids,true),
        COALESCE(suitable_for_youth,true),
        COALESCE(suitable_for_adults,true),
        COALESCE(indoor_suitable,true),
        COALESCE(outdoor_suitable,true),
        COALESCE(supports_reps,true),
        COALESCE(supports_seconds,true),
        COALESCE(supports_minutes,false),
        COALESCE(supports_metres,false),
        COALESCE(supports_rounds,true),
        COALESCE(supports_attempts,false)
      FROM exercises
      WHERE id=$exerciseId::UUID
      `,
      { exerciseId },
    );
    const row = reader.getRows()[0];
    if (!row) return null;

    const goalsReader = await connection.runAndReadAll(
      "SELECT goal FROM exercise_training_goals WHERE exercise_id=$exerciseId::UUID ORDER BY goal",
      { exerciseId },
    );

    return {
      exerciseType: String(row[0]) as ExerciseType,
      difficulty: String(row[1]) as ExerciseDifficulty,
      impactLevel: String(row[2]) as ExerciseImpactLevel,
      coordinationComplexity: String(row[3]) as ExerciseCoordinationComplexity,
      progressionRequired: Boolean(row[4]),
      laterality: String(row[5]) as ExerciseLaterality,
      movementPlane: String(row[6]) as ExerciseMovementPlane,
      suitableForKids: Boolean(row[7]),
      suitableForYouth: Boolean(row[8]),
      suitableForAdults: Boolean(row[9]),
      indoorSuitable: Boolean(row[10]),
      outdoorSuitable: Boolean(row[11]),
      supportsReps: Boolean(row[12]),
      supportsSeconds: Boolean(row[13]),
      supportsMinutes: Boolean(row[14]),
      supportsMetres: Boolean(row[15]),
      supportsRounds: Boolean(row[16]),
      supportsAttempts: Boolean(row[17]),
      trainingGoals: goalsReader.getRows().map((goalRow) => String(goalRow[0]) as ExerciseTrainingGoal),
    };
  });
}

export async function updateExerciseClassification(
  exerciseId: string,
  input: ExerciseClassificationInput,
): Promise<boolean> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    await connection.run("BEGIN TRANSACTION");
    try {
      const saved = await replaceExerciseClassification(connection, exerciseId, input);
      if (!saved) {
        await connection.run("ROLLBACK");
        return false;
      }
      await refreshExerciseSearchDocuments(connection, "de");
      await refreshExerciseSearchDocuments(connection, "en");
      await connection.run(
        "UPDATE search_index_state SET status='dirty', last_error=NULL WHERE locale IN ('de','en')",
      );
      await connection.run("COMMIT");
      return true;
    } catch (error) {
      await connection.run("ROLLBACK");
      throw error;
    }
  });
}
