import { DuckDBInstance } from "@duckdb/node-api";
import { describe, expect, it } from "vitest";
import { runExerciseAutocomplete } from "./autocomplete-core";

async function createAutocompleteFixture() {
  const instance = await DuckDBInstance.create(":memory:");
  const connection = await instance.connect();

  await connection.run(`
    CREATE TABLE exercises (id VARCHAR PRIMARY KEY, category VARCHAR, archived BOOLEAN);
    CREATE TABLE exercise_translations (exercise_id VARCHAR, locale VARCHAR, name VARCHAR, summary VARCHAR);
    CREATE TABLE exercise_aliases (exercise_id VARCHAR, locale VARCHAR, alias VARCHAR);
    CREATE TABLE exercise_training_goals (exercise_id VARCHAR, goal VARCHAR);
    CREATE TABLE tags (id VARCHAR PRIMARY KEY, label_de VARCHAR, label_en VARCHAR);
    CREATE TABLE exercise_tags (exercise_id VARCHAR, tag_id VARCHAR);
    CREATE TABLE movement_patterns (id VARCHAR PRIMARY KEY, label_de VARCHAR, label_en VARCHAR);
    CREATE TABLE exercise_movement_patterns (exercise_id VARCHAR, movement_pattern_id VARCHAR);
    CREATE TABLE equipment (id VARCHAR PRIMARY KEY, name_de VARCHAR, name_en VARCHAR);
    CREATE TABLE exercise_equipment (exercise_id VARCHAR, equipment_id VARCHAR);
    CREATE TABLE body_regions (id VARCHAR PRIMARY KEY, label_de VARCHAR, label_en VARCHAR);
    CREATE TABLE exercise_body_regions (exercise_id VARCHAR, body_region_id VARCHAR);

    INSERT INTO exercises VALUES
      ('carry','carry-lift',false),
      ('squat','strength',false),
      ('hang','grip-rig',false);
    INSERT INTO exercise_translations VALUES
      ('carry','de','Farmer Carry','Trageübung'),('carry','en','Farmer Carry','Carry exercise'),
      ('squat','de','Kniebeuge','Beinübung'),('squat','en','Squat','Leg exercise'),
      ('hang','de','Grip Hang','Hängeübung'),('hang','en','Grip Hang','Hanging exercise');
    INSERT INTO exercise_aliases VALUES
      ('carry','de','Farmer Walk'),('carry','en','Farmer Walk');
    INSERT INTO exercise_training_goals VALUES ('carry','strength_endurance'),('hang','ocr_technique');
    INSERT INTO tags VALUES ('grip','Griffkraft','Grip Strength');
    INSERT INTO exercise_tags VALUES ('carry','grip'),('hang','grip');
    INSERT INTO movement_patterns VALUES ('squat','Kniebeuge','Squat');
    INSERT INTO exercise_movement_patterns VALUES ('squat','squat');
    INSERT INTO equipment VALUES ('kb','Kettlebell','Kettlebell');
    INSERT INTO exercise_equipment VALUES ('carry','kb');
    INSERT INTO body_regions VALUES ('lower-body','Unterkörper','Lower Body');
    INSERT INTO exercise_body_regions VALUES ('squat','lower-body');
  `);

  return connection;
}

describe("exercise autocomplete", () => {
  it("finds exercises from equipment metadata", async () => {
    const connection = await createAutocompleteFixture();
    try {
      const results = await runExerciseAutocomplete(connection, "Kettlebell", "de", 10);
      expect(results.map((item) => item.label)).toContain("Farmer Carry");
      expect(results.find((item) => item.label === "Farmer Carry")?.matchedContext).toBe("Kettlebell");
    } finally {
      connection.closeSync();
    }
  });

  it("finds localized body regions in German and English", async () => {
    const connection = await createAutocompleteFixture();
    try {
      const german = await runExerciseAutocomplete(connection, "Unterkörper", "de", 10);
      const english = await runExerciseAutocomplete(connection, "Lower Body", "en", 10);
      expect(german[0]?.label).toBe("Kniebeuge");
      expect(english[0]?.label).toBe("Squat");
    } finally {
      connection.closeSync();
    }
  });

  it("finds exercises from localized explicit training goals", async () => {
    const connection = await createAutocompleteFixture();
    try {
      const german = await runExerciseAutocomplete(connection, "Kraftausdauer", "de", 10);
      const english = await runExerciseAutocomplete(connection, "OCR Technique", "en", 10);
      expect(german[0]?.label).toBe("Farmer Carry");
      expect(german[0]?.matchedContext).toBe("Kraftausdauer");
      expect(english[0]?.label).toBe("Grip Hang");
      expect(english[0]?.matchedContext).toBe("OCR Technique");
    } finally {
      connection.closeSync();
    }
  });

  it("keeps direct name matches ahead of tag-only matches", async () => {
    const connection = await createAutocompleteFixture();
    try {
      const results = await runExerciseAutocomplete(connection, "Grip", "de", 10);
      expect(results[0]?.label).toBe("Grip Hang");
      expect(results.some((item) => item.label === "Farmer Carry")).toBe(true);
    } finally {
      connection.closeSync();
    }
  });
});
