import { DuckDBInstance } from "@duckdb/node-api";
import { describe, expect, it } from "vitest";
import { setTrainingItemLevelCore } from "./training-item-level-core";

const SESSION_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_SESSION_ID = "22222222-2222-4222-8222-222222222222";
const PHASE_ID = "33333333-3333-4333-8333-333333333333";
const OTHER_PHASE_ID = "44444444-4444-4444-8444-444444444444";
const ITEM_ID = "55555555-5555-4555-8555-555555555555";

async function createFixture() {
  const instance = await DuckDBInstance.create(":memory:");
  const connection = await instance.connect();
  await connection.run(`
    CREATE TABLE training_sessions (
      id UUID PRIMARY KEY,
      status VARCHAR NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
    );
    CREATE TABLE training_phases (
      id UUID PRIMARY KEY,
      training_session_id UUID NOT NULL
    );
    CREATE TABLE training_items (
      id UUID PRIMARY KEY,
      training_phase_id UUID NOT NULL,
      level_label VARCHAR
    );

    INSERT INTO training_sessions VALUES
      ('${SESSION_ID}','ready',current_timestamp),
      ('${OTHER_SESSION_ID}','ready',current_timestamp);
    INSERT INTO training_phases VALUES
      ('${PHASE_ID}','${SESSION_ID}'),
      ('${OTHER_PHASE_ID}','${OTHER_SESSION_ID}');
    INSERT INTO training_items VALUES
      ('${ITEM_ID}','${PHASE_ID}',NULL);
  `);
  return connection;
}

describe("setTrainingItemLevelCore", () => {
  it("stores Level 1/2/3 and returns the session to draft", async () => {
    const connection = await createFixture();
    try {
      expect(await setTrainingItemLevelCore(connection, SESSION_ID, ITEM_ID, "Level 2")).toBe(true);

      const itemReader = await connection.runAndReadAll(
        "SELECT level_label FROM training_items WHERE id=$id::UUID",
        { id: ITEM_ID },
      );
      expect(itemReader.getRows()[0]?.[0]).toBe("Level 2");

      const sessionReader = await connection.runAndReadAll(
        "SELECT status FROM training_sessions WHERE id=$id::UUID",
        { id: SESSION_ID },
      );
      expect(sessionReader.getRows()[0]?.[0]).toBe("draft");
    } finally {
      connection.closeSync();
    }
  });

  it("clears the structured level without touching another session", async () => {
    const connection = await createFixture();
    try {
      await setTrainingItemLevelCore(connection, SESSION_ID, ITEM_ID, "Level 3");
      expect(await setTrainingItemLevelCore(connection, SESSION_ID, ITEM_ID, "")).toBe(true);

      const itemReader = await connection.runAndReadAll(
        "SELECT level_label FROM training_items WHERE id=$id::UUID",
        { id: ITEM_ID },
      );
      expect(itemReader.getRows()[0]?.[0]).toBeNull();

      const otherReader = await connection.runAndReadAll(
        "SELECT status FROM training_sessions WHERE id=$id::UUID",
        { id: OTHER_SESSION_ID },
      );
      expect(otherReader.getRows()[0]?.[0]).toBe("ready");
    } finally {
      connection.closeSync();
    }
  });

  it("does not mutate an item through the wrong session", async () => {
    const connection = await createFixture();
    try {
      expect(await setTrainingItemLevelCore(connection, OTHER_SESSION_ID, ITEM_ID, "Level 1")).toBe(false);
    } finally {
      connection.closeSync();
    }
  });
});
