import { DuckDBInstance } from "@duckdb/node-api";
import { describe, expect, it } from "vitest";
import { runTrainingDraftCandidateQuery } from "./training-draft-candidate-core";

async function createFixture() {
  const instance = await DuckDBInstance.create(":memory:");
  const connection = await instance.connect();

  await connection.run(`
    CREATE TABLE exercises (
      id VARCHAR PRIMARY KEY,
      category VARCHAR,
      default_phase VARCHAR,
      risk_level VARCHAR,
      min_age INTEGER,
      archived BOOLEAN,
      suitable_for_kids BOOLEAN,
      suitable_for_youth BOOLEAN,
      suitable_for_adults BOOLEAN,
      default_duration_seconds INTEGER,
      station_capacity INTEGER
    );
    CREATE TABLE exercise_translations (exercise_id VARCHAR, locale VARCHAR, name VARCHAR);
    CREATE TABLE exercise_body_regions (exercise_id VARCHAR, body_region_id VARCHAR);
    CREATE TABLE equipment (id VARCHAR PRIMARY KEY, name_de VARCHAR, name_en VARCHAR);
    CREATE TABLE exercise_equipment (exercise_id VARCHAR, equipment_id VARCHAR);
    CREATE TABLE exercise_tags (exercise_id VARCHAR, tag_id VARCHAR);
    CREATE TABLE exercise_details (
      exercise_id VARCHAR,
      locale VARCHAR,
      purpose VARCHAR,
      quality_criteria VARCHAR,
      level_1 VARCHAR,
      level_2 VARCHAR,
      level_3 VARCHAR,
      station_capacity INTEGER
    );
    CREATE TABLE exercise_execution_steps (
      exercise_id VARCHAR,
      locale VARCHAR,
      step_order INTEGER,
      instruction VARCHAR
    );

    INSERT INTO exercises VALUES
      ('kids-carry','carry-lift','main','low',8,false,true,true,true,240,4),
      ('adult-wall','ocr-skill','main','high',16,false,false,true,true,300,1),
      ('archived','strength','main','low',NULL,true,true,true,true,180,4);
    INSERT INTO exercise_translations VALUES
      ('kids-carry','de','Kinder Carry'),('kids-carry','en','Kids Carry'),
      ('adult-wall','de','Hohe Wand'),('adult-wall','en','High Wall'),
      ('archived','de','Archiviert'),('archived','en','Archived');
    INSERT INTO exercise_body_regions VALUES ('kids-carry','core'),('kids-carry','forearms-grip');
    INSERT INTO equipment VALUES ('bag','Sandsack','Sandbag');
    INSERT INTO exercise_equipment VALUES ('kids-carry','bag');
    INSERT INTO exercise_tags VALUES ('kids-carry','carry'),('kids-carry','teamwork');
    INSERT INTO exercise_details VALUES
      ('kids-carry','de','Sicheres Tragen lernen.','Aufrecht und kontrolliert.','Leicht tragen.','Standard tragen.','Weiter tragen.',4),
      ('kids-carry','en','Learn safe carrying.','Tall and controlled.','Light carry.','Standard carry.','Longer carry.',4);
    INSERT INTO exercise_execution_steps VALUES
      ('kids-carry','de',1,'Sandsack aufnehmen.'),('kids-carry','de',2,'Kontrolliert gehen.'),
      ('kids-carry','en',1,'Pick up the sandbag.'),('kids-carry','en',2,'Walk under control.');
  `);

  return connection;
}

describe("training draft candidate query", () => {
  it("filters by audience and youngest participant age", async () => {
    const connection = await createFixture();
    try {
      const results = await runTrainingDraftCandidateQuery(connection, {
        audience: "kids",
        minAge: 10,
        locale: "de",
      });

      expect(results.map((item) => item.id)).toEqual(["kids-carry"]);
      expect(results[0]?.bodyRegions).toEqual(["core", "forearms-grip"]);
      expect(results[0]?.tags).toEqual(["carry", "teamwork"]);
    } finally {
      connection.closeSync();
    }
  });

  it("hydrates localized equipment and structured coaching context", async () => {
    const connection = await createFixture();
    try {
      const results = await runTrainingDraftCandidateQuery(connection, {
        audience: "mixed",
        minAge: 16,
        locale: "en",
      });
      const carry = results.find((item) => item.id === "kids-carry");

      expect(carry?.name).toBe("Kids Carry");
      expect(carry?.equipment).toEqual(["Sandbag"]);
      expect(carry?.instructions).toContain("Learn safe carrying.");
      expect(carry?.instructions).toContain("Pick up the sandbag.");
      expect(carry?.level2).toBe("Standard carry.");
      expect(carry?.stationCapacity).toBe(4);
      expect(results.find((item) => item.id === "adult-wall")?.stationCapacity).toBe(1);
      expect(results.some((item) => item.id === "archived")).toBe(false);
    } finally {
      connection.closeSync();
    }
  });
});
