import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { withDuckDbConnection } from "./duckdb";

interface Migration {
  readonly version: number;
  readonly fileName: string;
}

const migrations: readonly Migration[] = [
  { version: 1, fileName: "001_initial.sql" },
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

    return new Set(
      reader.getRows().map(([version]) => Number(version)),
    );
  });
}

export async function applyPendingMigrations(): Promise<readonly number[]> {
  const appliedVersions = await getAppliedVersions();
  const newlyApplied: number[] = [];

  for (const migration of migrations) {
    if (appliedVersions.has(migration.version)) {
      continue;
    }

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
      await connection.run(sql);
    });

    newlyApplied.push(migration.version);
  }

  return newlyApplied;
}
