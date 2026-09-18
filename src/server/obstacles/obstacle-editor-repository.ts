import "server-only";

import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface LocalizedObstacleGuidanceInput {
  readonly equipmentConfiguration: string;
  readonly prerequisites: string;
  readonly approach: string;
  readonly execution: string;
  readonly exitReset: string;
  readonly fallbackExercise: string;
}

export interface ObstacleGuidanceInput {
  readonly stationCapacity: number;
  readonly clearZoneMetres: number;
  readonly de: LocalizedObstacleGuidanceInput;
  readonly en: LocalizedObstacleGuidanceInput;
}

export interface ObstacleGuidanceEditorData extends ObstacleGuidanceInput {
  readonly hasGuidance: boolean;
}

function emptyLocalized(): LocalizedObstacleGuidanceInput {
  return {
    equipmentConfiguration: "",
    prerequisites: "",
    approach: "",
    execution: "",
    exitReset: "",
    fallbackExercise: "",
  };
}

export async function getObstacleGuidanceEditorData(
  exerciseId: string,
): Promise<ObstacleGuidanceEditorData | null> {
  if (!UUID_PATTERN.test(exerciseId)) return null;
  await ensureDatabaseReady();

  return withDuckDbConnection(async (connection) => {
    const exerciseReader = await connection.runAndReadAll(
      "SELECT id::VARCHAR,COALESCE(station_capacity,1) FROM exercises WHERE id=$exerciseId::UUID",
      { exerciseId },
    );
    const exercise = exerciseReader.getRows()[0];
    if (!exercise) return null;

    const reader = await connection.runAndReadAll(
      `
      SELECT
        locale,
        equipment_configuration,
        prerequisites,
        approach,
        execution,
        exit_reset,
        fallback_exercise,
        station_capacity,
        clear_zone_metres
      FROM exercise_obstacle_guidance
      WHERE exercise_id=$exerciseId::UUID AND locale IN ('de','en')
      ORDER BY locale
      `,
      { exerciseId },
    );

    const byLocale = new Map(reader.getRows().map((row) => [String(row[0]), row] as const));
    const deRow = byLocale.get("de");
    const enRow = byLocale.get("en");
    const firstRow = deRow ?? enRow;

    const localized = (row: readonly unknown[] | undefined): LocalizedObstacleGuidanceInput => row ? {
      equipmentConfiguration: String(row[1] ?? ""),
      prerequisites: String(row[2] ?? ""),
      approach: String(row[3] ?? ""),
      execution: String(row[4] ?? ""),
      exitReset: String(row[5] ?? ""),
      fallbackExercise: String(row[6] ?? ""),
    } : emptyLocalized();

    return {
      hasGuidance: reader.getRows().length > 0,
      stationCapacity: firstRow == null ? Number(exercise[1] ?? 1) : Number(firstRow[7] ?? 1),
      clearZoneMetres: firstRow == null ? 2 : Number(firstRow[8] ?? 2),
      de: localized(deRow),
      en: localized(enRow),
    };
  });
}

export async function updateObstacleGuidance(
  exerciseId: string,
  input: ObstacleGuidanceInput,
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

      for (const locale of ["de", "en"] as const) {
        const localized = input[locale];
        await connection.run(
          `
          INSERT OR REPLACE INTO exercise_obstacle_guidance (
            exercise_id,locale,equipment_configuration,prerequisites,approach,
            execution,exit_reset,fallback_exercise,station_capacity,clear_zone_metres
          ) VALUES (
            $exerciseId::UUID,$locale,$equipmentConfiguration,$prerequisites,$approach,
            $execution,$exitReset,$fallbackExercise,$stationCapacity,$clearZoneMetres
          )
          `,
          {
            exerciseId,
            locale,
            ...localized,
            stationCapacity: input.stationCapacity,
            clearZoneMetres: input.clearZoneMetres,
          },
        );

        await connection.run(
          `
          UPDATE exercise_details SET
            setup=$equipmentConfiguration,
            prerequisites=$prerequisites,
            start_position=$approach,
            finish_reset=$exitReset,
            fallback_exercise=$fallbackExercise,
            station_capacity=$stationCapacity
          WHERE exercise_id=$exerciseId::UUID AND locale=$locale
          `,
          {
            exerciseId,
            locale,
            ...localized,
            stationCapacity: input.stationCapacity,
          },
        );
      }

      await connection.run(
        `
        UPDATE exercises SET
          station_capacity=$stationCapacity,
          max_simultaneous_participants=$stationCapacity,
          obstacle_configuration=$obstacleConfiguration,
          updated_at=current_timestamp
        WHERE id=$exerciseId::UUID
        `,
        {
          exerciseId,
          stationCapacity: input.stationCapacity,
          obstacleConfiguration: input.de.equipmentConfiguration || input.en.equipmentConfiguration,
        },
      );

      await connection.run("COMMIT");
      return true;
    } catch (error) {
      await connection.run("ROLLBACK");
      throw error;
    }
  });
}
