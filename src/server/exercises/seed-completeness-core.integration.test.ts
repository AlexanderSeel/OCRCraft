import { DuckDBInstance } from "@duckdb/node-api";
import { describe, expect, it } from "vitest";
import { runSeedCompletenessQuery } from "./seed-completeness-core";

describe("seed completeness query", () => {
  it("reports missing bilingual trainer fields and passes a complete seed", async () => {
    const instance = await DuckDBInstance.create(":memory:");
    const connection = await instance.connect();
    try {
      await connection.run(`
        CREATE TABLE exercises (
          id VARCHAR, seed_key VARCHAR, category VARCHAR, default_phase VARCHAR,
          exercise_type VARCHAR, difficulty VARCHAR, risk_level VARCHAR,
          suitable_for_kids BOOLEAN, suitable_for_youth BOOLEAN, suitable_for_adults BOOLEAN,
          supports_reps BOOLEAN, supports_seconds BOOLEAN, supports_minutes BOOLEAN,
          supports_metres BOOLEAN, supports_rounds BOOLEAN, supports_attempts BOOLEAN,
          progression_required BOOLEAN
        );
        CREATE TABLE exercise_translations (exercise_id VARCHAR, locale VARCHAR, name VARCHAR, summary VARCHAR);
        CREATE TABLE exercise_aliases (exercise_id VARCHAR, locale VARCHAR, alias VARCHAR);
        CREATE TABLE exercise_details (
          exercise_id VARCHAR, locale VARCHAR, purpose VARCHAR, setup VARCHAR,
          start_position VARCHAR, level_1 VARCHAR, level_2 VARCHAR, level_3 VARCHAR
        );
        CREATE TABLE exercise_execution_steps (exercise_id VARCHAR, locale VARCHAR, instruction VARCHAR);
        CREATE TABLE exercise_coaching_cues (exercise_id VARCHAR, locale VARCHAR, cue VARCHAR);
        CREATE TABLE exercise_common_mistakes (exercise_id VARCHAR, locale VARCHAR, mistake VARCHAR, correction VARCHAR);
        CREATE TABLE exercise_body_regions (exercise_id VARCHAR, emphasis VARCHAR);
        CREATE TABLE exercise_movement_patterns (exercise_id VARCHAR);

        INSERT INTO exercises VALUES
          ('complete','complete-seed','strength','main','strength','beginner','low',true,true,true,true,false,false,false,true,false,false),
          ('incomplete','incomplete-seed','strength','main','strength','beginner','low',true,true,true,true,false,false,false,true,false,false);
        INSERT INTO exercise_translations VALUES
          ('complete','de','Kniebeuge','Kräftigt die Beine.'),('complete','en','Squat','Builds leg strength.'),
          ('incomplete','de','Liegestütz','Trainiert den Oberkörper.'),('incomplete','en','Push-up','Trains the upper body.');
        INSERT INTO exercise_aliases VALUES
          ('complete','de','Squat'),('complete','en','Kniebeuge');
        INSERT INTO exercise_details VALUES
          ('complete','de','Beintraining','Matte bereitlegen.','Stabil stehen.','Leichter','Standard','Schwerer'),
          ('complete','en','Leg exercise','Prepare a mat.','Stand steadily.','Easier','Standard','Harder'),
          ('incomplete','de','','','','','',''),('incomplete','en','','','','','','');
        INSERT INTO exercise_execution_steps SELECT 'complete',l.locale,'Ein Schritt.' FROM (VALUES ('de'),('en')) l(locale), range(3);
        INSERT INTO exercise_coaching_cues VALUES
          ('complete','de','Ruhig'),('complete','de','Stabil'),
          ('complete','en','Steady'),('complete','en','Stable');
        INSERT INTO exercise_common_mistakes VALUES ('complete','de','Fehler','Korrektur'),('complete','en','Mistake','Correction');
        INSERT INTO exercise_body_regions VALUES ('complete','primary');
        INSERT INTO exercise_movement_patterns VALUES ('complete');
      `);

      const rows = await runSeedCompletenessQuery(connection);
      expect(rows).toHaveLength(2);
      expect(rows[0]).toMatchObject({
        seedKey: "complete-seed",
        nameDe: "Kniebeuge",
        nameEn: "Squat",
        missingFields: [],
      });
      expect(rows[1]?.missingFields).toEqual(expect.arrayContaining([
        "Alias Deutsch",
        "Alias Englisch",
        "Zweck Deutsch",
        "Zweck Englisch",
        "Ausführungsschritte Deutsch",
        "Ausführungsschritte Englisch",
        "Coaching-Cues Deutsch",
        "Fehlerkorrektur Englisch",
        "Primäre Körperregion",
        "Bewegungsmuster",
      ]));
    } finally {
      connection.closeSync();
    }
  });
});
