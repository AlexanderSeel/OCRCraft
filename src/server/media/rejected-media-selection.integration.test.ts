import { DuckDBInstance, type DuckDBConnection } from "@duckdb/node-api";
import { expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({ connection: null as DuckDBConnection | null }));
vi.mock("server-only", () => ({}));
vi.mock("@/server/db/database-ready", () => ({ ensureDatabaseReady: async () => undefined }));
vi.mock("@/server/db/duckdb", () => ({
  withDuckDbConnection: async (operation: (connection: DuckDBConnection) => Promise<unknown>) => {
    if (!database.connection) throw new Error("Test database not set");
    return operation(database.connection);
  },
}));
import { listExerciseMediaChoices, setPrimaryExerciseMedia } from "./media-catalog-repository";

it("excludes rejected history from exercise choices and rejects direct primary-selection requests", async () => {
  const instance = await DuckDBInstance.create(":memory:");
  const connection = await instance.connect();
  database.connection = connection;
  const exerciseId = "2a7325a5-c89b-4cad-997f-d6a88d550265";
  const rejectedId = "35b80ab9-27a4-444d-96e4-0e3297957426";
  const pendingId = "6f42f47b-3442-49eb-a6f3-5bc4fb374d18";
  try {
    await connection.run(`CREATE TABLE exercise_media_assets(id UUID PRIMARY KEY,exercise_id UUID,storage_uri VARCHAR,media_type VARCHAR,
      source_type VARCHAR,review_status VARCHAR,generation_status VARCHAR,is_primary BOOLEAN,created_at TIMESTAMP);
      CREATE TABLE exercise_image_generation_jobs(asset_id UUID REFERENCES exercise_media_assets(id));`);
    for (const [id, status] of [[rejectedId, "rejected"], [pendingId, "pending"]]) {
      await connection.run("INSERT INTO exercise_media_assets VALUES ($id::UUID,$exerciseId::UUID,'/generated/exercises/shared.png','illustration','ai_generated',$status,'generated',false,current_timestamp)", { id, exerciseId, status });
    }
    await connection.run("INSERT INTO exercise_image_generation_jobs VALUES ($id::UUID)", { id: rejectedId });
    expect((await listExerciseMediaChoices(exerciseId)).map((choice) => choice.id)).toEqual([pendingId]);
    expect(await setPrimaryExerciseMedia(exerciseId, rejectedId)).toBe(false);
    expect((await connection.runAndReadAll("SELECT asset_id::VARCHAR FROM exercise_image_generation_jobs")).getRows()).toEqual([[rejectedId]]);
    expect((await connection.runAndReadAll("SELECT count(*) FROM exercise_media_assets WHERE is_primary")).getRows()[0][0]).toBe(0n);
  } finally {
    database.connection = null;
    connection.closeSync();
    instance.closeSync();
  }
});
