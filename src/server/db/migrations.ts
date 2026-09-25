import "server-only";

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import type { DuckDBConnection } from "@duckdb/node-api";
import { withDuckDbConnection } from "./duckdb";

interface Migration {
  readonly version: number;
  readonly fileName: string;
}

async function discoverMigrations(): Promise<readonly Migration[]> {
  const directory = path.join(process.cwd(), "src", "server", "db", "migrations");
  const fileNames = (await readdir(directory))
    .filter((fileName) => /^\d{3}_.*\.sql$/.test(fileName))
    .sort((left, right) => Number(left.slice(0, 3)) - Number(right.slice(0, 3)));

  const seen = new Set<number>();
  return fileNames.map((fileName) => {
    const version = Number(fileName.slice(0, 3));
    if (!Number.isInteger(version) || seen.has(version)) {
      throw new Error(`Invalid or duplicate database migration version: ${fileName}`);
    }
    seen.add(version);
    return { version, fileName };
  });
}

const initialSchemaFileName = "initial-v1.sql";

export async function readAllMigrationScripts(): Promise<readonly string[]> {
  const migrations = await discoverMigrations();
  return Promise.all(
    migrations.map(({ fileName }) =>
      readFile(
        path.join(process.cwd(), "src", "server", "db", "migrations", fileName),
        "utf8",
      ),
    ),
  );
}

async function readInitialSchemaScript(): Promise<string> {
  return readFile(
    path.join(process.cwd(), "src", "server", "db", initialSchemaFileName),
    "utf8",
  );
}

async function isFreshDatabase(): Promise<boolean> {
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      SELECT count(*)
      FROM information_schema.tables
      WHERE table_schema='main' AND table_name <> 'schema_migrations'
    `);
    return Number(reader.getRows()[0]?.[0] ?? 0) === 0;
  });
}

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
  const migrations = await discoverMigrations();
  if (await isFreshDatabase()) {
    await withDuckDbConnection(async (connection) => {
      await runSqlScript(connection, await readInitialSchemaScript());
    });
    return migrations.map(({ version }) => version);
  }

  const applied = await getAppliedVersions();
  const scripts = await Promise.all(
    migrations.map(({ fileName }) =>
      readFile(path.join(process.cwd(), "src", "server", "db", "migrations", fileName), "utf8"),
    ),
  );
  const newlyApplied: number[] = [];

  for (let index = 0; index < migrations.length; index += 1) {
    const migration = migrations[index];
    if (applied.has(migration.version)) continue;

    await withDuckDbConnection(async (connection) => {
      await runSqlScript(connection, scripts[index]);
    });
    newlyApplied.push(migration.version);
  }

  return newlyApplied;
}
