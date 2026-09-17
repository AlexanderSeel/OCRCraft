import { DuckDBInstance } from "@duckdb/node-api";
import { describe, expect, it } from "vitest";
import { runRecentExerciseUseQuery } from "./recent-training-use-core";

describe("recent training exercise usage", () => {
  it("counts only the latest active sessions and ignores archived or older sessions", async () => {
    const instance = await DuckDBInstance.create(":memory:");
    const connection = await instance.connect();
    try {
      await connection.run(`
        CREATE TABLE training_sessions (
          id VARCHAR PRIMARY KEY,
          status VARCHAR,
          created_at TIMESTAMP,
          updated_at TIMESTAMP
        );
        CREATE TABLE training_phases (
          id VARCHAR PRIMARY KEY,
          training_session_id VARCHAR
        );
        CREATE TABLE training_items (
          id VARCHAR PRIMARY KEY,
          training_phase_id VARCHAR,
          exercise_id VARCHAR
        );

        INSERT INTO training_sessions VALUES
          ('s1','completed','2026-09-01','2026-09-01'),
          ('s2','completed','2026-09-02','2026-09-02'),
          ('s3','ready','2026-09-03','2026-09-03'),
          ('s4','completed','2026-09-04','2026-09-04'),
          ('s5','draft','2026-09-05','2026-09-05'),
          ('s6','completed','2026-09-06','2026-09-06'),
          ('s7','completed','2026-09-07','2026-09-07'),
          ('s8','archived','2026-09-08','2026-09-08');

        INSERT INTO training_phases VALUES
          ('p1','s1'),('p2','s2'),('p3','s3'),('p4','s4'),
          ('p5','s5'),('p6','s6'),('p7','s7'),('p8','s8');

        INSERT INTO training_items VALUES
          ('i1','p1','old-only'),
          ('i2','p2','hot'),('i3','p3','hot'),('i4','p4','hot'),
          ('i5','p5','hot'),('i6','p6','hot'),('i7','p7','hot'),
          ('i8','p6','mid'),('i9','p7','mid'),
          ('i10','p8','archived-only');
      `);

      await expect(runRecentExerciseUseQuery(connection)).resolves.toEqual([
        { exerciseId: "hot", useCount: 6 },
        { exerciseId: "mid", useCount: 2 },
      ]);
    } finally {
      connection.closeSync();
      instance.closeSync();
    }
  });
});
