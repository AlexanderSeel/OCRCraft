import "server-only";

import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface LocalizedExerciseDetailsInput {
  readonly purpose: string;
  readonly setup: string;
  readonly startPosition: string;
  readonly finishReset: string;
  readonly breathingCue: string;
  readonly tempoCue: string;
  readonly safetyNotes: string;
  readonly qualityCriteria: string;
  readonly beginnerPrescription: string;
  readonly standardPrescription: string;
  readonly advancedPrescription: string;
  readonly workRestGuidance: string;
  readonly level1: string;
  readonly level2: string;
  readonly level3: string;
  readonly childYouthVariant: string;
  readonly prerequisites: string;
  readonly fallbackExercise: string;
}

export interface ExerciseLogisticsInput {
  readonly difficulty: "beginner" | "intermediate" | "advanced";
  readonly supervision: "normal" | "increased" | "direct";
  readonly spaceRequirement: string;
  readonly setupSeconds: number;
  readonly transitionSeconds: number;
  readonly stationCapacity: number;
}

interface LogisticsRow {
  readonly difficulty: ExerciseLogisticsInput["difficulty"];
  readonly supervision: ExerciseLogisticsInput["supervision"];
  readonly spaceRequirement: string;
  readonly setupSeconds: number;
  readonly transitionSeconds: number;
  readonly stationCapacity: number;
}

async function readLogistics(exerciseId: string): Promise<LogisticsRow | null> {
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `
      SELECT
        COALESCE(difficulty, 'beginner'),
        COALESCE(supervision, 'normal'),
        COALESCE(space_requirement, 'medium'),
        COALESCE(setup_seconds, 60),
        COALESCE(transition_seconds, 20),
        COALESCE(station_capacity, 1)
      FROM exercises
      WHERE id=$exerciseId::UUID
      `,
      { exerciseId },
    );
    const row = reader.getRows()[0];
    if (!row) return null;
    return {
      difficulty: String(row[0]) as LogisticsRow["difficulty"],
      supervision: String(row[1]) as LogisticsRow["supervision"],
      spaceRequirement: String(row[2]),
      setupSeconds: Number(row[3]),
      transitionSeconds: Number(row[4]),
      stationCapacity: Number(row[5]),
    };
  });
}

export async function updateLocalizedExerciseDetails(
  exerciseId: string,
  locale: "de" | "en",
  input: LocalizedExerciseDetailsInput,
): Promise<boolean> {
  if (!UUID_PATTERN.test(exerciseId)) return false;
  await ensureDatabaseReady();

  const logistics = await readLogistics(exerciseId);
  if (!logistics) return false;

  return withDuckDbConnection(async (connection) => {
    await connection.run("BEGIN TRANSACTION");
    try {
      await connection.run(
        `
        INSERT OR REPLACE INTO exercise_details (
          exercise_id, locale, purpose, setup, start_position, finish_reset,
          breathing_cue, tempo_cue, safety_notes, quality_criteria,
          beginner_prescription, standard_prescription, advanced_prescription,
          work_rest_guidance, level_1, level_2, level_3, child_youth_variant,
          prerequisites, fallback_exercise, difficulty, supervision,
          space_requirement, setup_seconds, transition_seconds, station_capacity
        ) VALUES (
          $exerciseId::UUID, $locale, $purpose, $setup, $startPosition, $finishReset,
          $breathingCue, $tempoCue, $safetyNotes, $qualityCriteria,
          $beginnerPrescription, $standardPrescription, $advancedPrescription,
          $workRestGuidance, $level1, $level2, $level3, $childYouthVariant,
          $prerequisites, $fallbackExercise, $difficulty, $supervision,
          $spaceRequirement, $setupSeconds, $transitionSeconds, $stationCapacity
        )
        `,
        {
          exerciseId,
          locale,
          ...input,
          ...logistics,
        },
      );
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

export async function updateExerciseLogistics(
  exerciseId: string,
  input: ExerciseLogisticsInput,
): Promise<boolean> {
  if (!UUID_PATTERN.test(exerciseId)) return false;
  await ensureDatabaseReady();

  return withDuckDbConnection(async (connection) => {
    await connection.run("BEGIN TRANSACTION");
    try {
      const reader = await connection.runAndReadAll(
        `
        UPDATE exercises SET
          difficulty=$difficulty,
          supervision=$supervision,
          space_requirement=$spaceRequirement,
          setup_seconds=$setupSeconds,
          transition_seconds=$transitionSeconds,
          station_capacity=$stationCapacity,
          updated_at=current_timestamp
        WHERE id=$exerciseId::UUID
        RETURNING id::VARCHAR
        `,
        { exerciseId, ...input },
      );
      if (reader.getRows().length === 0) {
        await connection.run("ROLLBACK");
        return false;
      }

      await connection.run(
        `
        UPDATE exercise_details SET
          difficulty=$difficulty,
          supervision=$supervision,
          space_requirement=$spaceRequirement,
          setup_seconds=$setupSeconds,
          transition_seconds=$transitionSeconds,
          station_capacity=$stationCapacity
        WHERE exercise_id=$exerciseId::UUID
        `,
        { exerciseId, ...input },
      );
      await connection.run("COMMIT");
      return true;
    } catch (error) {
      await connection.run("ROLLBACK");
      throw error;
    }
  });
}
