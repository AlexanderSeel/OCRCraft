import { expect, test } from "@playwright/test";

const builderKey = "ocrcraft-builder-recovery-v1:new:local";
const plannerKey = "ocrcraft-quick-planner-recovery-v1";

test("Builder restores its inputs explicitly and isolates AI mode", async ({ page }) => {
  await page.goto("/training/builder", { waitUntil: "domcontentloaded" });
  await page.getByRole("textbox", { name: "Trainingstitel" }).fill("Recovered Builder");
  await page.getByRole("textbox", { name: "Alter", exact: true }).last().fill("18+");
  await page.getByRole("spinbutton", { name: "Hauptteile", exact: true }).last().fill("2");
  await expect(page.getByTestId("builder-recovery")).toContainText("Planung auf diesem Gerät gesichert");
  await page.goto("/training/builder?mode=ai", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("builder-recovery")).toBeHidden();
  await expect(page.getByRole("textbox", { name: "Trainingstitel" })).toHaveValue("");
  await page.goto("/training/builder", { waitUntil: "domcontentloaded" });
  const notice = page.getByTestId("builder-recovery");
  await expect(notice).toContainText("Lokale Planung gefunden");
  await expect(page.getByRole("textbox", { name: "Trainingstitel" })).toHaveValue("");
  await notice.getByRole("button", { name: "Planung wiederherstellen" }).click();
  await expect(page.getByRole("textbox", { name: "Trainingstitel" })).toHaveValue("Recovered Builder");
  await expect(page.getByRole("textbox", { name: "Alter", exact: true }).last()).toHaveValue("18+");
  await expect(page.getByRole("spinbutton", { name: "Hauptteile", exact: true }).last()).toHaveValue("2");
  await expect(page.getByRole("spinbutton", { name: "Übungen Hauptteil 2", exact: true }).last()).toBeVisible();
  await page.getByRole("button", { name: "Lokal planen", exact: true }).click();
  await expect(page.getByRole("button", { name: "Training speichern", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Training speichern", exact: true }).click();
  await expect(page.getByRole("link", { name: "Gespeichertes Training öffnen" })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), builderKey)).toBeNull();
});

test("Quick Planner restores independently on mobile and clears its backup after saving", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/training/builder", { waitUntil: "domcontentloaded" });
  const planner = page.locator('[data-tour="builder"]');
  await planner.getByRole("spinbutton", { name: "Teilnehmer", exact: true }).fill("10");
  await planner.getByRole("spinbutton", { name: "Dauer (Min.)", exact: true }).fill("45");
  await expect(page.getByTestId("quick-planner-recovery")).toContainText("Planung auf diesem Gerät gesichert");
  expect(await page.evaluate((key) => localStorage.getItem(key), builderKey)).toBeNull();
  await page.reload();
  const notice = page.getByTestId("quick-planner-recovery");
  await expect(notice).toContainText("Lokale Planung gefunden");
  await expect(planner.getByRole("spinbutton", { name: "Teilnehmer", exact: true })).toHaveValue("12");
  await notice.getByRole("button", { name: "Planung wiederherstellen" }).click();
  await expect(planner.getByRole("spinbutton", { name: "Teilnehmer", exact: true })).toHaveValue("10");
  await expect(planner.getByRole("spinbutton", { name: "Dauer (Min.)", exact: true })).toHaveValue("45");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await planner.getByRole("button", { name: "Quickplan erstellen", exact: true }).click();
  await expect(planner.getByRole("button", { name: "Training speichern", exact: true })).toBeEnabled();
  await planner.getByRole("button", { name: "Training speichern", exact: true }).click();
  await expect(planner.getByText(/^Training gespeichert:/)).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), plannerKey)).toBeNull();
});
