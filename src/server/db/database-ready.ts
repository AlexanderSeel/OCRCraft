import "server-only";

import { applyPendingMigrations } from "./migrations";

let readyPromise: Promise<void> | undefined;

async function initializeDatabase(): Promise<void> {
  await applyPendingMigrations();
}

export function ensureDatabaseReady(): Promise<void> {
  readyPromise ??= initializeDatabase();
  return readyPromise;
}
