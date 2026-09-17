import type { DuckDBConnection } from "@duckdb/node-api";
import type {
  ExerciseCoordinationComplexity,
  ExerciseDifficulty,
  ExerciseImpactLevel,
  ExerciseLaterality,
  ExerciseMovementPlane,
  ExerciseTrainingGoal,
  ExerciseType,
} from "@/domain/exercise/classification";

export interface ExerciseClassificationInput {
  readonly exerciseType: ExerciseType;
  readonly difficulty: ExerciseDifficulty;
  readonly impactLevel: ExerciseImpactLevel;
  readonly coordinationComplexity: ExerciseCoordinationComplexity;
  readonly progressionRequired: boolean;
  readonly laterality: ExerciseLaterality;
  readonly movementPlane: ExerciseMovementPlane;
  readonly suitableForKids: boolean;
  readonly suitableForYouth: boolean;
  readonly suitableForAdults: boolean;
  readonly indoorSuitable: boolean;
  readonly outdoorSuitable: boolean;
  readonly supportsReps: boolean;
  readonly supportsSeconds: boolean;
  readonly supportsMinutes: boolean;
  readonly supportsMetres: boolean;
  readonly supportsRounds: boolean;
  readonly supportsAttempts: boolean;
  readonly trainingGoals: readonly ExerciseTrainingGoal[];
}

export async function replaceExerciseClassification(
  connection: DuckDBConnection,
  exerciseId: string,
  input: ExerciseClassificationInput,
): Promise<boolean> {
  const { trainingGoals, ...columns } = input;
  const reader = await connection.runAndReadAll(
    `
    UPDATE exercises SET
      exercise_type=$exerciseType,
      difficulty=$difficulty,
      impact_level=$impactLevel,
      coordination_complexity=$coordinationComplexity,
      progression_required=$progressionRequired,
      laterality=$laterality,
      movement_plane=$movementPlane,
      suitable_for_kids=$suitableForKids,
      suitable_for_youth=$suitableForYouth,
      suitable_for_adults=$suitableForAdults,
      indoor_suitable=$indoorSuitable,
      outdoor_suitable=$outdoorSuitable,
      supports_reps=$supportsReps,
      supports_seconds=$supportsSeconds,
      supports_minutes=$supportsMinutes,
      supports_metres=$supportsMetres,
      supports_rounds=$supportsRounds,
      supports_attempts=$supportsAttempts,
      updated_at=current_timestamp
    WHERE id=$exerciseId::UUID
    RETURNING id::VARCHAR
    `,
    { exerciseId, ...columns },
  );
  if (reader.getRows().length === 0) return false;

  await connection.run(
    "DELETE FROM exercise_training_goals WHERE exercise_id=$exerciseId::UUID",
    { exerciseId },
  );
  for (const goal of [...new Set(trainingGoals)]) {
    await connection.run(
      "INSERT INTO exercise_training_goals (exercise_id,goal) VALUES ($exerciseId::UUID,$goal)",
      { exerciseId, goal },
    );
  }
  return true;
}
