import { DuckDBInstance } from "@duckdb/node-api";
import { describe, expect, it } from "vitest";
import { replaceExerciseClassification } from "./exercise-classification-core";

const EXERCISE_ID = "11111111-1111-4111-8111-111111111111";

async function createFixture() {
  const instance = await DuckDBInstance.create(":memory:");
  const connection = await instance.connect();
  await connection.run(`
    CREATE TABLE exercises (
      id UUID PRIMARY KEY,
      exercise_type VARCHAR,
      difficulty VARCHAR,
      impact_level VARCHAR,
      coordination_complexity VARCHAR,
      progression_required BOOLEAN,
      laterality VARCHAR,
      movement_plane VARCHAR,
      suitable_for_kids BOOLEAN,
      suitable_for_youth BOOLEAN,
      suitable_for_adults BOOLEAN,
      indoor_suitable BOOLEAN,
      outdoor_suitable BOOLEAN,
      supports_reps BOOLEAN,
      supports_seconds BOOLEAN,
      supports_minutes BOOLEAN,
      supports_metres BOOLEAN,
      supports_rounds BOOLEAN,
      supports_attempts BOOLEAN,
      updated_at TIMESTAMP
    );
    CREATE TABLE exercise_training_goals (
      exercise_id UUID,
      goal VARCHAR,
      PRIMARY KEY (exercise_id, goal)
    );
    INSERT INTO exercises VALUES (
      '${EXERCISE_ID}','drill','beginner','low','simple',false,'bilateral','sagittal',
      true,true,true,true,true,true,true,false,false,true,false,current_timestamp
    );
    INSERT INTO exercise_training_goals VALUES ('${EXERCISE_ID}','strength');
  `);
  return connection;
}

describe("exercise classification persistence", () => {
  it("replaces classification, suitability, prescription support and goals", async () => {
    const connection = await createFixture();
    try {
      const saved = await replaceExerciseClassification(connection, EXERCISE_ID, {
        exerciseType: "obstacle",
        difficulty: "advanced",
        impactLevel: "moderate",
        coordinationComplexity: "complex",
        progressionRequired: true,
        laterality: "alternating",
        movementPlane: "multiplanar",
        suitableForKids: false,
        suitableForYouth: true,
        suitableForAdults: true,
        indoorSuitable: true,
        outdoorSuitable: true,
        supportsReps: false,
        supportsSeconds: true,
        supportsMinutes: false,
        supportsMetres: false,
        supportsRounds: false,
        supportsAttempts: true,
        trainingGoals: ["ocr_technique", "grip", "ocr_technique"],
      });
      expect(saved).toBe(true);
      expect((await connection.runAndReadAll(`
        SELECT exercise_type,difficulty,impact_level,coordination_complexity,
          progression_required,laterality,movement_plane,suitable_for_kids,
          supports_reps,supports_attempts
        FROM exercises WHERE id='${EXERCISE_ID}'
      `)).getRows()).toEqual([[
        "obstacle", "advanced", "moderate", "complex", true, "alternating", "multiplanar", false, false, true,
      ]]);
      expect((await connection.runAndReadAll(`
        SELECT goal FROM exercise_training_goals WHERE exercise_id='${EXERCISE_ID}' ORDER BY goal
      `)).getRows()).toEqual([["grip"], ["ocr_technique"]]);
    } finally {
      connection.closeSync();
    }
  });

  it("returns false for an unknown exercise without creating goals", async () => {
    const connection = await createFixture();
    try {
      const saved = await replaceExerciseClassification(connection, "22222222-2222-4222-8222-222222222222", {
        exerciseType: "drill",
        difficulty: "beginner",
        impactLevel: "low",
        coordinationComplexity: "simple",
        progressionRequired: false,
        laterality: "bilateral",
        movementPlane: "sagittal",
        suitableForKids: true,
        suitableForYouth: true,
        suitableForAdults: true,
        indoorSuitable: true,
        outdoorSuitable: true,
        supportsReps: true,
        supportsSeconds: true,
        supportsMinutes: false,
        supportsMetres: false,
        supportsRounds: true,
        supportsAttempts: false,
        trainingGoals: ["coordination"],
      });
      expect(saved).toBe(false);
      expect((await connection.runAndReadAll("SELECT count(*)::INTEGER FROM exercise_training_goals")).getRows()).toEqual([[1]]);
    } finally {
      connection.closeSync();
    }
  });
});
