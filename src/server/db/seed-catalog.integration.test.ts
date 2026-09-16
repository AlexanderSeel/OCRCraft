import { readFile } from "node:fs/promises";
import path from "node:path";
import { DuckDBInstance } from "@duckdb/node-api";
import { describe, expect, it } from "vitest";

const migrationFiles = [
  "001_initial.sql",
  "002_exercise_catalog.sql",
  "003_seed_exercise_catalog.sql",
] as const;

async function runSqlScript(connection: Awaited<ReturnType<InstanceType<typeof DuckDBInstance>["connect"]>>, sql: string) {
  const statements = await connection.extractStatements(sql);
  for (let index = 0; index < statements.count; index += 1) {
    const statement = await statements.prepare(index);
    await statement.run();
  }
}

async function scalar(connection: Awaited<ReturnType<InstanceType<typeof DuckDBInstance>["connect"]>>, sql: string): Promise<number> {
  const reader = await connection.runAndReadAll(sql);
  return Number(reader.getRows()[0]?.[0] ?? 0);
}

describe("initial exercise catalog", () => {
  it("creates a broad bilingual OCR and running seed database", async () => {
    const instance = await DuckDBInstance.create(":memory:");
    const connection = await instance.connect();

    try {
      for (const fileName of migrationFiles) {
        const sql = await readFile(
          path.join(process.cwd(), "src", "server", "db", "migrations", fileName),
          "utf8",
        );
        await runSqlScript(connection, sql);
      }

      const total = await scalar(connection, "SELECT count(*) FROM exercises WHERE seed_key IS NOT NULL");
      const running = await scalar(connection, "SELECT count(*) FROM exercises WHERE category='running'");
      const categories = await scalar(connection, "SELECT count(DISTINCT category) FROM exercises WHERE seed_key IS NOT NULL");
      const translations = await scalar(connection, "SELECT count(*) FROM exercise_translations");
      const germanSearchDocs = await scalar(connection, "SELECT count(*) FROM search_documents_de WHERE entity_type='exercise'");
      const englishSearchDocs = await scalar(connection, "SELECT count(*) FROM search_documents_en WHERE entity_type='exercise'");
      const duplicateKeys = await scalar(connection, "SELECT count(*) FROM (SELECT seed_key FROM exercises WHERE seed_key IS NOT NULL GROUP BY seed_key HAVING count(*) > 1)");

      expect(total).toBeGreaterThanOrEqual(140);
      expect(running).toBeGreaterThanOrEqual(25);
      expect(categories).toBeGreaterThanOrEqual(11);
      expect(translations).toBe(total * 2);
      expect(germanSearchDocs).toBe(total);
      expect(englishSearchDocs).toBe(total);
      expect(duplicateKeys).toBe(0);
    } finally {
      connection.closeSync();
    }
  });
});
