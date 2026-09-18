import { DuckDBInstance } from "@duckdb/node-api";
import { describe, expect, it } from "vitest";
import { runExerciseLibraryPersonalizationQuery } from "./exercise-personalization-core";

describe("exercise library personalization", () => {
  it("returns user-specific favorites and recent training use", async () => {
    const instance = await DuckDBInstance.create(":memory:");
    const connection = await instance.connect();
    try {
      await connection.run(`
        CREATE TABLE exercises (id UUID PRIMARY KEY,archived BOOLEAN);
        CREATE TABLE user_exercise_favorites (user_id UUID,exercise_id UUID,created_at TIMESTAMP);
        CREATE TABLE training_sessions (
          id UUID PRIMARY KEY,status VARCHAR,created_by UUID,created_at TIMESTAMP,updated_at TIMESTAMP
        );
        CREATE TABLE training_phases (id UUID PRIMARY KEY,training_session_id UUID);
        CREATE TABLE training_items (id UUID PRIMARY KEY,training_phase_id UUID,exercise_id UUID);

        INSERT INTO exercises VALUES
          ('00000000-0000-4000-8000-000000000001',false),
          ('00000000-0000-4000-8000-000000000002',false),
          ('00000000-0000-4000-8000-000000000003',true);
        INSERT INTO user_exercise_favorites VALUES
          ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','2026-09-01'),
          ('20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','2026-09-02'),
          ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000003','2026-09-03');

        INSERT INTO training_sessions VALUES
          ('30000000-0000-4000-8000-000000000001','completed','10000000-0000-4000-8000-000000000001','2026-09-05','2026-09-05'),
          ('30000000-0000-4000-8000-000000000002','ready','10000000-0000-4000-8000-000000000001','2026-09-06','2026-09-06'),
          ('30000000-0000-4000-8000-000000000003','completed','20000000-0000-4000-8000-000000000001','2026-09-07','2026-09-07');
        INSERT INTO training_phases VALUES
          ('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001'),
          ('40000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000002'),
          ('40000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000003');
        INSERT INTO training_items VALUES
          ('50000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001'),
          ('50000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000002'),
          ('50000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000001');
      `);

      const result = await runExerciseLibraryPersonalizationQuery(
        connection,
        "10000000-0000-4000-8000-000000000001",
      );
      expect(result.favoriteExerciseIds).toEqual(["00000000-0000-4000-8000-000000000001"]);
      expect(result.recentExercises.map((item) => item.exerciseId)).toEqual([
        "00000000-0000-4000-8000-000000000002",
        "00000000-0000-4000-8000-000000000001",
      ]);
    } finally {
      connection.closeSync();
      instance.closeSync();
    }
  });
});
