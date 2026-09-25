import "server-only";

import { copyFile, mkdir, open, readFile, rename, stat, unlink } from "node:fs/promises";
import path from "node:path";
import {
  DuckDBInstance,
  type DuckDBConnection,
} from "@duckdb/node-api";

const defaultDatabasePath = path.join(process.cwd(), "data", "ocrcraft.duckdb");
const databasePath = process.env.OCRCRAFT_DB_PATH ?? defaultDatabasePath;
const bundledInitialDatabasePath = path.join(process.cwd(), "data", "ocrcraft.initial.duckdb");
const lockPath = `${databasePath}.write.lock`;
const lockRetryMs = 100;
const lockTimeoutMs = 30_000;

let instancePromise: Promise<DuckDBInstance> | undefined;

async function restoreBundledInitialDatabaseIfMissing(): Promise<void> {
  if (databasePath === ":memory:") return;
  try {
    await stat(databasePath);
    return;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  try {
    await stat(bundledInitialDatabasePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }

  await copyFile(bundledInitialDatabasePath, databasePath);
}

async function createInstance(): Promise<DuckDBInstance> {
  await mkdir(path.dirname(databasePath), { recursive: true });
  await restoreBundledInitialDatabaseIfMissing();
  try {
    return await DuckDBInstance.create(databasePath, { access_mode: "READ_WRITE" });
  } catch (error) {
    // A process killed during WAL replay can leave a WAL that DuckDB cannot
    // reopen. Preserve it for diagnosis and retry from the last checkpoint;
    // never delete it silently.
    const message = error instanceof Error ? error.message : String(error);
    if (!/WAL|replay|default database/i.test(message)) throw error;
    const walPath = `${databasePath}.wal`;
    try {
      await stat(walPath);
      const recoveryPath = `${walPath}.recovery-${Date.now()}`;
      await rename(walPath, recoveryPath);
      return await DuckDBInstance.create(databasePath, { access_mode: "READ_WRITE" });
    } catch {
      throw error;
    }
  }
}

export async function withDuckDbConnection<T>(
  operation: (connection: DuckDBConnection) => Promise<T>,
): Promise<T> {
  return withDuckDbFileLock(async () => {
    // Do not retain a process-global file handle. DuckDB supports concurrent
    // readers, but a long-lived instance in several Next workers can replay
    // the same WAL concurrently. The lock covers open, operation and close.
    const instance = await createInstance();
    const connection = await instance.connect();
    try {
      return await operation(connection);
    } finally {
      connection.closeSync();
      instance.closeSync();
    }
  });
}

/** Read-only connection with the same cross-process lock and a short polling budget. */
export async function withDuckDbReadConnection<T>(
  operation: (connection: DuckDBConnection) => Promise<T>,
): Promise<T> {
  return withDuckDbFileLock(async () => {
    await mkdir(path.dirname(databasePath), { recursive: true });
    const instance = await createInstance();
    const connection = await instance.connect();
    try { return await operation(connection); }
    finally { connection.closeSync(); instance.closeSync(); }
  }, 10_000);
}

interface LockHandle {
  readonly close: () => Promise<void>;
}

async function processIsAlive(pid: number): Promise<boolean> {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; } catch { return false; }
}

async function tryTakeLock(): Promise<LockHandle | null> {
  try {
    const file = await open(lockPath, "wx");
    await file.writeFile(JSON.stringify({ pid: process.pid, createdAt: Date.now() }), "utf8");
    return { close: async () => { await file.close(); await unlink(lockPath).catch(() => undefined); } };
  } catch (error) {
    // Windows can report EPERM instead of EEXIST while another process has
    // the lockfile open. Treat both codes as contention and keep polling.
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "EEXIST" && code !== "EPERM") throw error;
    try {
      const metadata = JSON.parse(await readFile(lockPath, "utf8")) as { pid?: number };
      if (!(await processIsAlive(Number(metadata.pid)))) await unlink(lockPath).catch(() => undefined);
    } catch {
      // Another process may be replacing the lock. The next retry will settle it.
    }
    return null;
  }
}

/** Serializes all file-backed DuckDB access across workers/processes. */
export async function withDuckDbFileLock<T>(operation: () => Promise<T>, timeoutMs = lockTimeoutMs): Promise<T> {
  await mkdir(path.dirname(lockPath), { recursive: true });
  const startedAt = Date.now();
  while (true) {
    const lock = await tryTakeLock();
    if (lock) {
      try { return await operation(); }
      finally { await lock.close(); }
    }
    if (Date.now() - startedAt >= timeoutMs) {
      throw new Error(`Timed out waiting for DuckDB write lock: ${lockPath}`);
    }
    await new Promise((resolve) => setTimeout(resolve, lockRetryMs));
  }
}

export function getDuckDbPath(): string {
  return databasePath;
}

/** Closes the process-local DuckDB instance before replacing the database file. */
export async function closeDuckDbInstance(): Promise<void> {
  const instance = await instancePromise;
  instance?.closeSync();
  instancePromise = undefined;
}
