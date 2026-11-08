import { DuckDBInstance, type DuckDBConnection } from "@duckdb/node-api";
import { expect, it } from "vitest";
import type { StaleMediaRetirement } from "@/domain/media/stale-media-retirement";
import { retireStaleMediaCandidates } from "./stale-media-retirement-repository";

const oldId = "35b80ab9-27a4-444d-96e4-0e3297957426";
const newId = "6f42f47b-3442-49eb-a6f3-5bc4fb374d18";
const exerciseId = "2a7325a5-c89b-4cad-997f-d6a88d550265";
const candidate: StaleMediaRetirement = { assetId: oldId, exerciseId, survivingAssetId: newId,
  storageUri: "/generated/exercises/shared.png", recordedHash: "a".repeat(64), actualHash: "b".repeat(64) };

async function fixture(run: (connection: DuckDBConnection) => Promise<void>) {
  const instance = await DuckDBInstance.create(":memory:");
  const connection = await instance.connect();
  try {
    await connection.run(`CREATE TABLE exercise_media_assets(id UUID PRIMARY KEY,exercise_id UUID,storage_uri VARCHAR,sha256 VARCHAR,
      review_status VARCHAR,generation_status VARCHAR,source_type VARCHAR,illustration_format VARCHAR,is_primary BOOLEAN,
      biomechanics_review VARCHAR,text_match_review VARCHAR,usage_note VARCHAR,updated_at TIMESTAMP);
      CREATE INDEX exercise_media_assets_review_idx ON exercise_media_assets(review_status,generation_status);
      CREATE TABLE exercise_image_generation_jobs(id UUID PRIMARY KEY,asset_id UUID REFERENCES exercise_media_assets(id),exercise_id UUID,status VARCHAR);
      CREATE TABLE audit_events(actor_type VARCHAR,action VARCHAR,entity_type VARCHAR,entity_id VARCHAR,metadata_json VARCHAR);`);
    for (const [id, hash] of [[oldId, candidate.recordedHash], [newId, candidate.actualHash]]) {
      await connection.run(`INSERT INTO exercise_media_assets VALUES ($id::UUID,$exerciseId::UUID,$uri,$hash,'pending','generated',
        'ai_generated','exercise_sequence',false,'unreviewed','unreviewed','original provenance',NULL)`, { id, exerciseId, uri: candidate.storageUri, hash });
    }
    await connection.run("INSERT INTO exercise_image_generation_jobs VALUES (uuid(),$id::UUID,$exerciseId::UUID,'succeeded')", { id: oldId, exerciseId });
    await run(connection);
  } finally {
    connection.closeSync();
    instance.closeSync();
  }
}

it("rejects stale candidates while retaining original hashes, provenance, job FKs and review index", async () => {
  await fixture(async (connection) => {
    expect(await retireStaleMediaCandidates(connection, [candidate])).toBe(1);
    const assets = await connection.runAndReadAll("SELECT id::VARCHAR,review_status,sha256,usage_note FROM exercise_media_assets ORDER BY id");
    expect(assets.getRows()).toEqual([
      [oldId, "rejected", candidate.recordedHash, expect.stringContaining("original provenance · Technisch verworfen:")],
      [newId, "pending", candidate.actualHash, "original provenance"],
    ]);
    expect((await connection.runAndReadAll("SELECT asset_id::VARCHAR,status FROM exercise_image_generation_jobs")).getRows()).toEqual([[oldId, "succeeded"]]);
    expect((await connection.runAndReadAll("SELECT action,metadata_json FROM audit_events")).getRows()).toEqual([["media.integrity_retired", JSON.stringify(candidate)]]);
    expect((await connection.runAndReadAll("SELECT count(*) FROM duckdb_indexes() WHERE index_name='exercise_media_assets_review_idx'")).getRows()[0][0]).toBe(1n);
  });
});

it("rolls back every status, audit entry and index change if any candidate guard fails", async () => {
  await fixture(async (connection) => {
    await expect(retireStaleMediaCandidates(connection, [candidate, candidate])).rejects.toThrow("rolled back");
    expect((await connection.runAndReadAll("SELECT review_status,usage_note FROM exercise_media_assets WHERE id=$id::UUID", { id: oldId })).getRows()).toEqual([["pending", "original provenance"]]);
    expect((await connection.runAndReadAll("SELECT count(*) FROM audit_events")).getRows()[0][0]).toBe(0n);
    expect((await connection.runAndReadAll("SELECT asset_id::VARCHAR FROM exercise_image_generation_jobs")).getRows()).toEqual([[oldId]]);
    expect((await connection.runAndReadAll("SELECT count(*) FROM duckdb_indexes() WHERE index_name='exercise_media_assets_review_idx'")).getRows()[0][0]).toBe(1n);
  });
});
