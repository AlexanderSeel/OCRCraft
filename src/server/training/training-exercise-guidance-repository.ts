import "server-only";

import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";

export interface TrainingExerciseMistake {
  readonly mistake: string;
  readonly correction: string;
}

export interface TrainingExerciseGuidance {
  readonly exerciseId: string;
  readonly summary: string | null;
  readonly purpose: string | null;
  readonly setup: string | null;
  readonly startPosition: string | null;
  readonly finishReset: string | null;
  readonly safetyNotes: string | null;
  readonly qualityCriteria: string | null;
  readonly executionSteps: readonly string[];
  readonly coachingCues: readonly string[];
  readonly commonMistakes: readonly TrainingExerciseMistake[];
}

export type TrainingExerciseGuidanceMap = Readonly<Record<string, TrainingExerciseGuidance>>;

function textOrNull(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text || null;
}

export async function getTrainingExerciseGuidanceMap(
  exerciseIds: readonly string[],
  locale: "de" | "en",
): Promise<TrainingExerciseGuidanceMap> {
  const uniqueIds = [...new Set(exerciseIds.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length === 0) return {};

  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const idList = uniqueIds.join(",");
    const baseReader = await connection.runAndReadAll(
      `
      SELECT
        e.id::VARCHAR,
        t.summary,
        d.purpose,
        d.setup,
        d.start_position,
        d.finish_reset,
        d.safety_notes,
        d.quality_criteria
      FROM exercises e
      LEFT JOIN exercise_translations t
        ON t.exercise_id=e.id AND t.locale=$locale
      LEFT JOIN exercise_details d
        ON d.exercise_id=e.id AND d.locale=$locale
      WHERE list_contains(string_split($exerciseIds, ','), e.id::VARCHAR)
      `,
      { exerciseIds: idList, locale },
    );

    const result: Record<string, {
      exerciseId: string;
      summary: string | null;
      purpose: string | null;
      setup: string | null;
      startPosition: string | null;
      finishReset: string | null;
      safetyNotes: string | null;
      qualityCriteria: string | null;
      executionSteps: string[];
      coachingCues: string[];
      commonMistakes: TrainingExerciseMistake[];
    }> = {};

    for (const row of baseReader.getRows()) {
      const exerciseId = String(row[0]);
      result[exerciseId] = {
        exerciseId,
        summary: textOrNull(row[1]),
        purpose: textOrNull(row[2]),
        setup: textOrNull(row[3]),
        startPosition: textOrNull(row[4]),
        finishReset: textOrNull(row[5]),
        safetyNotes: textOrNull(row[6]),
        qualityCriteria: textOrNull(row[7]),
        executionSteps: [],
        coachingCues: [],
        commonMistakes: [],
      };
    }

    const stepsReader = await connection.runAndReadAll(
      `
      SELECT exercise_id::VARCHAR, instruction
      FROM exercise_execution_steps
      WHERE locale=$locale
        AND list_contains(string_split($exerciseIds, ','), exercise_id::VARCHAR)
      ORDER BY exercise_id::VARCHAR, step_order
      `,
      { exerciseIds: idList, locale },
    );
    for (const row of stepsReader.getRows()) {
      const guidance = result[String(row[0])];
      const value = textOrNull(row[1]);
      if (guidance && value) guidance.executionSteps.push(value);
    }

    const cuesReader = await connection.runAndReadAll(
      `
      SELECT exercise_id::VARCHAR, cue
      FROM exercise_coaching_cues
      WHERE locale=$locale
        AND list_contains(string_split($exerciseIds, ','), exercise_id::VARCHAR)
      ORDER BY exercise_id::VARCHAR, cue_order
      `,
      { exerciseIds: idList, locale },
    );
    for (const row of cuesReader.getRows()) {
      const guidance = result[String(row[0])];
      const value = textOrNull(row[1]);
      if (guidance && value) guidance.coachingCues.push(value);
    }

    const mistakesReader = await connection.runAndReadAll(
      `
      SELECT exercise_id::VARCHAR, mistake, correction
      FROM exercise_common_mistakes
      WHERE locale=$locale
        AND list_contains(string_split($exerciseIds, ','), exercise_id::VARCHAR)
      ORDER BY exercise_id::VARCHAR, mistake_order
      `,
      { exerciseIds: idList, locale },
    );
    for (const row of mistakesReader.getRows()) {
      const guidance = result[String(row[0])];
      const mistake = textOrNull(row[1]);
      const correction = textOrNull(row[2]);
      if (guidance && mistake && correction) guidance.commonMistakes.push({ mistake, correction });
    }

    return result;
  });
}
