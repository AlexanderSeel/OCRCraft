import { readFile } from "node:fs/promises";
import path from "node:path";
import { DuckDBInstance } from "@duckdb/node-api";
import { describe, expect, it } from "vitest";

const migrationFiles = [
  "001_initial.sql",
  "002_exercise_catalog.sql",
  "003_seed_exercise_catalog.sql",
  "004_exercise_details.sql",
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
      const detailRows = await scalar(connection, "SELECT count(*) FROM exercise_details d JOIN exercises e ON e.id=d.exercise_id WHERE e.seed_key IS NOT NULL");
      const detailGaps = await scalar(connection, "SELECT count(*) FROM exercise_details WHERE purpose='' OR setup='' OR start_position='' OR finish_reset='' OR breathing_cue='' OR tempo_cue='' OR safety_notes='' OR quality_criteria='' OR level_1='' OR level_2='' OR level_3='' OR child_youth_variant='' OR prerequisites='' OR fallback_exercise=''");
      const shortExecution = await scalar(connection, "SELECT count(*) FROM exercises e WHERE e.seed_key IS NOT NULL AND (SELECT count(*) FROM exercise_execution_steps s WHERE s.exercise_id=e.id AND s.locale='de') < 3");
      const runningGaps = await scalar(connection, "SELECT count(*) FROM exercises e JOIN exercise_details d ON d.exercise_id=e.id AND d.locale='de' WHERE e.seed_key IS NOT NULL AND e.category='running' AND (d.work_rest_guidance='' OR d.purpose NOT LIKE '%Ausdauer%' AND d.purpose NOT LIKE '%Lauftechnik%')");
      const obstacleGaps = await scalar(connection, "SELECT count(*) FROM exercises e JOIN exercise_details d ON d.exercise_id=e.id AND d.locale='de' WHERE e.seed_key IS NOT NULL AND e.category IN ('ocr-skill','grip-rig') AND (d.prerequisites='' OR d.fallback_exercise='' OR d.supervision='normal')");

      expect(total).toBeGreaterThanOrEqual(140);
      expect(running).toBeGreaterThanOrEqual(25);
      expect(categories).toBeGreaterThanOrEqual(11);
      expect(translations).toBe(total * 2);
      expect(germanSearchDocs).toBe(total);
      expect(englishSearchDocs).toBe(total);
      expect(duplicateKeys).toBe(0);
      expect(detailRows).toBe(total * 2);
      expect(detailGaps).toBe(0);
      expect(shortExecution).toBe(0);
      expect(runningGaps).toBe(0);
      expect(obstacleGaps).toBe(0);
    } finally {
      connection.closeSync();
    }
  });
});
