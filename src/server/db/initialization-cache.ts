const processState = globalThis as typeof globalThis & {
  __ocrcraftDatabaseInitialization?: Map<string, Promise<void>>;
};
const initialized = processState.__ocrcraftDatabaseInitialization ??= new Map();

/** Process-only boot state survives HMR; never stores user data or authorization. */
export function initializeDatabaseOnce(key: string, initialize: () => Promise<void>): Promise<void> {
  const existing = initialized.get(key);
  if (existing) return existing;
  const pending = Promise.resolve().then(initialize).catch((error: unknown) => {
    if (initialized.get(key) === pending) initialized.delete(key);
    throw error;
  });
  initialized.set(key, pending);
  return pending;
}

export function resetDatabaseInitialization(key: string): void {
  initialized.delete(key);
}
