import type { DuckDBConnection } from "@duckdb/node-api";

export interface SeedReviewEvidence {
  readonly versionedPassed: number;
  readonly compatibilityPassed: number;
  readonly needsWork: number;
  readonly missing: number;
}

/** Review records are evidence trails, not an inferred current human approval. */
export async function runSeedReviewEvidenceQuery(connection: DuckDBConnection): Promise<SeedReviewEvidence> {
  const reader = await connection.runAndReadAll(`
    SELECT
      count(*) FILTER (WHERE evidence='versioned'),
      count(*) FILTER (WHERE evidence='compatibility'),
      count(*) FILTER (WHERE evidence='needs-work'),
      count(*) FILTER (WHERE evidence='missing')
    FROM (
      SELECT CASE
        WHEN r.exercise_id IS NULL THEN 'missing'
        WHEN r.review_status IS NULL OR r.review_status<>'passed' OR trim(COALESCE(r.review_version,''))='' THEN 'needs-work'
        WHEN lower(trim(r.review_version)) LIKE 'compat-%' THEN 'compatibility'
        ELSE 'versioned' END AS evidence
      FROM exercises e
      LEFT JOIN exercise_seed_quality_reviews r ON r.exercise_id=e.id
      WHERE e.seed_key IS NOT NULL
    ) reviews
  `);
  const row = reader.getRows()[0] ?? [];
  return { versionedPassed: Number(row[0] ?? 0), compatibilityPassed: Number(row[1] ?? 0), needsWork: Number(row[2] ?? 0), missing: Number(row[3] ?? 0) };
}
