import "server-only";

import { applyPendingMigrations } from "./migrations";
import { validateInitialSeedCatalog } from "./seed-catalog-health";
import { seedBundledHasaneyldrmExercises } from "@/server/exercises/import/hasaneyldrm-exercises-persistence";
import { getDuckDbPath } from "./duckdb";
import { initializeDatabaseOnce, resetDatabaseInitialization } from "./initialization-cache";
import path from "node:path";

function initializationKey() {
  return `${path.resolve(getDuckDbPath())}:${process.env.NODE_ENV ?? "development"}:${process.env.OCRCRAFT_AUTO_IMPORT_EXTERNAL_EXERCISES ?? "default"}`;
}

async function initializeDatabase(): Promise<void> {
  await applyPendingMigrations();
  await validateInitialSeedCatalog();
  if (process.env.NODE_ENV !== "test") await seedBundledHasaneyldrmExercises();
}

export function ensureDatabaseReady(): Promise<void> {
  return initializeDatabaseOnce(initializationKey(), initializeDatabase);
}

export function resetDatabaseReady(): void {
  resetDatabaseInitialization(initializationKey());
}
