import { expect, test } from "@playwright/test";
const key = "ocrcraft-quick-create-recovery-v1";

test("Quick Create restores inputs explicitly, discards backups and clears them after saving", async ({ page }) => {
  await page.goto("/quick-create", { waitUntil: "domcontentloaded" });
  await page.getByRole("textbox", { name: "Alter / Bereich" }).fill("8–12");
  await page.getByRole("button", { name: /^Kids/ }).click();
  await expect(page.getByTestId("quick-create-recovery")).toContainText("Planung auf diesem Gerät gesichert");
  await page.reload();
  const recovery = page.getByTestId("quick-create-recovery");
  await expect(recovery).toContainText("Lokale Planung gefunden");
  await expect(page.getByRole("textbox", { name: "Alter / Bereich" })).toHaveValue("16+");
  await recovery.getByRole("button", { name: "Planung wiederherstellen" }).click();
  await expect(page.getByRole("textbox", { name: "Alter / Bereich" })).toHaveValue("8–12");
  await expect(page.getByRole("button", { name: /^Kids/ })).toHaveAttribute("aria-pressed", "true");
  await recovery.getByRole("button", { name: "Lokale Planung verwerfen" }).click();
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBeNull();
  await page.reload();
  await expect(recovery).toBeHidden();
  await page.getByRole("textbox", { name: "Alter / Bereich" }).fill("18+");
  await expect(recovery).toContainText("Planung auf diesem Gerät gesichert");
  for (let step = 0; step < 4; step++) await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByRole("button", { name: "Trainingsentwurf erstellen", exact: true }).click();
  await expect(page.getByRole("button", { name: "Training speichern", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Training speichern", exact: true }).click();
  await expect(page.getByRole("link", { name: "Gespeicherte Trainings öffnen" })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBeNull();
});

test("invalid local recovery data is rejected without blocking planning", async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem(key, '{"version":99}'), key);
  await page.goto("/quick-create", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("quick-create-recovery")).toContainText("Lokale Sicherung nicht verfügbar");
  await expect(page.getByRole("textbox", { name: "Alter / Bereich" })).toBeEditable();
});

test("storage failures leave Quick Create usable", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException("Quota exceeded", "QuotaExceededError"); };
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/quick-create", { waitUntil: "domcontentloaded" });
  await page.getByRole("textbox", { name: "Alter / Bereich" }).fill("18+");
  await expect(page.getByTestId("quick-create-recovery")).toContainText("Lokale Sicherung nicht verfügbar");
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await expect(page.getByRole("button", { name: "Weiter", exact: true })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
