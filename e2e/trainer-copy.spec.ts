import { expect, test } from "@playwright/test";

test("game creation explains the next step in both languages and still creates a game", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/games/new");
  await expect(page.getByText("Schritt 1 von 2: Grunddaten.", { exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Typ game");
  await page.getByRole("combobox", { name: "Sprache", exact: true }).selectOption("en");
  await expect(page.getByText("Step 1 of 2: Basic details.", { exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "Name (DE)", exact: true }).fill("E2E Spielanleitung");
  await page.screenshot({ path: "artifacts/ui-ux-review/game-creation-copy-mobile.png" });
  await page.getByRole("button", { name: "Create game and continue", exact: true }).click();
  await expect(page).toHaveURL(/\/exercises\/[^/]+\/edit/);
  await expect(page.locator('select[name="exerciseType"]')).toHaveValue("game");
  await page.reload();
  await expect(page.locator('select[name="exerciseType"]')).toHaveValue("game");
});

test("media copy keeps selection actions, rights checks and exports available", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/media?batchError=selection");
  await expect(page.getByText("Wähle mindestens eine Übung oder Medienkarte aus.", { exact: true })).toBeVisible();
  await page.getByTestId("filter-side-panel").getByRole("button", { name: /Filter öffnen/ }).click();
  await expect(page.getByRole("textbox", { name: "Suchen", exact: true })).toHaveAttribute("placeholder", "Übung suchen");
  const batch = page.locator('[data-tour="media-batch"]');
  await batch.locator("summary").first().click();
  await expect(batch.getByRole("combobox", { name: "Aktion für die Auswahl", exact: true })).toBeVisible();
  await batch.getByRole("button", { name: "Alle passenden Medien freigeben", exact: true }).click();
  const confirmation = page.getByRole("dialog", { name: "Alle passenden Medien freigeben?", exact: true });
  await expect(confirmation).toContainText("Rechte- und Quellenstatus");
  await confirmation.getByRole("button", { name: "Abbrechen", exact: true }).click();
  await expect(page.getByRole("link", { name: "Alle Codex-Aufgaben", exact: true })).toBeHidden();
  await page.locator("summary").filter({ hasText: "Bildserien und Exporte" }).click();
  await expect(page.getByRole("link", { name: "Alle Codex-Aufgaben", exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "Sprache", exact: true }).selectOption("en");
  await expect(batch.getByRole("heading", { name: "Work with multiple images", exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Suchen", exact: true })).toHaveAttribute("placeholder", "Search exercises");
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await batch.scrollIntoViewIfNeeded();
  await page.screenshot({ path: "artifacts/ui-ux-review/media-copy-mobile.png" });
});

test("generated notes use plain summaries while provenance remains available and outside print", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/quick-create");
  for (let step = 0; step < 4; step += 1) await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByRole("button", { name: "Trainingsentwurf erstellen", exact: true }).click();
  await expect(page.getByText("Vorschlag ohne KI", { exact: true })).toBeVisible();
  await expect(page.getByText(/Die Planung orientiert sich am Hauptteil/)).toBeVisible();
  const persisted = page.waitForResponse((response) => response.url().endsWith("/api/training/draft/persist") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Training speichern", exact: true }).click();
  const { id } = await (await persisted).json() as { id: string };
  await page.goto(`/training/${id}/trainer`);
  await expect(page.getByText("Aus dem Übungskatalog zusammengestelltes Training.", { exact: true })).toBeVisible();
  const original = "Quick Create · local deterministic sports composer";
  await expect(page.getByText(original, { exact: true })).toBeHidden();
  await page.locator("summary").filter({ hasText: "Erstellungsdetails" }).click();
  await expect(page.getByText(original, { exact: true })).toBeVisible();
  await page.locator("summary").filter({ hasText: "Erstellungsdetails" }).click();
  await page.screenshot({ path: "artifacts/ui-ux-review/training-copy-mobile.png", fullPage: false });
  await page.goto(`/training/${id}/print`);
  await page.locator("summary").filter({ hasText: "Erstellungsdetails" }).click();
  await page.emulateMedia({ media: "print" });
  await expect(page.getByText(original, { exact: true })).toBeHidden();
  await expect(page.getByText("Aus dem Übungskatalog zusammengestelltes Training.", { exact: true })).toBeVisible();
});
