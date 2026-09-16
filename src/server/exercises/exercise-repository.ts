import "server-only";

import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";

export interface ExerciseListItem {
  readonly id: string;
  readonly seedKey: string | null;
  readonly name: string;
  readonly summary: string;
  readonly category: string;
  readonly phase: string | null;
  readonly riskLevel: "low" | "medium" | "high";
  readonly minAge: number | null;
  readonly equipment: readonly string[];
}

export interface ExerciseCategoryCount {
  readonly category: string;
  readonly count: number;
}

interface ListExercisesOptions {
  readonly query?: string;
  readonly category?: string;
  readonly locale?: "de" | "en";
  readonly limit?: number;
}

export async function listExercises({
  query = "",
  category,
  locale = "de",
  limit = 80,
}: ListExercisesOptions = {}): Promise<readonly ExerciseListItem[]> {
  await ensureDatabaseReady();

  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `
      SELECT
        e.id::VARCHAR,
        e.seed_key,
        t.name,
        COALESCE(t.summary, ''),
        e.category,
        e.default_phase,
        e.risk_level,
        e.min_age,
        COALESCE((
          SELECT string_agg(CASE WHEN $locale = 'de' THEN eq.name_de ELSE COALESCE(eq.name_en, eq.name_de) END, ' | ')
          FROM exercise_equipment ee
          JOIN equipment eq ON eq.id = ee.equipment_id
          WHERE ee.exercise_id = e.id
        ), '') AS equipment_names
      FROM exercises e
      JOIN exercise_translations t ON t.exercise_id = e.id AND t.locale = $locale
      WHERE e.archived = false
        AND ($category = '' OR e.category = $category)
        AND (
          $query = ''
          OR t.name ILIKE '%' || $query || '%'
          OR COALESCE(t.summary, '') ILIKE '%' || $query || '%'
          OR e.category ILIKE '%' || $query || '%'
          OR EXISTS (
            SELECT 1 FROM exercise_aliases a
            WHERE a.exercise_id = e.id AND a.locale = $locale AND a.alias ILIKE '%' || $query || '%'
          )
        )
      ORDER BY
        CASE WHEN lower(t.name) = lower($query) THEN 0 WHEN t.name ILIKE $query || '%' THEN 1 ELSE 2 END,
        t.name
      LIMIT $limit
      `,
      { locale, category: category ?? "", query: query.trim(), limit },
    );

    return reader.getRows().map((row) => ({
      id: String(row[0]),
      seedKey: row[1] == null ? null : String(row[1]),
      name: String(row[2]),
      summary: String(row[3]),
      category: String(row[4]),
      phase: row[5] == null ? null : String(row[5]),
      riskLevel: String(row[6]) as ExerciseListItem["riskLevel"],
      minAge: row[7] == null ? null : Number(row[7]),
      equipment: String(row[8] ?? "").split(" | ").filter(Boolean),
    }));
  });
}

export async function getExerciseCategoryCounts(): Promise<readonly ExerciseCategoryCount[]> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      SELECT category, count(*)
      FROM exercises
      WHERE archived = false
      GROUP BY category
      ORDER BY category
    `);
    return reader.getRows().map(([category, count]) => ({
      category: String(category),
      count: Number(count),
    }));
  });
}
