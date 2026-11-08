import { expect, test } from "@playwright/test";

test.use({ actionTimeout: 15_000 });

test("UI review: detail, administration and standalone screens", async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  await page.goto("/exercises", { waitUntil: "domcontentloaded" });
  const exerciseHref = await page.locator("main a[href]").evaluateAll((links) => links.map((link) => link.getAttribute("href")).find((href) => /^\/exercises\/[0-9a-f-]+$/.test(href ?? "")));
  expect(exerciseHref).toBeTruthy();
  await page.goto("/quick-create", { waitUntil: "domcontentloaded" });
  for (let step = 0; step < 4; step += 1) await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByRole("button", { name: "Trainingsentwurf erstellen", exact: true }).click();
  await expect(page.getByRole("button", { name: "Training speichern", exact: true })).toBeEnabled();
  await page.getByRole("textbox", { name: "Trainingstitel" }).fill("UI Review Training");
  await page.getByRole("button", { name: "Training speichern", exact: true }).click();
  await expect(page.getByRole("link", { name: "Gespeicherte Trainings öffnen" })).toBeVisible();
  await page.goto("/training", { waitUntil: "domcontentloaded" });
  const trainingHref = await page.locator("main a[href]").evaluateAll((links) => links.map((link) => link.getAttribute("href")).find((href) => /^\/training\/[0-9a-f-]+$/.test(href ?? "")));
  expect(trainingHref, "saved review session must be available").toBeTruthy();
  await page.goto("/admin?tab=users", { waitUntil: "domcontentloaded" });
  const userHref = await page.locator("main a[href]").evaluateAll((links) => links.map((link) => link.getAttribute("href")).find((href) => /^\/admin\/users\/[^/]+\/edit$/.test(href ?? "")));
  expect(userHref).toBeTruthy();
  const routes = [
    "/games/new", "/login", "/setup", "/admin?tab=users", "/admin?tab=roles",
    "/admin?tab=quality", "/admin?tab=queue", "/admin?tab=imports", "/admin?tab=database",
    exerciseHref!, `${exerciseHref}/edit`, userHref!, trainingHref!,
    `${trainingHref}/combine`, `${trainingHref}/trainer`, `${trainingHref}/print`,
  ];
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status(), route).toBeLessThan(400);
      await expect(page.locator("main")).toBeVisible();
      await expect(page.locator("h1")).toHaveCount(1);
      if (route === "/admin?tab=roles") {
        await expect(page.getByRole("region", { name: "Berechtigungstabelle" }).first()).toBeVisible();
        await expect(page.getByRole("checkbox", { name: "Trainings: Lesen", exact: true }).first()).toBeVisible();
      }
      const sizes = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
      expect.soft(sizes.content, `${route} at ${width}px overflows`).toBeLessThanOrEqual(sizes.viewport + 1);
      await page.screenshot({ path: testInfo.outputPath(`${width}-${route.replace(/[^a-z0-9]/gi, "_")}.png`), fullPage: true });
    }
  }
});
