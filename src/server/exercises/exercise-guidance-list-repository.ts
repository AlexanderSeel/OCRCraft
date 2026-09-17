import "server-only";

import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface ExerciseGuidanceMistakeInput {
  readonly mistake: string;
  readonly correction: string;
}

export interface ExerciseGuidanceListsInput {
  readonly executionSteps: readonly string[];
  readonly coachingCues: readonly string[];
  readonly commonMistakes: readonly ExerciseGuidanceMistakeInput[];
}

export async function updateExerciseGuidanceLists(
  exerciseId: string,
  locale: "de" | "en",
  input: ExerciseGuidanceListsInput,
): Promise<boolean> {
  if (!UUID_PATTERN.test(exerciseId)) return false;

  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    await connection.run("BEGIN TRANSACTION");
    try {
      const exerciseReader = await connection.runAndReadAll(
        "SELECT id::VARCHAR FROM exercises WHERE id=$exerciseId::UUID",
        { exerciseId },
      );
      if (exerciseReader.getRows().length === 0) {
        await connection.run("ROLLBACK");
        return false;
      }

      await connection.run(
        "DELETE FROM exercise_execution_steps WHERE exercise_id=$exerciseId::UUID AND locale=$locale",
        { exerciseId, locale },
      );
      for (const [index, instruction] of input.executionSteps.entries()) {
        await connection.run(
          `INSERT INTO exercise_execution_steps (exercise_id, locale, step_order, instruction)
           VALUES ($exerciseId::UUID, $locale, $stepOrder, $instruction)`,
          { exerciseId, locale, stepOrder: index + 1, instruction },
        );
      }

      await connection.run(
        "DELETE FROM exercise_coaching_cues WHERE exercise_id=$exerciseId::UUID AND locale=$locale",
        { exerciseId, locale },
      );
      for (const [index, cue] of input.coachingCues.entries()) {
        await connection.run(
          `INSERT INTO exercise_coaching_cues (exercise_id, locale, cue_order, cue)
           VALUES ($exerciseId::UUID, $locale, $cueOrder, $cue)`,
          { exerciseId, locale, cueOrder: index + 1, cue },
        );
      }

      await connection.run(
        "DELETE FROM exercise_common_mistakes WHERE exercise_id=$exerciseId::UUID AND locale=$locale",
        { exerciseId, locale },
      );
      for (const [index, item] of input.commonMistakes.entries()) {
        await connection.run(
          `INSERT INTO exercise_common_mistakes
             (exercise_id, locale, mistake_order, mistake, correction)
           VALUES ($exerciseId::UUID, $locale, $mistakeOrder, $mistake, $correction)`,
          {
            exerciseId,
            locale,
            mistakeOrder: index + 1,
            mistake: item.mistake,
            correction: item.correction,
          },
        );
      }

      await connection.run(
        "UPDATE exercises SET updated_at=current_timestamp WHERE id=$exerciseId::UUID",
        { exerciseId },
      );
      await connection.run("COMMIT");
      return true;
    } catch (error) {
      await connection.run("ROLLBACK");
      throw error;
    }
  });
}
