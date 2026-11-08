import { expect, test } from "@playwright/test";
import type { TrainingDraft } from "../src/domain/training/draft";

test("draft preview separates blockers from recommendations on mobile and translates its status", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/training/draft", async (route) => {
    const response = await route.fetch();
    const draft = await response.json() as TrainingDraft;
    await route.fulfill({ response, json: { ...draft, validationIssues: [
      { code: "age-restricted", severity: "error", message: "Test: Altersgrenze verletzt" },
      { code: "setup-transition-time", severity: "warning", message: "Test: Wechselzeit prüfen" },
    ], warnings: ["Test: Technik zuerst"] } });
  });
  await page.goto("/quick-create", { waitUntil: "domcontentloaded" });
  for (let step = 0; step < 4; step++) await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByRole("button", { name: "Trainingsentwurf erstellen", exact: true }).click();
  await expect(page.getByText("Prüfe den Entwurf und seine Hinweise, bevor du ihn speicherst.")).toBeVisible();
  const summary = page.getByTestId("training-validation-summary");
  await expect(summary.getByRole("alert")).toContainText("Fehler: 1 · Hinweise: 2");
  await expect(summary.getByRole("alert")).toContainText("Vor dem Speichern beheben");
  await expect(summary.getByRole("region", { name: "Fehler", exact: true })).toContainText("Test: Altersgrenze verletzt");
  const notes = summary.getByRole("region", { name: "Planungshinweise und Empfehlungen" });
  await expect(notes).toContainText("Test: Wechselzeit prüfen");
  await expect(notes).toContainText("Test: Technik zuerst");
  await expect(notes).not.toContainText("Altersgrenze verletzt");
  await summary.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("mixed-validation-mobile.png") });
  await page.getByRole("combobox", { name: "Sprache", exact: true }).selectOption("en");
  await expect(summary.getByRole("alert")).toContainText("Errors: 1 · Notes: 2");
  await expect(summary.getByRole("alert")).toContainText("Resolve before saving");
});
