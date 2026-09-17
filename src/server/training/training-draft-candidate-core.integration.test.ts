import { DuckDBInstance } from "@duckdb/node-api";
import { describe, expect, it } from "vitest";
import { runTrainingEquipmentOptionsQuery } from "./training-draft-catalog-core";
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
      indoor_suitable BOOLEAN,
      outdoor_suitable BOOLEAN,
      default_duration_seconds INTEGER,
      station_capacity INTEGER,
      exercise_type VARCHAR DEFAULT 'drill',
      difficulty VARCHAR DEFAULT 'beginner',
      impact_level VARCHAR DEFAULT 'low',
      coordination_complexity VARCHAR DEFAULT 'simple'
    );
    CREATE TABLE exercise_translations (
      exercise_id VARCHAR,
      locale VARCHAR,
      name VARCHAR,
      summary VARCHAR
    );
    CREATE TABLE exercise_body_regions (exercise_id VARCHAR, body_region_id VARCHAR);
    CREATE TABLE exercise_movement_patterns (exercise_id VARCHAR, movement_pattern_id VARCHAR);
    CREATE TABLE equipment (
      id VARCHAR PRIMARY KEY,
      name_de VARCHAR,
      name_en VARCHAR,
      quantity_available INTEGER,
      archived BOOLEAN DEFAULT false
    );
    CREATE TABLE exercise_equipment (exercise_id VARCHAR, equipment_id VARCHAR, quantity_required INTEGER);
    CREATE TABLE exercise_outdoor_variant_equipment (exercise_id VARCHAR, equipment_id VARCHAR, quantity_required INTEGER);
    CREATE TABLE exercise_tags (exercise_id VARCHAR, tag_id VARCHAR);
    CREATE TABLE exercise_training_goals (exercise_id VARCHAR, goal VARCHAR);
    CREATE TABLE exercise_details (
      exercise_id VARCHAR,
      locale VARCHAR,
      purpose VARCHAR,
      setup VARCHAR,
      start_position VARCHAR,
      finish_reset VARCHAR,
      breathing_cue VARCHAR,
      tempo_cue VARCHAR,
      safety_notes VARCHAR,
      quality_criteria VARCHAR,
      beginner_prescription VARCHAR,
      standard_prescription VARCHAR,
      advanced_prescription VARCHAR,
      work_rest_guidance VARCHAR,
      level_1 VARCHAR,
      level_2 VARCHAR,
      level_3 VARCHAR,
      child_youth_variant VARCHAR,
      outdoor_variant VARCHAR,
      prerequisites VARCHAR,
      fallback_exercise VARCHAR,
      station_capacity INTEGER,
      setup_seconds INTEGER,
      transition_seconds INTEGER
    );
    CREATE TABLE exercise_execution_steps (
      exercise_id VARCHAR,
      locale VARCHAR,
      step_order INTEGER,
      instruction VARCHAR
    );
    CREATE TABLE exercise_coaching_cues (
      exercise_id VARCHAR,
      locale VARCHAR,
      cue_order INTEGER,
      cue VARCHAR
    );
    CREATE TABLE exercise_common_mistakes (
      exercise_id VARCHAR,
      locale VARCHAR,
      mistake_order INTEGER,
      mistake VARCHAR,
      correction VARCHAR
    );

    INSERT INTO exercises (
      id, category, default_phase, risk_level, min_age, archived,
      suitable_for_kids, suitable_for_youth, suitable_for_adults,
      indoor_suitable, outdoor_suitable, default_duration_seconds, station_capacity
    ) VALUES
      ('kids-carry','carry-lift','main','low',8,false,true,true,true,true,true,240,4),
      ('adult-wall','ocr-skill','main','high',16,false,false,true,true,false,true,300,1),
      ('archived','strength','main','low',NULL,true,true,true,true,true,true,180,4);
    INSERT INTO exercise_translations VALUES
      ('kids-carry','de','Kinder Carry','Kontrolliertes Tragen für Rumpf und Griff.'),
      ('kids-carry','en','Kids Carry','Controlled carrying for trunk and grip.'),
      ('adult-wall','de','Hohe Wand','Technische Wandüberwindung.'),
      ('adult-wall','en','High Wall','Technical wall traversal.'),
      ('archived','de','Archiviert','Nicht aktiv.'),
      ('archived','en','Archived','Inactive.');
    INSERT INTO exercise_body_regions VALUES ('kids-carry','core'),('kids-carry','forearms-grip');
    INSERT INTO exercise_movement_patterns VALUES ('kids-carry','carry'),('kids-carry','locomotion');
    INSERT INTO equipment VALUES
      ('bag','Sandsack','Sandbag',8,false),
      ('unknown-stock','Hütchen','Cones',NULL,false),
      ('archived-equipment','Altgerät','Old Equipment',12,true);
    INSERT INTO exercise_equipment VALUES ('kids-carry','bag',2);
    INSERT INTO exercise_tags VALUES ('kids-carry','carry'),('kids-carry','teamwork');
    INSERT INTO exercise_details (
      exercise_id, locale, purpose, setup, start_position, finish_reset,
      breathing_cue, tempo_cue, safety_notes, quality_criteria,
      beginner_prescription, standard_prescription, advanced_prescription,
      work_rest_guidance, level_1, level_2, level_3, child_youth_variant,
      prerequisites, fallback_exercise, station_capacity, setup_seconds, transition_seconds
    ) VALUES
      ('kids-carry','de','Sicheres Tragen lernen.','Sandsack bereitstellen.','Aufrecht neben dem Sandsack.','Kontrolliert absetzen.','Ruhig weiteratmen.','Gleichmäßige Schritte.','Bei Kontrollverlust abbrechen.','Aufrecht und kontrolliert.','20 Meter leicht.','30 Meter Standard.','40 Meter anspruchsvoll.','Arbeit mit vollständiger Erholung.','Leicht tragen.','Standard tragen.','Weiter tragen.','Kurze Strecke und leichter Sandsack.','Sicheres Aufnehmen.','Bodyweight March.',4,90,30),
      ('kids-carry','en','Learn safe carrying.','Prepare the sandbag.','Stand tall beside the sandbag.','Set it down under control.','Keep breathing calmly.','Use even steps.','Stop if control is lost.','Tall and controlled.','20 metres light.','30 metres standard.','40 metres advanced.','Work with full recovery.','Light carry.','Standard carry.','Longer carry.','Short route with a light sandbag.','Safe pickup.','Bodyweight march.',4,90,30);
    INSERT INTO exercise_execution_steps VALUES
      ('kids-carry','de',1,'Sandsack aufnehmen.'),('kids-carry','de',2,'Kontrolliert gehen.'),
      ('kids-carry','en',1,'Pick up the sandbag.'),('kids-carry','en',2,'Walk under control.');
    INSERT INTO exercise_coaching_cues VALUES
      ('kids-carry','de',1,'Brust stolz und Schritte ruhig.'),
      ('kids-carry','en',1,'Keep the chest tall and steps calm.');
    INSERT INTO exercise_common_mistakes VALUES
      ('kids-carry','de',1,'Sandsack vom Körper weg tragen.','Last näher am Körper halten.'),
      ('kids-carry','en',1,'Carry the sandbag away from the body.','Keep the load closer to the body.');
  `);

  return connection;
}

describe("training draft candidate query", () => {
  it("lists translated available equipment and keeps unknown stock distinct", async () => {
    const connection = await createFixture();
    try {
      await expect(runTrainingEquipmentOptionsQuery(connection, "de")).resolves.toEqual([
        { id: "unknown-stock", name: "Hütchen", quantityAvailable: null },
        { id: "bag", name: "Sandsack", quantityAvailable: 8 },
      ]);
      await expect(runTrainingEquipmentOptionsQuery(connection, "en")).resolves.toEqual([
        { id: "unknown-stock", name: "Cones", quantityAvailable: null },
        { id: "bag", name: "Sandbag", quantityAvailable: 8 },
      ]);
    } finally {
      connection.closeSync();
    }
  });

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
      expect(results[0]?.movementPatterns).toEqual(["carry", "locomotion"]);
    } finally {
      connection.closeSync();
    }
  });

  it("filters candidates by indoor/outdoor suitability", async () => {
    const connection = await createFixture();
    try {
      const indoor = await runTrainingDraftCandidateQuery(connection, {
        audience: "mixed",
        minAge: 16,
        locale: "de",
        location: "indoor",
      });
      const outdoor = await runTrainingDraftCandidateQuery(connection, {
        audience: "mixed",
        minAge: 16,
        locale: "de",
        location: "outdoor",
      });
      expect(indoor.map((item) => item.id)).toEqual(["kids-carry"]);
      expect(outdoor.map((item) => item.id)).toEqual(["adult-wall", "kids-carry"]);
    } finally {
      connection.closeSync();
    }
  });

  it("hydrates localized equipment and full structured planning context", async () => {
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
      expect(carry?.equipmentRequirements).toEqual([
        { equipmentId: "bag", name: "Sandbag", quantityPerStation: 2 },
      ]);
      expect(carry?.instructions).toContain("Learn safe carrying.");
      expect(carry?.instructions).toContain("Pick up the sandbag.");
      expect(carry?.planningText).toContain("Controlled carrying for trunk and grip.");
      expect(carry?.planningText).toContain("Keep the chest tall and steps calm.");
      expect(carry?.planningText).toContain("Keep the load closer to the body.");
      expect(carry?.planningText).toContain("Stop if control is lost.");
      expect(carry?.level2).toBe("Standard carry.");
      expect(carry?.stationCapacity).toBe(4);
      expect(carry?.setupSeconds).toBe(90);
      expect(carry?.transitionSeconds).toBe(30);
      expect(results.find((item) => item.id === "adult-wall")?.stationCapacity).toBe(1);
      expect(results.some((item) => item.id === "archived")).toBe(false);
    } finally {
      connection.closeSync();
    }
  });
});
