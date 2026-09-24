import { DuckDBInstance } from "@duckdb/node-api";
import { describe, expect, it } from "vitest";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

async function runScript(connection: Awaited<ReturnType<InstanceType<typeof DuckDBInstance>["connect"]>>, sql: string) {
  const statements = await connection.extractStatements(sql);
  for (let index = 0; index < statements.count; index += 1) {
    const statement = await statements.prepare(index);
    await statement.run();
  }
}

describe("database migrations", () => {
  it("applies the generated v1.0 baseline to a fresh DuckDB database", async () => {
    const instance = await DuckDBInstance.create(":memory:");
    const connection = await instance.connect();

    try {
      const baseline = await readFile(path.join(process.cwd(), "src", "server", "db", "initial-v1.sql"), "utf8");
      await runScript(connection, baseline);

      const migrations = await connection.runAndReadAll("SELECT count(*) FROM schema_migrations");
      const exercises = await connection.runAndReadAll("SELECT count(*) FROM exercises WHERE seed_key IS NOT NULL");
      const gameCatalog = await connection.runAndReadAll("SELECT count(*) FROM exercises WHERE seed_key LIKE 'game-%'");

      expect(Number(migrations.getRows()[0]?.[0])).toBe(85);
      expect(Number(exercises.getRows()[0]?.[0])).toBeGreaterThanOrEqual(140);
      expect(Number(gameCatalog.getRows()[0]?.[0])).toBe(13);
    } finally {
      connection.closeSync();
    }
  }, 30_000);

  it("applies the complete migration chain to a fresh DuckDB database", async () => {
    const instance = await DuckDBInstance.create(":memory:");
    const connection = await instance.connect();

    try {
      const files = (await readdir(path.join(process.cwd(), "src", "server", "db", "migrations")))
        .filter((fileName) => /^\d{3}_.*\.sql$/.test(fileName))
        .sort();
      expect(files.length).toBeGreaterThanOrEqual(45);
      for (const fileName of files) {
        await runScript(connection, await readFile(path.join(process.cwd(), "src", "server", "db", "migrations", fileName), "utf8"));
      }

      const versions = await connection.runAndReadAll("SELECT count(*) FROM schema_migrations");
      expect(Number(versions.getRows()[0]?.[0])).toBe(files.length);

      const columns = await connection.runAndReadAll(`
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE (table_name='training_sessions' AND column_name IN ('organization_mode','route_name'))
           OR (table_name='exercise_details' AND column_name IN ('pace_guidance','heart_rate_zone'))
        ORDER BY table_name, column_name
      `);
      expect(columns.getRows()).toEqual([
        ["exercise_details", "heart_rate_zone"],
        ["exercise_details", "pace_guidance"],
        ["training_sessions", "organization_mode"],
        ["training_sessions", "route_name"],
      ]);

      const portability = await connection.runAndReadAll(`
        SELECT table_name FROM information_schema.tables
        WHERE table_name='exercise_environment_reviews'
      `);
      expect(portability.getRows()).toEqual([["exercise_environment_reviews"]]);

      const portabilityGaps = await connection.runAndReadAll(`
        SELECT count(*)
        FROM exercises e
        WHERE e.archived=false
          AND NOT EXISTS (
            SELECT 1 FROM exercise_environment_reviews r WHERE r.exercise_id=e.id
          )
      `);
      expect(Number(portabilityGaps.getRows()[0]?.[0])).toBe(0);

      const fitnessStudioTag = await connection.runAndReadAll(
        "SELECT label_de,label_en FROM tags WHERE id='fitnessstudio'",
      );
      expect(fitnessStudioTag.getRows()).toEqual([["Fitnessstudio", "Gym"]]);

      const gameCatalog = await connection.runAndReadAll(`
        SELECT count(*), count(*) FILTER (WHERE exercise_type='game')
        FROM exercises
        WHERE seed_key LIKE 'game-%'
      `);
    expect(gameCatalog.getRows()[0]?.map(Number)).toEqual([13, 13]);

      const gameDetails = await connection.runAndReadAll(`
        SELECT count(*) FROM exercise_details d
        JOIN exercises e ON e.id=d.exercise_id
        WHERE e.seed_key LIKE 'game-%'
      `);
    expect(Number(gameDetails.getRows()[0]?.[0])).toBe(26);
    } finally {
      connection.closeSync();
    }
  }, 30_000);

  it("keeps blocked studio exercises archived and classifies them without changing movement type", async () => {
    const instance = await DuckDBInstance.create(":memory:");
    const connection = await instance.connect();

    try {
      await connection.run(`
        CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, name VARCHAR);
        CREATE TABLE exercises (
          id VARCHAR PRIMARY KEY,
          archived BOOLEAN,
          outdoor_suitable BOOLEAN,
          updated_at TIMESTAMP,
          exercise_type VARCHAR
        );
        CREATE TABLE equipment (id VARCHAR PRIMARY KEY, seed_key VARCHAR);
        CREATE TABLE exercise_equipment (
          exercise_id VARCHAR,
          equipment_id VARCHAR,
          quantity_required INTEGER
        );
        CREATE TABLE tags (id VARCHAR PRIMARY KEY, label_de VARCHAR, label_en VARCHAR);
        CREATE TABLE exercise_tags (
          exercise_id VARCHAR,
          tag_id VARCHAR,
          PRIMARY KEY (exercise_id,tag_id)
        );
        CREATE TABLE exercise_environment_reviews (
          exercise_id VARCHAR PRIMARY KEY,
          disposition VARCHAR,
          reason VARCHAR,
          replacement_equipment VARCHAR,
          reviewed_at TIMESTAMP DEFAULT current_timestamp
        );

        INSERT INTO exercises VALUES
          ('studio-only',false,true,current_timestamp,'strength'),
          ('bodyweight',false,true,current_timestamp,'strength');
        INSERT INTO exercise_environment_reviews
          (exercise_id,disposition,reason,replacement_equipment)
        VALUES ('studio-only','blocked','Studio-only fixture','');
      `);

      const migration = await readFile(
        path.join(process.cwd(), "src", "server", "db", "migrations", "086_portable_catalog_review_completion.sql"),
        "utf8",
      );
      await runScript(connection, migration);

      const studio = await connection.runAndReadAll(`
        SELECT e.archived,e.outdoor_suitable,e.exercise_type,
          EXISTS (
            SELECT 1 FROM exercise_tags et
            WHERE et.exercise_id=e.id AND et.tag_id='fitnessstudio'
          )
        FROM exercises e
        WHERE e.id='studio-only'
      `);
      expect(studio.getRows()).toEqual([[true, false, "strength", true]]);

      const bodyweight = await connection.runAndReadAll(`
        SELECT disposition,reason
        FROM exercise_environment_reviews
        WHERE exercise_id='bodyweight'
      `);
      expect(bodyweight.getRows()).toEqual([[
        "portable",
        "Eigengewichts-, Lauf- oder Mobilitätsübung ohne verpflichtendes Equipment.",
      ]]);
    } finally {
      connection.closeSync();
    }
  });

});
