import { expect, test } from "@playwright/test";

test.use({ hasTouch: true });

test("field hints keep clean labels, support touch and Escape, and stay in the viewport", async ({ page }) => {
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/exercises/new");
    const field = page.getByRole("textbox", { name: "Aliase (DE)", exact: true });
    const hint = page.getByRole("button", { name: "Feldhinweis: Aliase (DE)", exact: true });
    await expect(field).toHaveAccessibleName("Aliase (DE)");
    await expect(field).toHaveAccessibleDescription("Kommagetrennt, z. B. Pendellauf, Shuttle");
    const bounds = await hint.boundingBox();
    expect(bounds!.width).toBeGreaterThanOrEqual(44);
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
    await hint.tap();
    const tooltip = page.getByRole("tooltip");
    await expect(tooltip).toBeVisible();
    await expect(hint).toHaveAttribute("aria-expanded", "true");
    const popup = await tooltip.boundingBox();
    expect(popup!.x).toBeGreaterThanOrEqual(0);
    expect(popup!.x + popup!.width).toBeLessThanOrEqual(width);
    expect(popup!.y).toBeGreaterThanOrEqual(0);
    expect(popup!.y + popup!.height).toBeLessThanOrEqual(900);
    await page.keyboard.press("Escape");
    await expect(tooltip).toHaveCount(0);
    await expect(hint).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(tooltip).toBeVisible();
    await field.click();
    await expect(tooltip).toHaveCount(0);
    await expect(field).toBeFocused();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Feldhinweis: Aliase (EN)", exact: true }).tap();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await page.screenshot({ path: "artifacts/ui-ux-review/field-hint-mobile.png" });
});

test("native validation preserves field help and English help buttons remain discoverable", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("ocrcraft-locale", "en"));
  await page.goto("/exercises/new");
  const field = page.getByRole("textbox", { name: "Aliase (DE)", exact: true });
  const original = await field.getAttribute("aria-describedby");
  await field.evaluate((element: HTMLInputElement) => {
    element.required = true;
    element.value = "";
    element.dispatchEvent(new Event("invalid", { bubbles: false, cancelable: true }));
  });
  await expect(field).toHaveAttribute("aria-invalid", "true");
  const ids = (await field.getAttribute("aria-describedby"))!.split(" ");
  expect(ids).toContain(original);
  await expect(page.locator(`[id="${ids.at(-1)}"]`)).toHaveAttribute("role", "alert");
  await field.fill("Beispiel");
  await expect(field).not.toHaveAttribute("aria-invalid");
  await expect(field).toHaveAttribute("aria-describedby", original!);
  const hint = page.getByRole("button", { name: "Field help: Aliase (DE)", exact: true });
  await hint.focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("tooltip")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(hint).toBeFocused();
});

test("admin sections use links with one current destination and preserve browser back", async ({ page }) => {
  await page.goto("/admin?tab=overview");
  const navigation = page.getByRole("navigation", { name: "Administrationsbereiche", exact: true });
  await expect(navigation.getByRole("link")).toHaveCount(9);
  await expect(navigation.getByRole("tab")).toHaveCount(0);
  await expect(page.getByRole("tablist")).toHaveCount(0);
  await expect(navigation.locator('[aria-current="page"]')).toHaveCount(1);
  await navigation.getByRole("link", { name: "Einstellungen", exact: true }).click();
  await expect(page).toHaveURL(/tab=settings/);
  await expect(navigation.getByRole("link", { name: "Einstellungen", exact: true })).toHaveAttribute("aria-current", "page");
  await page.goBack();
  await expect(navigation.getByRole("link", { name: "Übersicht", exact: true })).toHaveAttribute("aria-current", "page");
  await page.setViewportSize({ width: 390, height: 844 });
  await navigation.getByRole("link", { name: "Outdoor-Varianten", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/outdoor-variants$/);
  await page.goBack();
  await expect(navigation).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
