import "server-only";

import { copyFile, mkdir, readdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { openDuckDbConnection, withDuckDbFileLock, getDuckDbPath } from "./duckdb";

export interface DatabaseBackupResult {
  readonly fileName: string;
  readonly absolutePath: string;
  readonly bytes: number;
  readonly createdAt: string;
}

export interface DatabaseBackupSummary {
  readonly fileName: string;
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
    await rotateDatabaseBackups(backupDirectory);
    return { fileName, absolutePath, bytes: sourceStats.size, createdAt };
  });
}

export async function listDatabaseBackups(): Promise<readonly DatabaseBackupSummary[]> {
  const backupDirectory = path.join(path.dirname(getDuckDbPath()), "backups");
  const names = (await readdir(backupDirectory).catch(() => [])).filter((name) => /^ocrcraft-.*\.duckdb$/.test(name));
  const summaries = await Promise.all(names.map(async (fileName) => {
    const file = await stat(path.join(backupDirectory, fileName));
    return { fileName, bytes: file.size, createdAt: file.mtime.toISOString() };
  }));
  return summaries.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

async function rotateDatabaseBackups(directory: string): Promise<void> {
  const retention = Math.max(1, Math.min(100, Number.parseInt(process.env.OCRCRAFT_BACKUP_RETENTION ?? "10", 10) || 10));
  const names = (await readdir(directory)).filter((name) => /^ocrcraft-.*\.duckdb$/.test(name)).sort().reverse();
  for (const fileName of names.slice(retention)) {
    await unlink(path.join(directory, fileName)).catch(() => undefined);
    await unlink(path.join(directory, `${fileName}.json`)).catch(() => undefined);
  }
}
