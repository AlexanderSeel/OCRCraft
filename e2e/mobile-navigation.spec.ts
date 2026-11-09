import { expect, test } from "@playwright/test";

test("mobile navigation reveals the active destination, including nested routes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [route, label] of [["/media", "Medien"], ["/exercises/ai-drafts", "AI-Entwürfe"], ["/admin/outdoor-variants", "Outdoor"], ["/quick-create", "Training"]]) {
    await page.goto(route);
    const navigation = page.getByRole("navigation", { name: "Hauptnavigation mobil", exact: true });
    await expect(navigation.locator('[aria-current="page"]')).toHaveCount(1);
    const active = navigation.getByRole("link", { name: label, exact: true });
    await expect(active).toHaveAttribute("aria-current", "page");
    await expect.poll(() => active.evaluate((element) => {
      const bounds = element.parentElement!.parentElement!.getBoundingClientRect();
      const item = element.getBoundingClientRect();
      return item.left >= bounds.left - 1 && item.right <= bounds.right + 1;
    })).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.screenshot({ path: "artifacts/ui-ux-review/mobile-navigation.png" });
});

test("all destinations supports keyboard dismissal, navigation and browser back", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/media");
  const trigger = page.getByRole("button", { name: "Alle Ziele", exact: true });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Alle Ziele", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("link")).toHaveCount(11);
  await expect(dialog.getByRole("link", { name: "Medien", exact: true })).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("link", { name: "Hilfezentrum" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Dialog schließen" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole("link", { name: "Gruppen", exact: true }).click();
  await expect(page).toHaveURL(/\/groups$/);
  await expect(dialog).toHaveCount(0);
  await page.goBack();
  await expect(page).toHaveURL(/\/media$/);
  await expect(page.getByRole("navigation", { name: "Hauptnavigation mobil", exact: true }).getByRole("link", { name: "Medien", exact: true })).toHaveAttribute("aria-current", "page");
});

test("navigation stays usable in English and across mobile and desktop widths", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("ocrcraft-locale", "en"));
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/help");
  const mobile = page.getByRole("navigation", { name: "Mobile main navigation", exact: true });
  await expect(mobile.getByRole("link", { name: "Help center", exact: true })).toHaveAttribute("aria-current", "page");
  await page.getByRole("button", { name: "All destinations", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "All destinations", exact: true });
  await expect(dialog.getByRole("link", { name: "Exercises", exact: true })).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Administration", exact: true })).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(dialog).toHaveCount(0);
  await expect(mobile).toBeHidden();
  await expect(page.getByRole("navigation", { name: "Main navigation", exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(mobile).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
