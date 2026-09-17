import { DuckDBInstance } from "@duckdb/node-api";
import { describe, expect, it } from "vitest";
import { listTrainingItemAlternativesCore } from "./training-item-alternative-core";

const SESSION = "11111111-1111-4111-8111-111111111111";
const PHASE = "22222222-2222-4222-8222-222222222222";
const ITEM = "33333333-3333-4333-8333-333333333333";
const CURRENT = "44444444-4444-4444-8444-444444444444";
const EASY = "55555555-5555-4555-8555-555555555555";
const HARD = "66666666-6666-4666-8666-666666666666";
const NO_EQUIPMENT = "77777777-7777-4777-8777-777777777777";
const UNRELATED = "88888888-8888-4888-8888-888888888888";
const EQUIPMENT = "99999999-9999-4999-8999-999999999999";

async function createFixture() {
  const instance = await DuckDBInstance.create(":memory:");
  const connection = await instance.connect();
  await connection.run(`
    CREATE TABLE training_sessions (id UUID PRIMARY KEY, locale VARCHAR NOT NULL);
    CREATE TABLE training_phases (id UUID PRIMARY KEY, training_session_id UUID NOT NULL);
    CREATE TABLE training_items (id UUID PRIMARY KEY, training_phase_id UUID NOT NULL, exercise_id UUID);
    CREATE TABLE exercises (
      id UUID PRIMARY KEY,
      category VARCHAR,
      difficulty VARCHAR,
      risk_level VARCHAR NOT NULL,
      archived BOOLEAN NOT NULL DEFAULT false
    );
    CREATE TABLE exercise_translations (exercise_id UUID, locale VARCHAR, name VARCHAR);
    CREATE TABLE exercise_movement_patterns (exercise_id UUID, movement_pattern_id VARCHAR);
    CREATE TABLE exercise_body_regions (exercise_id UUID, body_region_id VARCHAR);
    CREATE TABLE equipment (id UUID PRIMARY KEY, name_de VARCHAR, name_en VARCHAR);
    CREATE TABLE exercise_equipment (exercise_id UUID, equipment_id UUID, quantity_required INTEGER);

    INSERT INTO training_sessions VALUES ('${SESSION}','de');
    INSERT INTO training_phases VALUES ('${PHASE}','${SESSION}');
    INSERT INTO training_items VALUES ('${ITEM}','${PHASE}','${CURRENT}');

    INSERT INTO exercises VALUES
      ('${CURRENT}','grip-rig','intermediate','medium',false),
      ('${EASY}','grip-rig','beginner','low',false),
      ('${HARD}','grip-rig','advanced','high',false),
      ('${NO_EQUIPMENT}','grip-rig','intermediate','low',false),
      ('${UNRELATED}','mobility','beginner','low',false);

    INSERT INTO exercise_translations VALUES
      ('${CURRENT}','de','Monkey Bars'),
      ('${EASY}','de','Dead Hang'),
      ('${HARD}','de','Lache Traverse'),
      ('${NO_EQUIPMENT}','de','Bodennahe Griffsimulation'),
      ('${UNRELATED}','de','Hüftmobilität');

    INSERT INTO exercise_movement_patterns VALUES
      ('${CURRENT}','hang'),('${EASY}','hang'),('${HARD}','hang'),('${NO_EQUIPMENT}','hang'),('${UNRELATED}','mobility');
    INSERT INTO exercise_body_regions VALUES
      ('${CURRENT}','forearms-grip'),('${EASY}','forearms-grip'),('${HARD}','forearms-grip'),('${NO_EQUIPMENT}','forearms-grip'),('${UNRELATED}','hips');

    INSERT INTO equipment VALUES ('${EQUIPMENT}','Rig','Rig');
    INSERT INTO exercise_equipment VALUES
      ('${CURRENT}','${EQUIPMENT}',1),
      ('${EASY}','${EQUIPMENT}',1),
      ('${HARD}','${EQUIPMENT}',1);
  `);
  return connection;
}

describe("listTrainingItemAlternativesCore", () => {
  it("prioritizes a related easier exercise", async () => {
    const connection = await createFixture();
    try {
      const alternatives = await listTrainingItemAlternativesCore(connection, SESSION, ITEM, "easier");
      expect(alternatives[0]?.exerciseId).toBe(EASY);
      expect(alternatives[0]?.reason).toContain("niedrigere Schwierigkeitsstufe");
      expect(alternatives[0]?.movementOverlap).toBe(1);
    } finally {
      connection.closeSync();
    }
  });

  it("prioritizes a related harder exercise", async () => {
    const connection = await createFixture();
    try {
      const alternatives = await listTrainingItemAlternativesCore(connection, SESSION, ITEM, "harder");
      expect(alternatives[0]?.exerciseId).toBe(HARD);
      expect(alternatives[0]?.reason).toContain("höhere Schwierigkeitsstufe");
    } finally {
      connection.closeSync();
    }
  });

  it("prioritizes a related no-equipment exercise", async () => {
    const connection = await createFixture();
    try {
      const alternatives = await listTrainingItemAlternativesCore(connection, SESSION, ITEM, "equipment");
      expect(alternatives[0]?.exerciseId).toBe(NO_EQUIPMENT);
      expect(alternatives[0]?.equipment).toEqual([]);
      expect(alternatives[0]?.reason).toContain("ohne Equipment");
    } finally {
      connection.closeSync();
    }
  });

  it("returns no alternatives for an item outside the session", async () => {
    const connection = await createFixture();
    try {
      expect(await listTrainingItemAlternativesCore(
        connection,
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        ITEM,
        "easier",
      )).toEqual([]);
    } finally {
      connection.closeSync();
    }
  });
});
