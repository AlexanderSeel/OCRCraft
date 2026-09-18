import { DuckDBInstance } from "@duckdb/node-api";
import { describe, expect, it } from "vitest";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

async function runScript(connection: Awaited<ReturnType<InstanceType<typeof DuckDBInstance>["connect"]>>, sql: string) {
  const statements = await connection.extractStatements(sql);
  for (let index = 0; index < statements.count; index += 1) {
    const statement = await statements.prepare(index);
    await statement.run();
  }
}

describe("database migrations", () => {
  it("applies the complete migration chain to a fresh DuckDB database", async () => {
    const instance = await DuckDBInstance.create(":memory:");
    const connection = await instance.connect();

    try {
      const files = (await readdir(path.join(process.cwd(), "src", "server", "db", "migrations")))
        .filter((fileName) => /^\d{3}_.*\.sql$/.test(fileName))
        .sort();
      expect(files.length).toBeGreaterThanOrEqual(45);
      for (const fileName of files) {
        await runScript(connection, await readFile(path.join(process.cwd(), "src", "server", "db", "migrations", fileName), "utf8"));
      }

      const versions = await connection.runAndReadAll("SELECT count(*) FROM schema_migrations");
      expect(Number(versions.getRows()[0]?.[0])).toBe(files.length);

      const columns = await connection.runAndReadAll(`
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE (table_name='training_sessions' AND column_name IN ('organization_mode','route_name'))
           OR (table_name='exercise_details' AND column_name IN ('pace_guidance','heart_rate_zone'))
        ORDER BY table_name, column_name
      `);
      expect(columns.getRows()).toEqual([
        ["exercise_details", "heart_rate_zone"],
        ["exercise_details", "pace_guidance"],
        ["training_sessions", "organization_mode"],
        ["training_sessions", "route_name"],
      ]);
    } finally {
      connection.closeSync();
    }
  });
});
