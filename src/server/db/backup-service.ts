import "server-only";

import { copyFile, mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { openDuckDbConnection, withDuckDbFileLock, getDuckDbPath } from "./duckdb";

export interface DatabaseBackupResult {
  readonly fileName: string;
  readonly absolutePath: string;
  readonly bytes: number;
  readonly createdAt: string;
}

export async function createDatabaseBackup(): Promise<DatabaseBackupResult> {
  return withDuckDbFileLock(async () => {
    const connection = await openDuckDbConnection();
    try {
      await connection.run("CHECKPOINT");
    } finally {
      connection.closeSync();
    }

    const sourcePath = getDuckDbPath();
    const backupDirectory = path.join(path.dirname(sourcePath), "backups");
    await mkdir(backupDirectory, { recursive: true });
    const createdAt = new Date().toISOString();
    const stamp = createdAt.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    const fileName = `ocrcraft-${stamp}.duckdb`;
    const absolutePath = path.join(backupDirectory, fileName);
    await copyFile(sourcePath, absolutePath);
    const sourceStats = await stat(absolutePath);
    await writeFile(
      `${absolutePath}.json`,
      JSON.stringify({ schema: "ocrcraft-backup-v1", createdAt, fileName, bytes: sourceStats.size }, null, 2),
      "utf8",
    );
    return { fileName, absolutePath, bytes: sourceStats.size, createdAt };
  });
}
