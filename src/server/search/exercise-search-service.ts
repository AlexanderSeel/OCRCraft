import "server-only";

import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import {
  listExercises,
  type ExerciseListItem,
} from "@/server/exercises/exercise-repository";
import type { SearchLocale } from "./exercise-search-documents";

export interface ExerciseSearchOptions {
  readonly query?: string;
  readonly category?: string;
  readonly locale?: SearchLocale;
  readonly archived?: boolean;
  readonly limit?: number;
}

interface SearchConfig {
  readonly table: "search_documents_de" | "search_documents_en";
  readonly schema: "fts_main_search_documents_de" | "fts_main_search_documents_en";
  readonly equipmentName: string;
}

function configForLocale(locale: SearchLocale): SearchConfig {
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

async function fallbackSearch(
  options: Required<Pick<ExerciseSearchOptions, "query" | "locale" | "archived" | "limit">> &
    Pick<ExerciseSearchOptions, "category">,
): Promise<readonly ExerciseListItem[]> {
  return listExercises(options);
}

/**
 * Searches the live FTS index when it is known to be healthy. A dirty/failed
 * index never hides fresh CRUD changes: OCRCraft falls back to the structured
 * repository search until an explicit index rebuild succeeds.
 */
export async function searchExercises({
  query: rawQuery = "",
  category,
  locale = "de",
  archived = false,
  limit = 80,
}: ExerciseSearchOptions = {}): Promise<readonly ExerciseListItem[]> {
  const query = rawQuery.trim();
  const safeLimit = Math.max(1, Math.min(limit, 200));
  const fallbackOptions = { query, category, locale, archived, limit: safeLimit };

  if (query.length < 2 || archived) {
    return fallbackSearch(fallbackOptions);
  }

  await ensureDatabaseReady();
  const config = configForLocale(locale);

  try {
    const result = await withDuckDbConnection(async (connection) => {
      const stateReader = await connection.runAndReadAll(
        "SELECT status FROM search_index_state WHERE locale=$locale",
        { locale },
      );
      const status = String(stateReader.getRows()[0]?.[0] ?? "dirty");
      if (status !== "healthy") return null;

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
          limit: safeLimit,
        },
      );

      return reader.getRows().map((row): ExerciseListItem => ({
        id: String(row[0]),
        seedKey: row[1] == null ? null : String(row[1]),
        name: String(row[2]),
        summary: String(row[3]),
        category: String(row[4]),
        phase: row[5] == null ? null : String(row[5]),
        riskLevel: String(row[6]) as ExerciseListItem["riskLevel"],
        minAge: row[7] == null ? null : Number(row[7]),
        archived: Boolean(row[8]),
        equipment: String(row[9] ?? "").split(" | ").filter(Boolean),
      }));
    });

    return result ?? fallbackSearch(fallbackOptions);
  } catch {
    return fallbackSearch(fallbackOptions);
  }
}
