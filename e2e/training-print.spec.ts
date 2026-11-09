import { mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("club print layout keeps branding and complete training guidance in A4 output", async ({ page }) => {
  await page.goto("/quick-create");
  for (let step = 0; step < 4; step += 1) await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByRole("button", { name: "Trainingsentwurf erstellen", exact: true }).click();
  await expect(page.getByRole("button", { name: "Training speichern", exact: true })).toBeEnabled();
  const persisted = page.waitForResponse((response) => response.url().endsWith("/api/training/draft/persist") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Training speichern", exact: true }).click();
  const { id } = await (await persisted).json() as { id: string };
  await page.goto(`/training/${id}/print`);
  const main = page.getByRole("main");
  const logo = page.getByRole("img", { name: "OCR Frankfurt · Obstacle Course Racing", exact: true });
  await expect(logo).toBeVisible();
  expect(await logo.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  expect(await main.locator('img[src="/brand/ocr-training-header.png"]').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  const exerciseNames = await main.locator("article").allTextContents();
  expect(exerciseNames.length).toBeGreaterThan(2);
  for (const width of [320, 794]) {
    await page.setViewportSize({ width, height: 1123 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.evaluate(() => document.documentElement.dataset.theme = "dark");
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("button", { name: "Drucken", exact: true })).toBeHidden();
  await expect(main.getByRole("heading", { level: 2 })).toHaveCount(3);
  expect(await main.evaluate((element) => getComputedStyle(element).color)).toBe("rgb(17, 17, 17)");
  await mkdir("artifacts/print-review", { recursive: true });
  await page.screenshot({ path: "artifacts/print-review/ocrfra-training.png", fullPage: false });
  await page.pdf({ path: "artifacts/print-review/ocrfra-training.pdf", format: "A4", printBackground: true, preferCSSPageSize: true });
  // Each exercise remains represented after switching to print media.
  expect(await main.locator("article").allTextContents()).toEqual(exerciseNames);
  await page.emulateMedia({ media: "screen" });
  await page.getByRole("link", { name: "Mit allen Übungsdetails", exact: true }).click();
  await expect(page.getByRole("link", { name: "Kompakter Trainingsplan", exact: true })).toBeVisible();
  const guidance = main.locator("details").filter({ has: page.locator("summary", { hasText: "Ausführung, Coaching & Sicherheit" }) });
  expect(await guidance.count()).toBeGreaterThan(0);
  for (const details of await guidance.all()) await expect(details).toHaveAttribute("open", "");
  const fullSafety = await main.getByRole("heading", { name: "Sicherheit", exact: true }).evaluateAll((headings) => headings.map((heading) => heading.nextElementSibling?.textContent?.trim()).filter(Boolean));
  await page.getByRole("link", { name: "Kompakter Trainingsplan", exact: true }).click();
  await expect(page.getByRole("link", { name: "Mit allen Übungsdetails", exact: true })).toBeVisible();
  for (const safety of fullSafety) await expect(main.getByText(safety!, { exact: false }).first()).toBeVisible();
});
