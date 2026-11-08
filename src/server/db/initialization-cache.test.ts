import { randomUUID } from "node:crypto";
import { expect, it, vi } from "vitest";
import { initializeDatabaseOnce, resetDatabaseInitialization } from "./initialization-cache";

it("coalesces initialization across module reloads without sharing different database keys", async () => {
  const key = randomUUID();
  const initialize = vi.fn(async () => undefined);
  await Promise.all([initializeDatabaseOnce(key, initialize), initializeDatabaseOnce(key, initialize)]);
  vi.resetModules();
  const reloaded = await import("./initialization-cache");
  await reloaded.initializeDatabaseOnce(key, initialize);
  expect(initialize).toHaveBeenCalledOnce();
  await reloaded.initializeDatabaseOnce(`${key}-other`, initialize);
  expect(initialize).toHaveBeenCalledTimes(2);
  resetDatabaseInitialization(key);
  await initializeDatabaseOnce(key, initialize);
  expect(initialize).toHaveBeenCalledTimes(3);
});

it("retries failed initialization", async () => {
  const key = randomUUID();
  await expect(initializeDatabaseOnce(key, async () => { throw new Error("startup failed"); })).rejects.toThrow("startup failed");
  await expect(initializeDatabaseOnce(key, async () => undefined)).resolves.toBeUndefined();
});
