import { DuckDBInstance } from "@duckdb/node-api";
import { describe, expect, it } from "vitest";
import { normalizeSearchRankingWeights, runBm25ExerciseSearch } from "./exercise-search-core";

async function createSearchFixture() {
  const instance = await DuckDBInstance.create(":memory:");
  const connection = await instance.connect();

  await connection.run(`
    CREATE TABLE exercises (
      id VARCHAR PRIMARY KEY,
      seed_key VARCHAR,
      category VARCHAR,
      default_phase VARCHAR,
      risk_level VARCHAR,
      min_age INTEGER,
      archived BOOLEAN
    );
    CREATE TABLE exercise_translations (
      exercise_id VARCHAR,
      locale VARCHAR,
      name VARCHAR,
      summary VARCHAR
    );
    CREATE TABLE exercise_aliases (
      exercise_id VARCHAR,
      locale VARCHAR,
      alias VARCHAR
    );
    CREATE TABLE equipment (
      id VARCHAR PRIMARY KEY,
      name_de VARCHAR,
      name_en VARCHAR
    );
    CREATE TABLE exercise_equipment (
      exercise_id VARCHAR,
      equipment_id VARCHAR
    );
    CREATE TABLE exercise_media_assets (
      id VARCHAR,
      exercise_id VARCHAR,
      generation_status VARCHAR,
      storage_uri VARCHAR,
      review_status VARCHAR,
      license_label VARCHAR,
      created_at TIMESTAMP DEFAULT current_timestamp
    );
    CREATE TABLE search_documents_de (
      document_id VARCHAR PRIMARY KEY,
      entity_type VARCHAR,
      entity_id VARCHAR,
      title VARCHAR,
      aliases VARCHAR,
      summary VARCHAR,
      tags VARCHAR,
      body_regions VARCHAR,
      equipment VARCHAR,
      instructions VARCHAR
    );
  `);

  await connection.run(`
    INSERT INTO exercises VALUES
      ('carry-1','farmer-carry','carry-lift','main','low',NULL,false),
      ('run-1','easy-jog','running','warmup','low',NULL,false),
      ('run-2','sand-run','running','main','medium',14,false);
    INSERT INTO exercise_translations VALUES
      ('carry-1','de','Farmer Carry','Kontrolliertes Tragen einer Last.'),
      ('run-1','de','Easy Jog','Lockerer Lauf im Sprechtempo.'),
      ('run-2','de','Sand Run','Laufen auf losem Untergrund.');
    INSERT INTO exercise_aliases VALUES
      ('carry-1','de','Farmer Walk'),
      ('run-1','de','Lockerer Lauf');
    INSERT INTO equipment VALUES ('kb','Kettlebell','Kettlebell');
    INSERT INTO exercise_equipment VALUES ('carry-1','kb');
    INSERT INTO exercise_media_assets (id,exercise_id,generation_status,storage_uri,review_status,license_label)
      VALUES ('media-1','run-1','generated','/generated/exercises/run-1.png','pending',NULL);
    INSERT INTO search_documents_de VALUES
      ('exercise:carry-1','exercise','carry-1','Farmer Carry','Farmer Walk','Kontrolliertes Tragen einer Last','carry grip','full body','Kettlebell','schwere Last aufnehmen stabil tragen kontrolliert absetzen'),
      ('exercise:run-1','exercise','run-1','Easy Jog','Lockerer Lauf','Lockerer Lauf im Sprechtempo','running endurance','legs','','ruhig laufen gleichmaessig atmen'),
      ('exercise:run-2','exercise','run-2','Sand Run','','Laufen auf losem Untergrund','running trail','legs','','auf Sand laufen stabiler Schritt');
  `);

  await connection.run("INSTALL fts; LOAD fts;");
  await connection.run(`
    PRAGMA create_fts_index(
      'search_documents_de',
      'document_id',
      'title',
      'aliases',
      'summary',
      'tags',
      'body_regions',
      'equipment',
      'instructions',
      stemmer='german',
      stopwords='none',
      strip_accents=1,
      lower=1,
      overwrite=1
    )
  `);

  return { instance, connection };
}

describe("DuckDB BM25 exercise search", () => {
  it("normalizes configurable ranking weights without allowing negative boosts", () => {
    expect(normalizeSearchRankingWeights({ exact: 140, prefix: -2 })).toEqual({ exact: 140, prefix: 0, alias: 50 });
  });

  it("finds enriched instruction content and hydrates exercise metadata", async () => {
    const { connection } = await createSearchFixture();

    try {
      const results = await runBm25ExerciseSearch(connection, {
        query: "schwere Last",
        locale: "de",
        limit: 10,
      });

      expect(results[0]?.seedKey).toBe("farmer-carry");
      expect(results[0]?.equipment).toEqual(["Kettlebell"]);
    } finally {
      connection.closeSync();
    }
  });

  it("keeps structured category filters as hard constraints", async () => {
    const { connection } = await createSearchFixture();

    try {
      const results = await runBm25ExerciseSearch(connection, {
        query: "Sand",
        category: "running",
        locale: "de",
        limit: 10,
      });

      expect(results.map((item) => item.seedKey)).toEqual(["sand-run"]);
      expect(results.every((item) => item.category === "running")).toBe(true);
    } finally {
      connection.closeSync();
    }
  });

  it("keeps exact exercise names ahead of broader text matches", async () => {
    const { connection } = await createSearchFixture();

    try {
      const results = await runBm25ExerciseSearch(connection, {
        query: "Easy Jog",
        locale: "de",
        limit: 10,
      });

      expect(results[0]?.seedKey).toBe("easy-jog");
      expect(results[0]?.imageUrl).toBe("/generated/exercises/run-1.png");
      expect(results[0]?.imageReviewStatus).toBe("pending");
    } finally {
      connection.closeSync();
    }
  });
});
