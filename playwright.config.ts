import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const playwrightPort = process.env.PLAYWRIGHT_PORT ?? "3000";
const playwrightBaseUrl = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${playwrightPort}`;
const playwrightDatabasePath = process.env.OCRCRAFT_E2E_DB_PATH ?? path.join(process.cwd(), "e2e", ".auth", "ocrcraft-e2e.duckdb");

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  timeout: 90_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL: playwrightBaseUrl,
    navigationTimeout: 75_000,
    trace: "retain-on-failure",
    storageState: "e2e/.auth/storage-state.json",
  },
  webServer: {
    command: `npm run start -- --hostname 127.0.0.1 --port ${playwrightPort}`,
    url: playwrightBaseUrl,
    env: {
      OCRCRAFT_DB_PATH: playwrightDatabasePath,
      OCRCRAFT_LOGIN_CODE: process.env.OCRCRAFT_LOGIN_CODE ?? "",
      OCRCRAFT_AUTO_IMPORT_EXTERNAL_EXERCISES: "false",
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
