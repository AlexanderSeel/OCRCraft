import type { DuckDBConnection } from "@duckdb/node-api";
import { safeExerciseImageUri } from "../exercises/exercise-image-uri";
import type { SearchLocale } from "./exercise-search-documents";
import { normalizeSearchRankingWeights, type SearchRankingWeights } from "./search-profile-core";

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
  readonly imageUrl: string | null;
  readonly imageReviewStatus: string | null;
  readonly imageLicenseLabel: string | null;
  readonly imageFormat: "exercise_sequence" | "legacy_triptych" | null;
  readonly sequenceStepCount: number | null;
}

export interface Bm25SearchOptions {
  readonly query: string;
  readonly category?: string;
  readonly locale: SearchLocale;
  readonly limit: number;
  readonly offset?: number;
  readonly rankingWeights?: Partial<SearchRankingWeights>;
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
  { query, category, locale, limit, offset = 0, rankingWeights }: Bm25SearchOptions,
): Promise<readonly ExerciseSearchHit[]> {
  const config = configForLocale(locale);
  const weights = normalizeSearchRankingWeights(rankingWeights);
  const reader = await connection.runAndReadAll(
    `
    WITH ranked AS (
      SELECT
        sd.entity_id,
        ${config.schema}.match_bm25(sd.document_id, $query) AS bm25_score,
        (
          CASE WHEN sd.aliases ILIKE '%' || $query || '%' THEN $aliasWeight ELSE 0 END
          + CASE WHEN sd.summary ILIKE '%' || $query || '%' THEN $summaryWeight ELSE 0 END
          + CASE WHEN sd.tags ILIKE '%' || $query || '%' THEN $taxonomyWeight ELSE 0 END
          + CASE WHEN sd.body_regions ILIKE '%' || $query || '%' THEN $bodyRegionsWeight ELSE 0 END
          + CASE WHEN sd.equipment ILIKE '%' || $query || '%' THEN $equipmentWeight ELSE 0 END
          + CASE WHEN sd.instructions ILIKE '%' || $query || '%' THEN $instructionsWeight ELSE 0 END
        ) AS field_boost
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
      (
        SELECT m.storage_uri FROM exercise_media_assets m
        WHERE m.exercise_id=e.id AND m.generation_status='generated'
        ORDER BY m.created_at DESC, m.id DESC LIMIT 1
      ) AS image_uri,
      (
        SELECT m.review_status FROM exercise_media_assets m
        WHERE m.exercise_id=e.id AND m.generation_status='generated'
        ORDER BY m.created_at DESC, m.id DESC LIMIT 1
      ) AS image_review_status,
      (
        SELECT m.license_label FROM exercise_media_assets m
        WHERE m.exercise_id=e.id AND m.generation_status='generated'
        ORDER BY m.created_at DESC, m.id DESC LIMIT 1
      ) AS image_license_label,
      ranked.bm25_score
    FROM ranked
    JOIN exercises e ON e.id::VARCHAR=ranked.entity_id
    JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale=$locale
    WHERE ranked.bm25_score IS NOT NULL
      AND e.archived=false
      AND ($category='' OR e.category=$category)
    ORDER BY
      CASE
        WHEN lower(t.name)=lower($query) THEN $exactWeight
        WHEN t.name ILIKE $query || '%' THEN $prefixWeight
        WHEN EXISTS (
          SELECT 1 FROM exercise_aliases a
          WHERE a.exercise_id=e.id
            AND a.locale=$locale
            AND a.alias ILIKE $query || '%'
        ) THEN $aliasWeight
        ELSE 0
      END DESC,
      ranked.field_boost DESC,
      ranked.bm25_score DESC,
      t.name
    LIMIT $limit OFFSET $offset
    `,
    {
      locale,
      query,
      category: category ?? "",
      limit,
      offset,
      exactWeight: weights.exact,
      prefixWeight: weights.prefix,
      aliasWeight: weights.alias,
      summaryWeight: weights.summary,
      taxonomyWeight: weights.taxonomy,
      bodyRegionsWeight: weights.bodyRegions,
      equipmentWeight: weights.equipment,
      instructionsWeight: weights.instructions,
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
    imageUrl: safeExerciseImageUri(row[10]),
    imageReviewStatus: row[11] == null ? null : String(row[11]),
    imageLicenseLabel: row[12] == null ? null : String(row[12]),
    imageFormat: null,
    sequenceStepCount: null,
  }));
}
