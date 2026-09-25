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

      const migrations = await connection.runAndReadAll("SELECT max(version), count(*) FROM schema_migrations");
      const exercises = await connection.runAndReadAll("SELECT count(*) FROM exercises WHERE seed_key IS NOT NULL");
      const gameCatalog = await connection.runAndReadAll("SELECT count(*) FROM exercises WHERE seed_key LIKE 'game-%'");

      expect(migrations.getRows()[0]?.map(Number)).toEqual([89, 88]);
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

      const reviewColumns = await connection.runAndReadAll(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name='exercise_environment_reviews'
          AND column_name IN ('review_status','reviewed_by')
        ORDER BY column_name
      `);
      expect(reviewColumns.getRows()).toEqual([["review_status"], ["reviewed_by"]]);

      const pendingBlockedReviews = await connection.runAndReadAll(`
        SELECT count(*)
        FROM exercise_environment_reviews
        WHERE disposition='blocked' AND review_status='pending'
      `);
      expect(Number(pendingBlockedReviews.getRows()[0]?.[0])).toBe(0);

      const blockedStudioClassification = await connection.runAndReadAll(`
        SELECT count(*)
        FROM exercise_environment_reviews r
        JOIN exercises e ON e.id=r.exercise_id
        WHERE r.disposition='blocked'
          AND e.archived=true
          AND e.outdoor_suitable=false
          AND EXISTS (
            SELECT 1 FROM exercise_tags et
            WHERE et.exercise_id=e.id AND et.tag_id='fitnessstudio'
          )
      `);
      expect(Number(blockedStudioClassification.getRows()[0]?.[0])).toBeGreaterThan(0);

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


  it("normalizes portable import aliases and blocks ambiguous generic machines", async () => {
    const instance = await DuckDBInstance.create(":memory:");
    const connection = await instance.connect();

    try {
      await connection.run(`
        CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, name VARCHAR);
        CREATE TABLE exercises (
          id VARCHAR PRIMARY KEY,
          archived BOOLEAN,
          outdoor_suitable BOOLEAN,
          updated_at TIMESTAMP
        );
        CREATE TABLE equipment (
          id VARCHAR PRIMARY KEY,
          seed_key VARCHAR,
          name_de VARCHAR,
          name_en VARCHAR
        );
        CREATE TABLE exercise_equipment (
          exercise_id VARCHAR,
          equipment_id VARCHAR,
          quantity_required INTEGER,
          PRIMARY KEY (exercise_id,equipment_id)
        );
        CREATE TABLE exercise_outdoor_variant_equipment (
          exercise_id VARCHAR,
          equipment_id VARCHAR,
          quantity_required INTEGER,
          PRIMARY KEY (exercise_id,equipment_id)
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

        INSERT INTO tags VALUES ('fitnessstudio','Fitnessstudio','Gym');
        INSERT INTO equipment VALUES
          ('box','box','Box','Box'),
          ('mat','mat','Matte','Mat'),
          ('ext-box','external-box','box','box'),
          ('ext-body','external-bodyweight','bodyweight','bodyweight'),
          ('ext-machine','external-machine','machine','machine'),
          ('sandbag','sandbag','Sandbag','Sandbag');
        INSERT INTO exercises VALUES
          ('portable',false,true,current_timestamp),
          ('bodyweight',false,true,current_timestamp),
          ('machine',false,true,current_timestamp),
          ('converted',false,true,current_timestamp);
        INSERT INTO exercise_equipment VALUES
          ('portable','ext-box',1),
          ('bodyweight','ext-body',1),
          ('machine','ext-machine',1),
          ('converted','sandbag',1);
        INSERT INTO exercise_environment_reviews
          (exercise_id,disposition,reason,replacement_equipment)
        VALUES
          ('portable','portable','fixture','external-box'),
          ('bodyweight','portable','fixture','external-bodyweight'),
          ('machine','portable','fixture','external-machine'),
          ('converted','converted','fixture','sandbag');
      `);

      const migration = await readFile(
        path.join(process.cwd(), "src", "server", "db", "migrations", "087_reviewed_outdoor_conversion_policy.sql"),
        "utf8",
      );
      await runScript(connection, migration);

      const portable = await connection.runAndReadAll(`
        SELECT eq.seed_key
        FROM exercise_equipment ee
        JOIN equipment eq ON eq.id=ee.equipment_id
        WHERE ee.exercise_id='portable'
      `);
      expect(portable.getRows()).toEqual([["box"]]);

      const bodyweight = await connection.runAndReadAll(
        "SELECT count(*) FROM exercise_equipment WHERE exercise_id='bodyweight'",
      );
      expect(Number(bodyweight.getRows()[0]?.[0])).toBe(0);

      const machine = await connection.runAndReadAll(`
        SELECT e.archived,e.outdoor_suitable,r.disposition,r.review_status,
          EXISTS (
            SELECT 1 FROM exercise_tags et
            WHERE et.exercise_id=e.id AND et.tag_id='fitnessstudio'
          )
        FROM exercises e
        JOIN exercise_environment_reviews r ON r.exercise_id=e.id
        WHERE e.id='machine'
      `);
      expect(machine.getRows()).toEqual([[true, false, "blocked", "pending", true]]);

      const converted = await connection.runAndReadAll(
        "SELECT review_status,reviewed_by FROM exercise_environment_reviews WHERE exercise_id='converted'",
      );
      expect(converted.getRows()).toEqual([["pending", null]]);
    } finally {
      connection.closeSync();
    }
  });

});
