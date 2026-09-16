import { DuckDBInstance } from "@duckdb/node-api";
import { describe, expect, it } from "vitest";
import { reorderTrainingItemsCore } from "./training-item-reorder-core";

const SESSION_ID = "11111111-1111-4111-8111-111111111111";
const PHASE_ID = "22222222-2222-4222-8222-222222222222";
const ITEM_A = "33333333-3333-4333-8333-333333333333";
const ITEM_B = "44444444-4444-4444-8444-444444444444";
const ITEM_C = "55555555-5555-4555-8555-555555555555";

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
      training_session_id UUID NOT NULL,
      kind VARCHAR NOT NULL,
      title VARCHAR NOT NULL,
      sort_order INTEGER NOT NULL
    );
    CREATE TABLE training_items (
      id UUID PRIMARY KEY,
      training_phase_id UUID NOT NULL,
      sort_order INTEGER NOT NULL
    );

    INSERT INTO training_sessions (id,status) VALUES ('${SESSION_ID}','ready');
    INSERT INTO training_phases VALUES ('${PHASE_ID}','${SESSION_ID}','main','Hauptteil',0);
    INSERT INTO training_items VALUES
      ('${ITEM_A}','${PHASE_ID}',0),
      ('${ITEM_B}','${PHASE_ID}',1),
      ('${ITEM_C}','${PHASE_ID}',2);
  `);
  return connection;
}

describe("drag-drop training item reorder", () => {
  it("persists the complete requested order and reopens the session as draft", async () => {
    const connection = await createFixture();
    try {
      expect(await reorderTrainingItemsCore(
        connection,
        SESSION_ID,
        PHASE_ID,
        [ITEM_C, ITEM_A, ITEM_B],
      )).toBe(true);

      const itemReader = await connection.runAndReadAll(
        "SELECT id::VARCHAR FROM training_items WHERE training_phase_id=$phaseId::UUID ORDER BY sort_order",
        { phaseId: PHASE_ID },
      );
      expect(itemReader.getRows().map((row) => String(row[0]))).toEqual([ITEM_C, ITEM_A, ITEM_B]);

      const sessionReader = await connection.runAndReadAll(
        "SELECT status FROM training_sessions WHERE id=$sessionId::UUID",
        { sessionId: SESSION_ID },
      );
      expect(sessionReader.getRows()[0]?.[0]).toBe("draft");
    } finally {
      connection.closeSync();
    }
  });

  it("rejects partial or foreign item sets instead of silently losing entries", async () => {
    const connection = await createFixture();
    try {
      await expect(reorderTrainingItemsCore(
        connection,
        SESSION_ID,
        PHASE_ID,
        [ITEM_A, ITEM_B],
      )).rejects.toThrow("Reihenfolge");
    } finally {
      connection.closeSync();
    }
  });
});
