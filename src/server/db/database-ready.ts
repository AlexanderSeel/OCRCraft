import "server-only";

import { applyPendingMigrations } from "./migrations";
import { validateInitialSeedCatalog } from "./seed-catalog-health";

let readyPromise: Promise<void> | undefined;

async function initializeDatabase(): Promise<void> {
  await applyPendingMigrations();
  await validateInitialSeedCatalog();
}

export function ensureDatabaseReady(): Promise<void> {
  readyPromise ??= initializeDatabase().catch((error: unknown) => {
    readyPromise = undefined;
    throw error;
  });
  return readyPromise;
}
