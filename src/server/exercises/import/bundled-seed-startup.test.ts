import { afterEach, beforeEach, expect, it, vi } from "vitest";

const fixtures = vi.hoisted(() => ({
  readFile: vi.fn(), open: vi.fn(), unlink: vi.fn(), query: vi.fn(), run: vi.fn(), writeFile: vi.fn(), close: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("node:fs/promises", () => ({ readFile: fixtures.readFile, open: fixtures.open, unlink: fixtures.unlink }));
vi.mock("@/server/db/database-ready", () => ({ ensureDatabaseReady: async () => undefined }));
vi.mock("@/server/db/duckdb", () => ({
  getDuckDbPath: () => "fixture/catalog.duckdb",
  withDuckDbConnection: async (operation: (connection: { runAndReadAll: typeof fixtures.query; run: typeof fixtures.run }) => Promise<unknown>) => operation({ runAndReadAll: fixtures.query, run: fixtures.run }),
}));
import { seedBundledHasaneyldrmExercises } from "./hasaneyldrm-exercises-persistence";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("OCRCRAFT_AUTO_IMPORT_EXTERNAL_EXERCISES", "");
  fixtures.open.mockResolvedValue({ writeFile: fixtures.writeFile, close: fixtures.close });
  fixtures.unlink.mockResolvedValue(undefined);
});
afterEach(() => { vi.unstubAllEnvs(); });

it("checks existing source identities once and never replays existing bundled records", async () => {
  fixtures.readFile.mockResolvedValue(JSON.stringify([
    { id: "known-a", name: "Known A", source_url: "https://example.invalid/a" },
    { id: "known-b", name: "Known B", source_url: "https://example.invalid/b" },
  ]));
  fixtures.query.mockResolvedValue({ getRows: () => [["https://example.invalid/a"], ["https://example.invalid/b"]] });
  const result = await seedBundledHasaneyldrmExercises();
  expect(result).toMatchObject({ imported: 0, skipped: 2 });
  expect(fixtures.query).toHaveBeenCalledOnce();
  expect(fixtures.open.mock.calls[0][0]).toBe("fixture/catalog.duckdb.hasaneyldrm-seed.lock");
  expect(fixtures.close).toHaveBeenCalledOnce();
});

it("keeps automatic-import opt-out and releases the seed lock on failure", async () => {
  vi.stubEnv("OCRCRAFT_AUTO_IMPORT_EXTERNAL_EXERCISES", "false");
  expect(await seedBundledHasaneyldrmExercises()).toBeNull();
  expect(fixtures.open).not.toHaveBeenCalled();
  vi.stubEnv("OCRCRAFT_AUTO_IMPORT_EXTERNAL_EXERCISES", "");
  fixtures.readFile.mockResolvedValue("bad json");
  await expect(seedBundledHasaneyldrmExercises()).rejects.toThrow();
  expect(fixtures.close).toHaveBeenCalledOnce();
  expect(fixtures.unlink).toHaveBeenCalledOnce();
});

it("sends only missing sources through the full import path", async () => {
  fixtures.readFile.mockResolvedValue(JSON.stringify([
    { id: "known", name: "Known", source_url: "https://example.invalid/known" },
    { id: "missing", name: "Missing", source_url: "https://example.invalid/missing" },
  ]));
  fixtures.run.mockResolvedValue(undefined);
  fixtures.query.mockImplementation(async (sql: string, parameters?: { sourceUrl: string }) => {
    if (sql.includes("SELECT DISTINCT source_url")) return { getRows: () => [["https://example.invalid/known"]] };
    expect(parameters?.sourceUrl).toBe("https://example.invalid/missing");
    throw new Error("missing source reached full import");
  });
  await expect(seedBundledHasaneyldrmExercises()).rejects.toThrow("missing source reached full import");
  expect(fixtures.query).toHaveBeenCalledTimes(2);
  expect(fixtures.run).toHaveBeenCalledWith("ROLLBACK");
});
