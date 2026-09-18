import "server-only";

import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import { safeExerciseImageUri } from "@/server/exercises/exercise-image-uri";
import type { ExerciseRiskLevel } from "@/domain/exercise/model";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface ObstacleCandidate {
  readonly exerciseId: string;
  readonly seedKey: string | null;
  readonly name: string;
  readonly category: string;
  readonly riskLevel: ExerciseRiskLevel;
  readonly imageUrl: string | null;
}

export type AssignExerciseAsObstacleResult = "assigned" | "already_assigned" | "missing";

function fallback(locale: "de" | "en", field: "setup" | "prerequisites" | "approach" | "execution" | "exit" | "fallback"): string {
  const de = {
    setup: "Als Hindernis-Station übernommen; Aufbau vor dem Einsatz prüfen und konkretisieren.",
    prerequisites: "Hindernis-spezifische Voraussetzungen vor dem Einsatz prüfen und ergänzen.",
    approach: "Kontrolliert zur Station gehen und erst starten, wenn der Bereich frei ist.",
    execution: "Die bestehende Übung kontrolliert als Hindernis-Station ausführen; Details vor dem Einsatz prüfen.",
    exit: "Station kontrolliert verlassen und den Bereich für die nächste Person freigeben.",
    fallback: "Reguläre Übungsvariante ohne Hindernis verwenden.",
  };
  const en = {
    setup: "Assigned as an obstacle station; review and specify the setup before use.",
    prerequisites: "Review and add obstacle-specific prerequisites before use.",
    approach: "Approach under control and start only when the station is clear.",
    execution: "Perform the existing exercise under control as an obstacle station; review details before use.",
    exit: "Leave the station under control and clear the area for the next participant.",
    fallback: "Use the regular exercise variation without the obstacle.",
  };
  return (locale === "de" ? de : en)[field];
}

export async function listObstacleCandidates(query: string, limit = 30): Promise<readonly ObstacleCandidate[]> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];
  await ensureDatabaseReady();

  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      SELECT
        e.id::VARCHAR,
        e.seed_key,
        COALESCE(t.name,e.canonical_name),
        COALESCE(e.category,'general'),
        e.risk_level,
        (
          SELECT m.storage_uri
          FROM exercise_media_assets m
          WHERE m.exercise_id=e.id
            AND m.generation_status='generated'
            AND m.review_status<>'rejected'
          ORDER BY m.created_at DESC,m.id DESC
          LIMIT 1
        )
      FROM exercises e
      LEFT JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='de'
      WHERE e.archived=false
        AND NOT EXISTS (
          SELECT 1 FROM exercise_obstacle_guidance g WHERE g.exercise_id=e.id
        )
        AND (
          COALESCE(t.name,e.canonical_name) ILIKE '%' || $query || '%'
          OR COALESCE(t.summary,'') ILIKE '%' || $query || '%'
          OR COALESCE(e.seed_key,'') ILIKE '%' || $query || '%'
          OR COALESCE(e.category,'') ILIKE '%' || $query || '%'
        )
      ORDER BY COALESCE(t.name,e.canonical_name),e.id
      LIMIT $limit
    `, {
      query: normalizedQuery,
      limit: Math.max(1, Math.min(100, limit)),
    });

    return reader.getRows().map((row) => ({
      exerciseId: String(row[0]),
      seedKey: row[1] == null ? null : String(row[1]),
      name: String(row[2]),
      category: String(row[3]),
      riskLevel: String(row[4]) as ExerciseRiskLevel,
      imageUrl: safeExerciseImageUri(row[5]),
    }));
  });
}

export async function assignExerciseAsObstacle(exerciseId: string): Promise<AssignExerciseAsObstacleResult> {
  if (!UUID_PATTERN.test(exerciseId)) return "missing";
  await ensureDatabaseReady();

  return withDuckDbConnection(async (connection) => {
    await connection.run("BEGIN TRANSACTION");
    try {
      const exerciseReader = await connection.runAndReadAll(`
        SELECT COALESCE(station_capacity,1)
        FROM exercises
        WHERE id=$exerciseId::UUID AND archived=false
      `, { exerciseId });
      const exercise = exerciseReader.getRows()[0];
      if (!exercise) {
        await connection.run("ROLLBACK");
        return "missing";
      }

      const existingReader = await connection.runAndReadAll(`
        SELECT count(*) FROM exercise_obstacle_guidance WHERE exercise_id=$exerciseId::UUID
      `, { exerciseId });
      if (Number(existingReader.getRows()[0]?.[0] ?? 0) > 0) {
        await connection.run("ROLLBACK");
        return "already_assigned";
      }

      const stationCapacity = Math.max(1, Number(exercise[0] ?? 1));
      const detailsReader = await connection.runAndReadAll(`
        SELECT
          l.locale,
          COALESCE(d.setup,''),
          COALESCE(d.prerequisites,''),
          COALESCE(d.start_position,''),
          COALESCE(NULLIF((
            SELECT string_agg(s.instruction, ' ' ORDER BY s.step_order)
            FROM exercise_execution_steps s
            WHERE s.exercise_id=$exerciseId::UUID AND s.locale=l.locale
          ), ''), d.quality_criteria, ''),
          COALESCE(d.finish_reset,''),
          COALESCE(d.fallback_exercise,'')
        FROM (VALUES ('de'),('en')) AS l(locale)
        LEFT JOIN exercise_details d
          ON d.exercise_id=$exerciseId::UUID AND d.locale=l.locale
        ORDER BY l.locale
      `, { exerciseId });

      for (const row of detailsReader.getRows()) {
        const locale = String(row[0]) === "en" ? "en" : "de";
        await connection.run(`
          INSERT INTO exercise_obstacle_guidance (
            exercise_id,locale,equipment_configuration,prerequisites,approach,
            execution,exit_reset,fallback_exercise,station_capacity,clear_zone_metres
          ) VALUES (
            $exerciseId::UUID,$locale,$equipmentConfiguration,$prerequisites,$approach,
            $execution,$exitReset,$fallbackExercise,$stationCapacity,2.0
          )
        `, {
          exerciseId,
          locale,
          equipmentConfiguration: String(row[1] || fallback(locale, "setup")),
          prerequisites: String(row[2] || fallback(locale, "prerequisites")),
          approach: String(row[3] || fallback(locale, "approach")),
          execution: String(row[4] || fallback(locale, "execution")),
          exitReset: String(row[5] || fallback(locale, "exit")),
          fallbackExercise: String(row[6] || fallback(locale, "fallback")),
          stationCapacity,
        });
      }

      await connection.run(`
        UPDATE exercises SET updated_at=current_timestamp WHERE id=$exerciseId::UUID
      `, { exerciseId });

      await connection.run("COMMIT");
      return "assigned";
    } catch (error) {
      await connection.run("ROLLBACK");
      throw error;
    }
  });
}

export async function removeExerciseFromObstacles(exerciseId: string): Promise<boolean> {
  if (!UUID_PATTERN.test(exerciseId)) return false;
  await ensureDatabaseReady();

  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      DELETE FROM exercise_obstacle_guidance
      WHERE exercise_id=$exerciseId::UUID
      RETURNING exercise_id::VARCHAR
    `, { exerciseId });
    return reader.getRows().length > 0;
  });
}
