import "server-only";

import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import { safeExerciseImageUri } from "@/server/exercises/exercise-image-uri";
import type { ExerciseRiskLevel } from "@/domain/exercise/model";

export interface ObstacleCatalogFilters {
  readonly query?: string;
  readonly riskLevel?: string;
  readonly archived?: boolean;
  readonly limit?: number;
  readonly offset?: number;
}

export interface ObstacleCatalogItem {
  readonly exerciseId: string;
  readonly seedKey: string | null;
  readonly name: string;
  readonly category: string;
  readonly riskLevel: ExerciseRiskLevel;
  readonly minAge: number | null;
  readonly archived: boolean;
  readonly indoorSuitable: boolean;
  readonly outdoorSuitable: boolean;
  readonly equipmentConfiguration: string;
  readonly prerequisites: string;
  readonly approach: string;
  readonly execution: string;
  readonly exitReset: string;
  readonly fallbackExercise: string;
  readonly stationCapacity: number;
  readonly clearZoneMetres: number;
  readonly supervision: string | null;
  readonly clubHeightCm: number | null;
  readonly clubSpanCm: number | null;
  readonly clubReachCm: number | null;
  readonly equipment: readonly string[];
  readonly imageUrl: string | null;
}

export interface ObstacleCatalogSummary {
  readonly active: number;
  readonly archived: number;
  readonly highRisk: number;
  readonly withClubDimensions: number;
}

export interface ObstacleCatalogPage {
  readonly items: readonly ObstacleCatalogItem[];
  readonly total: number;
}

export async function getObstacleCatalogSummary(): Promise<ObstacleCatalogSummary> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      SELECT
        count(DISTINCT e.id) FILTER (WHERE e.archived=false),
        count(DISTINCT e.id) FILTER (WHERE e.archived=true),
        count(DISTINCT e.id) FILTER (WHERE e.archived=false AND e.risk_level='high'),
        count(DISTINCT e.id) FILTER (
          WHERE e.archived=false
            AND (e.club_obstacle_height_cm IS NOT NULL
              OR e.club_obstacle_span_cm IS NOT NULL
              OR e.club_obstacle_reach_cm IS NOT NULL)
        )
      FROM exercises e
      WHERE EXISTS (
        SELECT 1 FROM exercise_obstacle_guidance g WHERE g.exercise_id=e.id
      )
    `);
    const row = reader.getRows()[0] ?? [];
    return {
      active: Number(row[0] ?? 0),
      archived: Number(row[1] ?? 0),
      highRisk: Number(row[2] ?? 0),
      withClubDimensions: Number(row[3] ?? 0),
    };
  });
}

export async function listObstacleCatalog({
  query = "",
  riskLevel = "",
  archived = false,
  limit = 120,
  offset = 0,
}: ObstacleCatalogFilters = {}): Promise<readonly ObstacleCatalogItem[]> {
  const page = await listObstacleCatalogPage({ query, riskLevel, archived, limit, offset });
  return page.items;
}

export async function listObstacleCatalogPage({
  query = "",
  riskLevel = "",
  archived = false,
  limit = 120,
  offset = 0,
}: ObstacleCatalogFilters = {}): Promise<ObstacleCatalogPage> {
  await ensureDatabaseReady();
  const boundedLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
  const boundedOffset = Math.max(0, Math.trunc(offset));
  return withDuckDbConnection(async (connection) => {
    const from = `FROM exercises e
      JOIN exercise_obstacle_guidance g ON g.exercise_id=e.id AND g.locale='de'
      LEFT JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='de'`;
    const conditions = `WHERE e.archived=$archived
        AND ($riskLevel='' OR e.risk_level=$riskLevel)
        AND ($query='' OR COALESCE(t.name,e.canonical_name) ILIKE '%' || $query || '%' OR COALESCE(e.seed_key,'') ILIKE '%' || $query || '%' OR g.equipment_configuration ILIKE '%' || $query || '%' OR g.execution ILIKE '%' || $query || '%')`;
    const countReader = await connection.runAndReadAll(`SELECT count(*) ${from} ${conditions}`, { query: query.trim(), riskLevel, archived });
    const reader = await connection.runAndReadAll(`
      SELECT
        e.id::VARCHAR,
        e.seed_key,
        COALESCE(t.name,e.canonical_name),
        COALESCE(e.category,'ocr-skill'),
        e.risk_level,
        e.min_age,
        e.archived,
        COALESCE(e.indoor_suitable,e.indoor,true),
        COALESCE(e.outdoor_suitable,e.outdoor,true),
        g.equipment_configuration,
        g.prerequisites,
        g.approach,
        g.execution,
        g.exit_reset,
        g.fallback_exercise,
        g.station_capacity,
        g.clear_zone_metres,
        d.supervision,
        e.club_obstacle_height_cm,
        e.club_obstacle_span_cm,
        e.club_obstacle_reach_cm,
        COALESCE((
          SELECT string_agg(eq.name_de, ' | ' ORDER BY eq.name_de)
          FROM exercise_equipment ee
          JOIN equipment eq ON eq.id=ee.equipment_id
          WHERE ee.exercise_id=e.id
        ), ''),
        (
          SELECT m.storage_uri
          FROM exercise_media_assets m
          WHERE m.exercise_id=e.id AND m.generation_status='generated' AND m.review_status<>'rejected'
          ORDER BY COALESCE(m.is_primary,false) DESC,m.created_at DESC,m.id DESC\n          LIMIT 1
        )
      ${from}
      LEFT JOIN exercise_details d ON d.exercise_id=e.id AND d.locale='de'
      ${conditions}
      ORDER BY
        CASE e.risk_level WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
        COALESCE(t.name,e.canonical_name),
        e.id
      LIMIT $limit OFFSET $offset
    `, {
      query: query.trim(),
      riskLevel,
      archived,
      limit: boundedLimit,
      offset: boundedOffset,
    });

    return { items: reader.getRows().map((row) => ({
      exerciseId: String(row[0]),
      seedKey: row[1] == null ? null : String(row[1]),
      name: String(row[2]),
      category: String(row[3]),
      riskLevel: String(row[4]) as ExerciseRiskLevel,
      minAge: row[5] == null ? null : Number(row[5]),
      archived: Boolean(row[6]),
      indoorSuitable: Boolean(row[7]),
      outdoorSuitable: Boolean(row[8]),
      equipmentConfiguration: String(row[9] ?? ""),
      prerequisites: String(row[10] ?? ""),
      approach: String(row[11] ?? ""),
      execution: String(row[12] ?? ""),
      exitReset: String(row[13] ?? ""),
      fallbackExercise: String(row[14] ?? ""),
      stationCapacity: Number(row[15] ?? 1),
      clearZoneMetres: Number(row[16] ?? 0),
      supervision: row[17] == null ? null : String(row[17]),
      clubHeightCm: row[18] == null ? null : Number(row[18]),
      clubSpanCm: row[19] == null ? null : Number(row[19]),
      clubReachCm: row[20] == null ? null : Number(row[20]),
      equipment: String(row[21] ?? "").split(" | ").filter(Boolean),
      imageUrl: safeExerciseImageUri(row[22]),
    })), total: Number(countReader.getRows()[0]?.[0] ?? 0) };
  });
}

