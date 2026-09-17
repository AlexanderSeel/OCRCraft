import "server-only";

import { applyPendingMigrations } from "./migrations";
import { validateInitialSeedCatalog } from "./seed-catalog-health";
import { seedBundledHasaneyldrmExercises } from "@/server/exercises/import/hasaneyldrm-exercises-persistence";

let readyPromise: Promise<void> | undefined;

async function initializeDatabase(): Promise<void> {
  await applyPendingMigrations();
  await validateInitialSeedCatalog();
  if (process.env.NODE_ENV !== "test") await seedBundledHasaneyldrmExercises();
}

export function ensureDatabaseReady(): Promise<void> {
  readyPromise ??= initializeDatabase().catch((error: unknown) => {
    readyPromise = undefined;
    throw error;
  });
  return readyPromise;
}
