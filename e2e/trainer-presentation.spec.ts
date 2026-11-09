import { expect, test, type Page } from "@playwright/test";

async function createTraining(page: Page): Promise<string> {
  await page.goto("/quick-create");
  for (let step = 0; step < 4; step += 1) await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByRole("button", { name: "Trainingsentwurf erstellen", exact: true }).click();
  await expect(page.getByRole("button", { name: "Training speichern", exact: true })).toBeEnabled();
  const persisted = page.waitForResponse((response) => response.url().endsWith("/api/training/draft/persist") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Training speichern", exact: true }).click();
  const result = await (await persisted).json() as { id: string };
  return result.id;
}

test("trainer view has a responsive return path and tracks real fullscreen changes", async ({ page }) => {
  const id = await createTraining(page);
  await page.goto(`/training/${id}/trainer`);
  const back = page.getByRole("link", { name: "Zurück zum Training", exact: true });
  await expect(back).toHaveAttribute("href", `/training/${id}`);
  await expect(page.getByRole("link", { name: "Druckansicht", exact: true })).toHaveAttribute("href", `/training/${id}/print`);
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(back).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  const enter = page.getByRole("button", { name: "Vollbild", exact: true });
  await enter.click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id)).toBe("training-trainer-view");
  const exit = page.getByRole("button", { name: "Vollbild verlassen", exact: true });
  await expect(exit).toHaveAttribute("aria-pressed", "true");
  await exit.click();
  await expect(enter).toHaveAttribute("aria-pressed", "false");
  await enter.click();
  await expect(exit).toBeVisible();
  await page.evaluate(() => document.exitFullscreen());
  await expect(enter).toHaveAttribute("aria-pressed", "false");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "artifacts/ui-ux-review/trainer-toolbar-mobile.png" });
  await back.click();
  await expect(page).toHaveURL(new RegExp(`/training/${id}$`));
  await expect(page.getByTestId("training-session-overview")).toBeVisible();
});

test("denied fullscreen requests and exit failures remain recoverable without unhandled errors", async ({ page }) => {
  await page.addInitScript(() => {
    const request = Element.prototype.requestFullscreen;
    const exit = document.exitFullscreen.bind(document);
    let denyEntry = true, denyExit = true;
    Element.prototype.requestFullscreen = function (options) {
      if (denyEntry) { denyEntry = false; return Promise.reject(new DOMException("private-entry-detail", "NotAllowedError")); }
      return request.call(this, options);
    };
    document.exitFullscreen = () => {
      if (denyExit) { denyExit = false; return Promise.reject(new Error("private-exit-detail")); }
      return exit();
    };
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const id = await createTraining(page);
  await page.goto(`/training/${id}/trainer`);
  await page.getByRole("button", { name: "Vollbild", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Vollbild konnte nicht gestartet werden");
  await expect(page.locator("body")).not.toContainText("private-entry-detail");
  await page.getByRole("button", { name: "Vollbild", exact: true }).click();
  const exit = page.getByRole("button", { name: "Vollbild verlassen", exact: true });
  await expect(exit).toBeVisible();
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
  await exit.click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("drücke Esc");
  await expect(page.locator("body")).not.toContainText("private-exit-detail");
  await page.evaluate(() => document.exitFullscreen());
  await expect(page.getByRole("button", { name: "Vollbild", exact: true })).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("missing fullscreen API has English feedback while return and print remain usable", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("ocrcraft-locale", "en");
    Object.defineProperty(Element.prototype, "requestFullscreen", { configurable: true, value: undefined });
    window.print = () => document.documentElement.setAttribute("data-print-requested", "true");
  });
  const id = await createTraining(page);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto(`/training/${id}/trainer`);
  await page.getByRole("button", { name: "Fullscreen", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Fullscreen is unavailable");
  await expect(page.getByRole("link", { name: "Back to training", exact: true })).toHaveAttribute("href", `/training/${id}`);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("link", { name: "Print view", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/training/${id}/print$`));
  await page.getByRole("button", { name: "Print", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-print-requested", "true");
});
