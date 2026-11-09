import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const recoveryKey = "ocrcraft-quick-create-recovery-v1";

test.describe("server metadata", () => {
  test.use({ javaScriptEnabled: false });
  test("provides a complete route title before hydration", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Dashboard · OCRCraft/);
    await page.goto("/exercises/new");
    await expect(page).toHaveTitle(/Neue Übung · OCRCraft/);
  });
});

test("titles identify routes and follow language changes and browser navigation", async ({ page }) => {
  for (const [route, title] of [["/", "Dashboard"], ["/exercises/new", "Neue Übung"], ["/training/builder", "Training Builder"], ["/admin?tab=settings", "Administration"]]) {
    await page.goto(route);
    await expect(page).toHaveTitle(new RegExp(`${title} · OCRCraft`));
  }
  await page.getByRole("combobox", { name: "Sprache", exact: true }).selectOption("en");
  await page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("link", { name: "Exercises", exact: true }).click();
  await expect(page).toHaveTitle(/Exercise library · OCRCraft/);
  await page.getByRole("link", { name: "+ Neue Übung", exact: true }).click();
  await expect(page).toHaveTitle(/New exercise · OCRCraft/);
  await page.goBack();
  await expect(page).toHaveTitle(/Exercise library · OCRCraft/);
});

test("leaving immediately flushes valid planning inputs without resurrecting discarded backups", async ({ page }) => {
  await page.goto("/quick-create");
  const age = page.getByRole("textbox", { name: "Alter / Bereich", exact: true });
  await age.fill("9–13");
  // No wait for the normal 300 ms debounce: pagehide must flush the latest commit.
  await page.reload();
  const recovery = page.getByTestId("quick-create-recovery");
  await expect(recovery).toContainText("Lokale Planung gefunden");
  await recovery.getByRole("button", { name: "Planung wiederherstellen", exact: true }).click();
  await expect(age).toHaveValue("9–13");
  await recovery.getByRole("button", { name: "Lokale Planung verwerfen", exact: true }).click();
  await page.reload();
  await expect(recovery).toBeHidden();
  expect(await page.evaluate((key) => localStorage.getItem(key), recoveryKey)).toBeNull();
});

test("the global fallback survives a failing root provider and retries after recovery", async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key) {
      if (key === "ocrcraft-locale") throw new DOMException("private-test-storage-detail", "SecurityError");
      return original.call(this, key);
    };
    window.addEventListener("ocrcraft-test-storage-recover", () => { Storage.prototype.getItem = original; }, { once: true });
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Seite konnte nicht geladen werden", exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("private-test-storage-detail");
  await expect(page.getByRole("main")).toHaveCount(1);
  await page.evaluate(() => window.dispatchEvent(new Event("ocrcraft-test-storage-recover")));
  await page.getByRole("button", { name: "Erneut versuchen", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
});

test("a real temporary database failure shows loading, safely retries and keeps the planning backup", async ({ page }) => {
  test.skip(process.env.PLAYWRIGHT_REUSE_SERVER === "1", "Failure simulation requires the isolated managed E2E server.");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/quick-create");
  await page.getByRole("textbox", { name: "Alter / Bereich", exact: true }).fill("10–14");
  await expect(page.getByTestId("quick-create-recovery")).toContainText("Planung auf diesem Gerät gesichert");
  const backup = await page.evaluate((key) => localStorage.getItem(key), recoveryKey);
  const database = process.env.OCRCRAFT_E2E_DB_PATH ?? path.join(process.cwd(), "e2e", ".auth", "ocrcraft-e2e.duckdb");
  const lock = `${database}.write.lock`;
  const owner = randomUUID();
  const started = Date.now();
  for (;;) {
    try { await writeFile(lock, JSON.stringify({ pid: process.pid, owner }), { flag: "wx" }); break; }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST" || Date.now() - started > 5000) throw error;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  try {
    await page.reload({ waitUntil: "commit" });
    await expect(page.getByRole("status")).toContainText("Die Daten werden vorbereitet");
    await expect(page.getByRole("heading", { name: "Seite konnte nicht geladen werden", exact: true })).toBeVisible({ timeout: 45_000 });
    await expect(page.locator("body")).not.toContainText("write.lock");
    expect(await page.evaluate((key) => localStorage.getItem(key), recoveryKey)).toBe(backup);
    await page.screenshot({ path: "artifacts/ui-ux-review/route-error-mobile.png" });
  } finally {
    const metadata = JSON.parse(await readFile(lock, "utf8")) as { owner?: string };
    if (metadata.owner === owner) await unlink(lock);
  }
  await page.getByRole("button", { name: "Erneut versuchen", exact: true }).click();
  const recovery = page.getByTestId("quick-create-recovery");
  await expect(recovery).toContainText("Lokale Planung gefunden");
  await recovery.getByRole("button", { name: "Planung wiederherstellen", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Alter / Bereich", exact: true })).toHaveValue("10–14");
});
