import type { DuckDBConnection } from "@duckdb/node-api";
import type { StaleMediaRetirement } from "@/domain/media/stale-media-retirement";

export async function listMediaIntegrityCandidates(connection: DuckDBConnection) {
  const reader = await connection.runAndReadAll(`
    SELECT m.id::VARCHAR AS id,m.exercise_id::VARCHAR AS exercise_id,m.storage_provider,m.storage_uri,m.sha256,
      m.review_status,m.generation_status,m.source_type,m.illustration_format,COALESCE(m.is_primary,false) AS is_primary,
      COALESCE(m.biomechanics_review,'unreviewed') AS biomechanics_review,COALESCE(m.text_match_review,'unreviewed') AS text_match_review,
      (SELECT count(*) FROM exercise_image_generation_jobs j WHERE j.exercise_id=m.exercise_id AND j.status IN ('queued','running')) AS active_jobs
    FROM exercise_media_assets m ORDER BY m.id`);
  return reader.getRowObjects().map((row) => ({
    id: String(row.id), exerciseId: String(row.exercise_id), storage_provider: String(row.storage_provider),
    storage_uri: row.storage_uri == null ? null : String(row.storage_uri), sha256: row.sha256 == null ? null : String(row.sha256),
    reviewStatus: String(row.review_status), generationStatus: String(row.generation_status), sourceType: String(row.source_type),
    illustrationFormat: row.illustration_format == null ? null : String(row.illustration_format), isPrimary: Boolean(row.is_primary),
    biomechanicsReview: String(row.biomechanics_review), textMatchReview: String(row.text_match_review), activeJobs: Number(row.active_jobs),
  }));
}

/** Caller holds the cross-process DB lock and has made a checkpoint backup. */
export async function retireStaleMediaCandidates(connection: DuckDBConnection, candidates: readonly StaleMediaRetirement[]) {
  if (!candidates.length) return 0;
  const index = await connection.runAndReadAll("SELECT sql FROM duckdb_indexes() WHERE index_name='exercise_media_assets_review_idx' AND table_name='exercise_media_assets'");
  const originalIndexSql = index.getRows()[0]?.[0];
  const expectedIndexSql = "CREATE INDEX exercise_media_assets_review_idx ON exercise_media_assets(review_status, generation_status);";
  if (originalIndexSql != null && String(originalIndexSql).replace(/\s/g, "") !== expectedIndexSql.replace(/\s/g, "")) {
    throw new Error("Unexpected media review index definition; retirement was not applied.");
  }
  // The index removal must be committed before DuckDB plans the UPDATE.
  // The outer file lock keeps application readers/writers out during this gap.
  if (originalIndexSql != null) await connection.run("DROP INDEX exercise_media_assets_review_idx");
  let transactionOpen = false;
  try {
    await connection.run("BEGIN TRANSACTION");
    transactionOpen = true;
    // Updating an indexed parent column rewrites the row in DuckDB and fails
    // when generation jobs reference it. Keep every FK; rebuild only this index.
    for (const candidate of candidates) {
      const note = `Technisch verworfen: Datei-Hash abweichend; unveränderte Dateibytes gehören zu Kandidat ${candidate.survivingAssetId}. Keine fachliche Freigabe.`;
      const result = await connection.run(`UPDATE exercise_media_assets SET review_status='rejected',
        usage_note=CASE WHEN COALESCE(trim(usage_note),'')='' THEN $note ELSE usage_note || ' · ' || $note END,
        updated_at=current_timestamp
        WHERE id=$assetId::UUID AND exercise_id=$exerciseId::UUID AND storage_uri=$storageUri AND sha256=$recordedHash
          AND review_status='pending' AND COALESCE(is_primary,false)=false AND generation_status='generated'
          AND source_type='ai_generated' AND illustration_format='exercise_sequence'
          AND COALESCE(biomechanics_review,'unreviewed')='unreviewed' AND COALESCE(text_match_review,'unreviewed')='unreviewed'
          AND NOT EXISTS (SELECT 1 FROM exercise_image_generation_jobs WHERE exercise_id=$exerciseId::UUID AND status IN ('queued','running'))
          AND EXISTS (SELECT 1 FROM exercise_media_assets survivor WHERE survivor.id=$survivingAssetId::UUID
            AND survivor.exercise_id=$exerciseId::UUID AND survivor.storage_uri=$storageUri AND lower(survivor.sha256)=$actualHash
            AND survivor.review_status<>'rejected' AND survivor.generation_status='generated')
        `, { ...candidate, note });
      // UPDATE RETURNING also rewrites referenced parent rows in DuckDB.
      if (result.rowsChanged !== 1) throw new Error("Media candidate changed during retirement; all changes were rolled back.");
      await connection.run(`INSERT INTO audit_events(actor_type,action,entity_type,entity_id,metadata_json)
        VALUES ('system','media.integrity_retired','exercise_media_asset',$assetId,$metadata)`, {
        assetId: candidate.assetId, metadata: JSON.stringify(candidate),
      });
    }
    await connection.run("COMMIT");
    transactionOpen = false;
    return candidates.length;
  } catch (error) {
    if (transactionOpen) await connection.run("ROLLBACK");
    throw error;
  } finally {
    if (originalIndexSql != null) await connection.run("CREATE INDEX IF NOT EXISTS exercise_media_assets_review_idx ON exercise_media_assets(review_status, generation_status)");
  }
}
