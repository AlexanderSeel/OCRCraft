import { expect, test } from "@playwright/test";

test("training detail leads with a sticky phase overview and keeps management secondary", async ({ page }, testInfo) => {
  await page.goto("/quick-create", { waitUntil: "domcontentloaded" });
  for (let step = 0; step < 4; step++) await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByRole("button", { name: "Trainingsentwurf erstellen", exact: true }).click();
  await expect(page.getByRole("button", { name: "Training speichern", exact: true })).toBeEnabled();
  const persisted = page.waitForResponse((response) => response.url().endsWith("/api/training/draft/persist") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Training speichern", exact: true }).click();
  const { id } = await (await persisted).json() as { id: string };
  await page.goto(`/training/${id}`, { waitUntil: "domcontentloaded" });
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const overview = page.getByTestId("training-session-overview");
    await overview.scrollIntoViewIfNeeded();
    await expect(overview).toBeInViewport();
    await expect(overview).toContainText("Geplant:");
    await expect(overview).toContainText("Zielgruppe:");
    await expect(overview).toContainText("Alter:");
    await expect(overview.getByRole("link")).toHaveCount(3);
    await expect(page.getByRole("button", { name: "Snapshot erstellen", exact: true })).toBeHidden();
    await expect(page.getByRole("button", { name: "Vorlage speichern", exact: true })).toBeHidden();
    await overview.getByRole("link", { name: /Cooldown/ }).click();
    await expect(page.locator('article[id^="phase-"]').last()).toBeInViewport();
    await expect(overview).toBeInViewport();
    const positions = await page.evaluate(() => ({
      header: document.querySelector(".app-header")!.getBoundingClientRect().bottom,
      overview: document.querySelector('[data-testid="training-session-overview"]')!.getBoundingClientRect().toJSON(),
      phase: document.querySelector('article[id^="phase-"]:last-child')!.getBoundingClientRect().toJSON(),
      width: document.documentElement.scrollWidth,
    }));
    expect(positions.overview.top).toBeGreaterThanOrEqual(positions.header - 1);
    expect(positions.phase.top).toBeGreaterThanOrEqual(positions.overview.bottom - 1);
    expect(positions.width).toBeLessThanOrEqual(width + 1);
    await page.screenshot({ path: testInfo.outputPath(`phase-overview-${width}.png`) });
  }
  await page.locator("summary").filter({ hasText: /^Versionen$/ }).click();
  await expect(page.getByRole("button", { name: "Snapshot erstellen", exact: true })).toBeVisible();
  await page.locator("summary").filter({ hasText: /^Als Vereinsvorlage speichern$/ }).click();
  await expect(page.getByRole("textbox", { name: /^Vorlagenname/ })).toBeVisible();
});
