import type { DuckDBConnection } from "@duckdb/node-api";
import type { SearchLocale } from "./exercise-search-documents";

export interface ExerciseSearchHit {
  readonly id: string;
  readonly seedKey: string | null;
  readonly name: string;
  readonly summary: string;
  readonly category: string;
  readonly phase: string | null;
  readonly riskLevel: "low" | "medium" | "high";
  readonly minAge: number | null;
  readonly archived: boolean;
  readonly equipment: readonly string[];
}

export interface Bm25SearchOptions {
  readonly query: string;
  readonly category?: string;
  readonly locale: SearchLocale;
  readonly limit: number;
}

function configForLocale(locale: SearchLocale) {
  return locale === "de"
    ? {
        table: "search_documents_de",
        schema: "fts_main_search_documents_de",
        equipmentName: "eq.name_de",
      }
    : {
        table: "search_documents_en",
        schema: "fts_main_search_documents_en",
        equipmentName: "COALESCE(eq.name_en, eq.name_de)",
      };
}

export async function runBm25ExerciseSearch(
  connection: DuckDBConnection,
  { query, category, locale, limit }: Bm25SearchOptions,
): Promise<readonly ExerciseSearchHit[]> {
  const config = configForLocale(locale);
  const reader = await connection.runAndReadAll(
    `
    WITH ranked AS (
      SELECT
        sd.entity_id,
        ${config.schema}.match_bm25(sd.document_id, $query) AS bm25_score
      FROM ${config.table} sd
      WHERE sd.entity_type='exercise'
    )
    SELECT
      e.id::VARCHAR,
      e.seed_key,
      t.name,
      COALESCE(t.summary, ''),
      COALESCE(e.category, 'general'),
      e.default_phase,
      e.risk_level,
      e.min_age,
      e.archived,
      COALESCE((
        SELECT string_agg(${config.equipmentName}, ' | ')
        FROM exercise_equipment ee
        JOIN equipment eq ON eq.id=ee.equipment_id
        WHERE ee.exercise_id=e.id
      ), '') AS equipment_names,
      ranked.bm25_score
    FROM ranked
    JOIN exercises e ON e.id::VARCHAR=ranked.entity_id
    JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale=$locale
    WHERE ranked.bm25_score IS NOT NULL
      AND e.archived=false
      AND ($category='' OR e.category=$category)
    ORDER BY
      CASE
        WHEN lower(t.name)=lower($query) THEN 0
        WHEN t.name ILIKE $query || '%' THEN 1
        WHEN EXISTS (
          SELECT 1 FROM exercise_aliases a
          WHERE a.exercise_id=e.id
            AND a.locale=$locale
            AND a.alias ILIKE $query || '%'
        ) THEN 2
        ELSE 3
      END,
      ranked.bm25_score DESC,
      t.name
    LIMIT $limit
    `,
    {
      locale,
      query,
      category: category ?? "",
      limit,
    },
  );

  return reader.getRows().map((row) => ({
    id: String(row[0]),
    seedKey: row[1] == null ? null : String(row[1]),
    name: String(row[2]),
    summary: String(row[3]),
    category: String(row[4]),
    phase: row[5] == null ? null : String(row[5]),
    riskLevel: String(row[6]) as ExerciseSearchHit["riskLevel"],
    minAge: row[7] == null ? null : Number(row[7]),
    archived: Boolean(row[8]),
    equipment: String(row[9] ?? "").split(" | ").filter(Boolean),
  }));
}
