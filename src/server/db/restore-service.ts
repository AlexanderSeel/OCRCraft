import "server-only";

import { copyFile, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { requireSuperAdmin } from "@/server/auth/identity-service";
import { closeDuckDbInstance, getDuckDbPath, withDuckDbFileLock } from "./duckdb";
import { createDatabaseBackup } from "./backup-service";

const backupNamePattern = /^ocrcraft-[\w-]+\.duckdb$/;

/** Restores a checked-in backup after first creating a safety backup. */
export async function restoreDatabaseBackup(fileName: string): Promise<{ readonly safetyBackup: string }> {
  await requireSuperAdmin();
  if (!backupNamePattern.test(fileName) || path.basename(fileName) !== fileName) {
    throw new Error("Invalid database backup name.");
  }
  const databasePath = getDuckDbPath();
  const backupDirectory = path.join(path.dirname(databasePath), "backups");
  const sourcePath = path.join(backupDirectory, fileName);
  const sourceStats = await stat(sourcePath);
  if (sourceStats.size < 1024) throw new Error("Database backup is too small to restore.");

  const safety = await createDatabaseBackup();
  await withDuckDbFileLock(async () => {
    await closeDuckDbInstance();
    await unlink(`${databasePath}.wal`).catch(() => undefined);
    await copyFile(sourcePath, databasePath);
  });
  return { safetyBackup: safety.fileName };
}
