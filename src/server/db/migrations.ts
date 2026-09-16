import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { DuckDBConnection } from "@duckdb/node-api";
import { withDuckDbConnection } from "./duckdb";

interface Migration {
  readonly version: number;
  readonly fileName: string;
}

const migrations: readonly Migration[] = [
  { version: 1, fileName: "001_initial.sql" },
  { version: 2, fileName: "002_exercise_catalog.sql" },
  { version: 3, fileName: "003_seed_exercise_catalog.sql" },
  { version: 4, fileName: "004_exercise_details.sql" },
  { version: 5, fileName: "005_running_seed_guidance.sql" },
  { version: 6, fileName: "006_obstacle_seed_guidance.sql" },
];

async function getAppliedVersions(): Promise<Set<number>> {
  return withDuckDbConnection(async (connection) => {
    await connection.run(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name VARCHAR NOT NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT current_timestamp
      )
    `);

    const reader = await connection.runAndReadAll(
      "SELECT version FROM schema_migrations ORDER BY version",
    );

    return new Set(reader.getRows().map(([version]) => Number(version)));
  });
}

export async function runSqlScript(
  connection: DuckDBConnection,
  sql: string,
): Promise<void> {
  const statements = await connection.extractStatements(sql);

  for (let index = 0; index < statements.count; index += 1) {
    const statement = await statements.prepare(index);
    await statement.run();
  }
}

export async function applyPendingMigrations(): Promise<readonly number[]> {
  const appliedVersions = await getAppliedVersions();
  const newlyApplied: number[] = [];

  for (const migration of migrations) {
    if (appliedVersions.has(migration.version)) continue;

    const migrationPath = path.join(
      process.cwd(),
      "src",
      "server",
      "db",
      "migrations",
      migration.fileName,
    );
    const sql = await readFile(migrationPath, "utf8");

    await withDuckDbConnection(async (connection) => {
      await runSqlScript(connection, sql);
    });

    newlyApplied.push(migration.version);
  }

  return newlyApplied;
}
