import { DuckDBInstance } from "@duckdb/node-api";
import { describe, expect, it } from "vitest";
import { combineTrainingSessionsCore } from "./training-session-combine-core";

const SESSION_A = "11111111-1111-4111-8111-111111111111";
const SESSION_B = "22222222-2222-4222-8222-222222222222";
const TARGET = "33333333-3333-4333-8333-333333333333";
const GROUP = "44444444-4444-4444-8444-444444444444";
const EXERCISE_A = "55555555-5555-4555-8555-555555555555";
const EXERCISE_B = "66666666-6666-4666-8666-666666666666";

async function createFixture() {
  const instance = await DuckDBInstance.create(":memory:");
  const connection = await instance.connect();
  await connection.run(`
    CREATE TABLE training_sessions (
      id UUID PRIMARY KEY,
      title VARCHAR NOT NULL,
      group_id UUID,
      status VARCHAR NOT NULL,
      source VARCHAR NOT NULL,
      total_duration_minutes INTEGER NOT NULL,
      locale VARCHAR NOT NULL,
      notes VARCHAR,
      organization_mode VARCHAR DEFAULT 'solo',
      team_size INTEGER,
      group_split_count INTEGER,
      created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
      updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
    );
    CREATE TABLE training_phases (
      id UUID PRIMARY KEY,
      training_session_id UUID NOT NULL,
      kind VARCHAR NOT NULL,
      title VARCHAR NOT NULL,
      sort_order INTEGER NOT NULL,
      UNIQUE(training_session_id, kind)
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
      main_part_title VARCHAR,
      programming_json VARCHAR
    );

    INSERT INTO training_sessions
      (id,title,group_id,status,source,total_duration_minutes,locale,notes)
    VALUES
      ('${SESSION_A}','Technik Dienstag','${GROUP}','ready','manual',15,'de','A'),
      ('${SESSION_B}','Ausdauer Freitag','${GROUP}','completed','manual',20,'de','B');

    INSERT INTO training_phases VALUES
      ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','${SESSION_A}','warmup','Aufwärmen A',0),
      ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','${SESSION_A}','main','Hauptteil A',1),
      ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','${SESSION_B}','warmup','Aufwärmen B',0),
      ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','${SESSION_B}','main','Hauptteil B',1),
      ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','${SESSION_B}','cooldown','Cooldown B',2);

    INSERT INTO training_items
      (id,training_phase_id,exercise_id,title_override,format,duration_minutes,instructions,level_label,sort_order)
    VALUES
      ('00000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','${EXERCISE_A}',NULL,'free',5,'A warmup',NULL,0),
      ('00000000-0000-4000-8000-000000000002','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','${EXERCISE_A}',NULL,'technique',10,'A main','Level 2',0),
      ('00000000-0000-4000-8000-000000000003','cccccccc-cccc-4ccc-8ccc-cccccccccccc','${EXERCISE_B}',NULL,'free',5,'B warmup',NULL,0),
      ('00000000-0000-4000-8000-000000000004','dddddddd-dddd-4ddd-8ddd-dddddddddddd','${EXERCISE_B}',NULL,'circuit',10,'B main','Level 1',0),
      ('00000000-0000-4000-8000-000000000005','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','${EXERCISE_B}',NULL,'free',5,'B cooldown',NULL,0);
  `);
  return connection;
}

describe("combineTrainingSessionsCore", () => {
  it("creates one draft with merged phase items in source order", async () => {
    const connection = await createFixture();
    try {
      await combineTrainingSessionsCore(connection, {
        targetSessionId: TARGET,
        firstSessionId: SESSION_A,
        secondSessionId: SESSION_B,
        title: "OCR Kombi",
      });

      const sessionReader = await connection.runAndReadAll(
        "SELECT title,group_id::VARCHAR,status,source,total_duration_minutes,locale FROM training_sessions WHERE id=$id::UUID",
        { id: TARGET },
      );
      expect(sessionReader.getRows()[0]).toEqual([
        "OCR Kombi",
        GROUP,
        "draft",
        "combined",
        35,
        "de",
      ]);

      const phaseReader = await connection.runAndReadAll(
        "SELECT kind,title FROM training_phases WHERE training_session_id=$id::UUID ORDER BY sort_order",
        { id: TARGET },
      );
      expect(phaseReader.getRows()).toEqual([
        ["warmup", "Aufwärmen A"],
        ["main", "Hauptteil A"],
        ["cooldown", "Cooldown B"],
      ]);

      const itemReader = await connection.runAndReadAll(
        `
        SELECT p.kind,i.exercise_id::VARCHAR,i.duration_minutes,i.instructions,i.level_label
        FROM training_phases p
        JOIN training_items i ON i.training_phase_id=p.id
        WHERE p.training_session_id=$id::UUID
        ORDER BY p.sort_order,i.sort_order
        `,
        { id: TARGET },
      );
      expect(itemReader.getRows()).toEqual([
        ["warmup", EXERCISE_A, 5, "A warmup", null],
        ["warmup", EXERCISE_B, 5, "B warmup", null],
        ["main", EXERCISE_A, 10, "A main", "Level 2"],
        ["main", EXERCISE_B, 10, "B main", "Level 1"],
        ["cooldown", EXERCISE_B, 5, "B cooldown", null],
      ]);
    } finally {
      connection.closeSync();
    }
  });

  it("drops group linkage when source groups differ", async () => {
    const connection = await createFixture();
    try {
      await connection.run(
        "UPDATE training_sessions SET group_id=NULL WHERE id=$id::UUID",
        { id: SESSION_B },
      );
      await combineTrainingSessionsCore(connection, {
        targetSessionId: TARGET,
        firstSessionId: SESSION_A,
        secondSessionId: SESSION_B,
      });

      const reader = await connection.runAndReadAll(
        "SELECT group_id FROM training_sessions WHERE id=$id::UUID",
        { id: TARGET },
      );
      expect(reader.getRows()[0]?.[0]).toBeNull();
    } finally {
      connection.closeSync();
    }
  });

  it("rejects combining a session with itself", async () => {
    const connection = await createFixture();
    try {
      await expect(combineTrainingSessionsCore(connection, {
        targetSessionId: TARGET,
        firstSessionId: SESSION_A,
        secondSessionId: SESSION_A,
      })).rejects.toThrow("nicht mit sich selbst");
    } finally {
      connection.closeSync();
    }
  });
});
