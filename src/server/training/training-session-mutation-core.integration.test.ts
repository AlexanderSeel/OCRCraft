import { DuckDBInstance } from "@duckdb/node-api";
import { describe, expect, it } from "vitest";
import {
  addTrainingItemCore,
  deleteTrainingItemCore,
  moveTrainingItemCore,
  replaceTrainingItemExerciseCore,
  updateTrainingItemCore,
} from "./training-session-mutation-core";

const SESSION_ID = "11111111-1111-4111-8111-111111111111";
const PHASE_ID = "22222222-2222-4222-8222-222222222222";
const EXERCISE_A = "33333333-3333-4333-8333-333333333333";
const EXERCISE_B = "44444444-4444-4444-8444-444444444444";
const ITEM_A = "55555555-5555-4555-8555-555555555555";
const ITEM_B = "66666666-6666-4666-8666-666666666666";

async function createFixture() {
  const instance = await DuckDBInstance.create(":memory:");
  const connection = await instance.connect();
  await connection.run(`
    CREATE TABLE exercises (
      id UUID PRIMARY KEY,
      archived BOOLEAN NOT NULL DEFAULT false
    );
    CREATE TABLE training_sessions (
      id UUID PRIMARY KEY,
      title VARCHAR NOT NULL,
      status VARCHAR NOT NULL,
      total_duration_minutes INTEGER NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
    );
    CREATE TABLE training_phases (
      id UUID PRIMARY KEY,
      training_session_id UUID NOT NULL,
      kind VARCHAR NOT NULL,
      title VARCHAR NOT NULL,
      sort_order INTEGER NOT NULL
    );
    CREATE TABLE training_items (
      id UUID PRIMARY KEY,
      training_phase_id UUID NOT NULL,
      exercise_id UUID,
      title_override VARCHAR,
      format VARCHAR,
      duration_minutes INTEGER NOT NULL,
      instructions VARCHAR,
      level_label VARCHAR,
      sort_order INTEGER NOT NULL,
      main_part_index INTEGER,
      main_part_title VARCHAR
    );

    INSERT INTO exercises VALUES
      ('${EXERCISE_A}', false),
      ('${EXERCISE_B}', false);
    INSERT INTO training_sessions (id,title,status,total_duration_minutes)
      VALUES ('${SESSION_ID}','Test','ready',0);
    INSERT INTO training_phases VALUES
      ('${PHASE_ID}','${SESSION_ID}','main','Hauptteil',0);
  `);
  return connection;
}

async function sessionState(connection: Awaited<ReturnType<typeof createFixture>>) {
  const reader = await connection.runAndReadAll(
    "SELECT status,total_duration_minutes FROM training_sessions WHERE id=$id::UUID",
    { id: SESSION_ID },
  );
  return reader.getRows()[0];
}

describe("persisted training item mutations", () => {
  it("adds, edits and deletes items while recalculating duration and reopening the draft", async () => {
    const connection = await createFixture();
    try {
      expect(await addTrainingItemCore(connection, {
        itemId: ITEM_A,
        sessionId: SESSION_ID,
        phaseId: PHASE_ID,
        exerciseId: EXERCISE_A,
        durationMinutes: 8,
        format: "circuit",
        instructions: "Sauber arbeiten.",
        levelLabel: "Level 2",
      })).toBe(true);
      expect(await sessionState(connection)).toEqual(["draft", 8]);

      expect(await updateTrainingItemCore(connection, {
        sessionId: SESSION_ID,
        itemId: ITEM_A,
        durationMinutes: 12,
        format: "technique",
        instructions: "Technik vor Tempo.",
        levelLabel: "Standard",
      })).toBe(true);
      expect(await sessionState(connection)).toEqual(["draft", 12]);

      expect(await deleteTrainingItemCore(connection, SESSION_ID, ITEM_A)).toBe(true);
      expect(await sessionState(connection)).toEqual(["draft", 0]);
    } finally {
      connection.closeSync();
    }
  });

  it("keeps phase ordering stable when moving items", async () => {
    const connection = await createFixture();
    try {
      await addTrainingItemCore(connection, {
        itemId: ITEM_A,
        sessionId: SESSION_ID,
        phaseId: PHASE_ID,
        exerciseId: EXERCISE_A,
        durationMinutes: 5,
        format: null,
        instructions: null,
        levelLabel: null,
      });
      await addTrainingItemCore(connection, {
        itemId: ITEM_B,
        sessionId: SESSION_ID,
        phaseId: PHASE_ID,
        exerciseId: EXERCISE_B,
        durationMinutes: 7,
        format: null,
        instructions: null,
        levelLabel: null,
      });

      expect(await moveTrainingItemCore(connection, SESSION_ID, ITEM_B, "up")).toBe(true);
      const reader = await connection.runAndReadAll(
        "SELECT id::VARCHAR FROM training_items WHERE training_phase_id=$phaseId::UUID ORDER BY sort_order",
        { phaseId: PHASE_ID },
      );
      expect(reader.getRows().map((row) => String(row[0]))).toEqual([ITEM_B, ITEM_A]);
      expect(await sessionState(connection)).toEqual(["draft", 12]);
      expect(await moveTrainingItemCore(connection, SESSION_ID, ITEM_B, "up")).toBe(false);
    } finally {
      connection.closeSync();
    }
  });

  it("replaces an exercise without changing the programmed duration", async () => {
    const connection = await createFixture();
    try {
      await addTrainingItemCore(connection, {
        itemId: ITEM_A,
        sessionId: SESSION_ID,
        phaseId: PHASE_ID,
        exerciseId: EXERCISE_A,
        durationMinutes: 9,
        format: "technique",
        instructions: "Hinweis bleibt bestehen.",
        levelLabel: "Level 1",
      });

      expect(await replaceTrainingItemExerciseCore(
        connection,
        SESSION_ID,
        ITEM_A,
        EXERCISE_B,
      )).toBe(true);

      const reader = await connection.runAndReadAll(
        "SELECT exercise_id::VARCHAR,duration_minutes,instructions,level_label FROM training_items WHERE id=$id::UUID",
        { id: ITEM_A },
      );
      expect(reader.getRows()[0]).toEqual([
        EXERCISE_B,
        9,
        "Hinweis bleibt bestehen.",
        "Level 1",
      ]);
      expect(await sessionState(connection)).toEqual(["draft", 9]);
    } finally {
      connection.closeSync();
    }
  });
});
