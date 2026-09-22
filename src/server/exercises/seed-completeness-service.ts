import "server-only";

import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import { runSeedCompletenessQuery, type SeedCompletenessRow } from "./seed-completeness-core";

export interface SeedCompletenessReport {
  readonly totalCatalogExercises: number;
  readonly completeCatalogExercises: number;
  readonly totalExercises: number;
  readonly completeExercises: number;
  readonly incompleteExercises: readonly SeedCompletenessRow[];
  readonly incompleteCatalogExercises: readonly SeedCompletenessRow[];
  readonly completenessPercent: number;
  readonly reviewedExercises: number;
  readonly qualityReviewOpen: number;
  readonly structuredTranslations: StructuredTranslationReport;
}

export interface StructuredTranslationReport {
  readonly expectedLocalizedRecords: number;
  readonly completeDetailRecords: number;
  readonly completeExecutionRecords: number;
  readonly completeCoachingRecords: number;
  readonly completeCorrectionRecords: number;
}

export async function getSeedCompletenessReport(): Promise<SeedCompletenessReport> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const rows = await runSeedCompletenessQuery(connection);
    const catalogRows = await runSeedCompletenessQuery(connection, { includeImported: true });
    const incompleteExercises = rows.filter((row) => row.missingFields.length > 0);
    const incompleteCatalogExercises = catalogRows.filter((row) => row.missingFields.length > 0);
    const completeExercises = rows.length - incompleteExercises.length;
    const qualityReader = await connection.runAndReadAll(`
      SELECT
        count(*) FILTER (WHERE review_status='passed'),
        count(*) FILTER (WHERE review_status<>'passed')
      FROM exercise_seed_quality_reviews
    `);
    const qualityRow = qualityReader.getRows()[0] ?? [];
    const structuredReader = await connection.runAndReadAll(`
      SELECT
        count(*),
        count(*) FILTER (WHERE d.exercise_id IS NOT NULL AND trim(COALESCE(t.summary,'')) <> '' AND trim(COALESCE(d.purpose,'')) <> '' AND trim(COALESCE(d.setup,'')) <> '' AND trim(COALESCE(d.start_position,'')) <> '' AND trim(COALESCE(d.safety_notes,'')) <> '' AND trim(COALESCE(d.quality_criteria,'')) <> ''),
        count(*) FILTER (WHERE (SELECT count(*) FROM exercise_execution_steps s WHERE s.exercise_id=e.id AND s.locale=l.locale) >= 3 AND NOT EXISTS (SELECT 1 FROM exercise_execution_steps s WHERE s.exercise_id=e.id AND s.locale=l.locale AND trim(s.instruction)='')),
        count(*) FILTER (WHERE (SELECT count(*) FROM exercise_coaching_cues c WHERE c.exercise_id=e.id AND c.locale=l.locale) >= 2 AND NOT EXISTS (SELECT 1 FROM exercise_coaching_cues c WHERE c.exercise_id=e.id AND c.locale=l.locale AND trim(c.cue)='')),
        count(*) FILTER (WHERE (SELECT count(*) FROM exercise_common_mistakes m WHERE m.exercise_id=e.id AND m.locale=l.locale) >= 1 AND NOT EXISTS (SELECT 1 FROM exercise_common_mistakes m WHERE m.exercise_id=e.id AND m.locale=l.locale AND (trim(m.mistake)='' OR trim(m.correction)='')))
      FROM exercises e
      CROSS JOIN (VALUES ('de'),('en')) l(locale)
      LEFT JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale=l.locale
      LEFT JOIN exercise_details d ON d.exercise_id=e.id AND d.locale=l.locale
      WHERE e.seed_key IS NOT NULL
    `);
    const structuredRow = structuredReader.getRows()[0] ?? [];

    return {
      totalExercises: rows.length,
      totalCatalogExercises: catalogRows.length,
      completeCatalogExercises: catalogRows.filter((row) => row.missingFields.length === 0).length,
      completeExercises,
      incompleteExercises,
      incompleteCatalogExercises,
      completenessPercent: rows.length === 0 ? 0 : Math.round((completeExercises / rows.length) * 100),
      reviewedExercises: Number(qualityRow[0] ?? 0),
      qualityReviewOpen: Number(qualityRow[1] ?? 0),
      structuredTranslations: {
        expectedLocalizedRecords: Number(structuredRow[0] ?? 0),
        completeDetailRecords: Number(structuredRow[1] ?? 0),
        completeExecutionRecords: Number(structuredRow[2] ?? 0),
        completeCoachingRecords: Number(structuredRow[3] ?? 0),
        completeCorrectionRecords: Number(structuredRow[4] ?? 0),
      },
    };
  });
}
