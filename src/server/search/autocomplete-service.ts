import "server-only";

import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import type { SearchLocale } from "./search-index-service";

export interface ExerciseAutocompleteItem {
  readonly id: string;
  readonly label: string;
  readonly category: string;
  readonly matchedAlias: string | null;
}

export async function autocompleteExercises(
  rawQuery: string,
  locale: SearchLocale = "de",
  limit = 10,
): Promise<readonly ExerciseAutocompleteItem[]> {
  const query = rawQuery.trim();
  if (query.length < 2) return [];

  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `
      SELECT
        e.id::VARCHAR,
        t.name,
        COALESCE(e.category, 'general'),
        (
          SELECT a.alias
          FROM exercise_aliases a
          WHERE a.exercise_id=e.id
            AND a.locale=$locale
            AND a.alias ILIKE '%' || $query || '%'
          ORDER BY CASE WHEN a.alias ILIKE $query || '%' THEN 0 ELSE 1 END, length(a.alias)
          LIMIT 1
        ) AS matched_alias
      FROM exercises e
      JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale=$locale
      WHERE e.archived=false
        AND (
          t.name ILIKE '%' || $query || '%'
          OR EXISTS (
            SELECT 1 FROM exercise_aliases a
            WHERE a.exercise_id=e.id
              AND a.locale=$locale
              AND a.alias ILIKE '%' || $query || '%'
          )
        )
      ORDER BY
        CASE
          WHEN lower(t.name)=lower($query) THEN 0
          WHEN t.name ILIKE $query || '%' THEN 1
          WHEN EXISTS (
            SELECT 1 FROM exercise_aliases a
            WHERE a.exercise_id=e.id AND a.locale=$locale AND a.alias ILIKE $query || '%'
          ) THEN 2
          ELSE 3
        END,
        length(t.name),
        t.name
      LIMIT $limit
      `,
      { locale, query, limit: Math.max(1, Math.min(limit, 20)) },
    );

    return reader.getRows().map((row) => ({
      id: String(row[0]),
      label: String(row[1]),
      category: String(row[2]),
      matchedAlias: row[3] == null ? null : String(row[3]),
    }));
  });
}
