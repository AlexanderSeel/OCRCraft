import "server-only";

import { mkdir } from "node:fs/promises";
import path from "node:path";
import {
  DuckDBInstance,
  type DuckDBConnection,
} from "@duckdb/node-api";

const defaultDatabasePath = path.join(process.cwd(), "data", "ocrcraft.duckdb");
const databasePath = process.env.OCRCRAFT_DB_PATH ?? defaultDatabasePath;

let instancePromise: Promise<DuckDBInstance> | undefined;

async function createInstance(): Promise<DuckDBInstance> {
  await mkdir(path.dirname(databasePath), { recursive: true });
  return DuckDBInstance.fromCache(databasePath);
}

export function getDuckDbInstance(): Promise<DuckDBInstance> {
  instancePromise ??= createInstance();
  return instancePromise;
}

export async function openDuckDbConnection(): Promise<DuckDBConnection> {
  const instance = await getDuckDbInstance();
  return instance.connect();
}

export async function withDuckDbConnection<T>(
  operation: (connection: DuckDBConnection) => Promise<T>,
): Promise<T> {
  const connection = await openDuckDbConnection();

  try {
    return await operation(connection);
  } finally {
    connection.closeSync();
  }
}

export function getDuckDbPath(): string {
  return databasePath;
}
