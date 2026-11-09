import { expect, test } from "@playwright/test";

test("all catalog filters start collapsed on mobile and count applied criteria", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const cases = [
    ["/exercises?q=carry&status=archived&size=40&page=2", 2],
    ["/games?q=team&status=archived&size=80&page=2", 2],
    ["/groups?q=kids&audience=kids&size=80&page=2", 2],
    ["/obstacles?q=wall&risk=low&status=archived", 3],
    ["/media?q=cargo&review=pending&type=video&source=external_reference", 4],
    ["/training?q=test&status=ready", 2],
    ["/training/templates?audience=kids&focus=mobility", 2],
    ["/exercises/ai-drafts?q=carry&history=1", 1],
    ["/admin/outdoor-variants?q=bench&status=review", 2],
  ] as const;
  for (const [route, count] of cases) {
    await page.goto(route);
    const panel = page.getByTestId("filter-side-panel");
    const toggle = panel.getByRole("button", { name: /Filter (öffnen|schließen)/ });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(panel.getByText(`${count} aktive Filter`, { exact: true })).toBeVisible();
    const controls = await toggle.getAttribute("aria-controls");
    expect(controls).toBeTruthy();
    await expect(page.locator(`[id="${controls}"]`)).toBeHidden();
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(`[id="${controls}"]`)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test("mobile exercise pagination remains reachable and preserves explicit page size", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/exercises");
  const panel = page.getByTestId("filter-side-panel");
  await panel.getByRole("button", { name: /Filter öffnen/ }).click();
  await expect(panel.getByRole("combobox", { name: "Pro Seite", exact: true })).toHaveValue("20");
  await panel.getByRole("textbox", { name: "Suchen", exact: true }).focus();
  for (let step = 0; step < 5; step += 1) await page.keyboard.press("Tab");
  const submit = panel.getByRole("button", { name: "Filtern", exact: true });
  await expect(submit).toBeFocused();
  const focusedBounds = await submit.boundingBox();
  const paginationBounds = await page.getByRole("navigation", { name: "Seitennavigation Übungen", exact: true }).boundingBox();
  expect(focusedBounds!.y + focusedBounds!.height).toBeLessThanOrEqual(paginationBounds!.y);
  await panel.getByRole("button", { name: /Filter schließen/ }).click();
  const pagination = page.getByRole("navigation", { name: "Seitennavigation Übungen", exact: true });
  await expect(pagination.getByRole("link", { name: "Weiter", exact: true })).toBeInViewport();
  await page.evaluate(() => window.scrollTo(0, 1600));
  await expect(pagination.getByRole("link", { name: "Weiter", exact: true })).toBeInViewport();
  await pagination.getByRole("link", { name: "Weiter", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(pagination.getByText(/Seite 2 von/)).toBeVisible();
  await page.goto("/exercises?size=40&page=2");
  await expect(panel.getByText("0 aktive Filter", { exact: true })).toBeVisible();
  await pagination.getByRole("link", { name: "Weiter", exact: true }).click();
  await expect(page).toHaveURL(/size=40.*page=3/);
  await panel.getByRole("button", { name: /Filter öffnen/ }).click();
  await expect(panel.getByRole("combobox", { name: "Pro Seite", exact: true })).toHaveValue("40");
  await panel.getByRole("link", { name: "Zurücksetzen", exact: true }).click();
  await expect(page).toHaveURL(/\/exercises$/);
  const close = panel.getByRole("button", { name: /Filter schließen/ });
  if (await close.isVisible()) await close.click();
  await page.screenshot({ path: "artifacts/ui-ux-review/mobile-catalog-filters.png" });
});

test("filter edits survive closing and resizing and controls support English", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("ocrcraft-locale", "en"));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/games");
  const panel = page.getByTestId("filter-side-panel");
  await expect(panel.getByText("0 active filters", { exact: true })).toBeVisible();
  const open = panel.getByRole("button", { name: /Show filters/ });
  await open.focus();
  await page.keyboard.press("Enter");
  const search = panel.getByRole("textbox", { name: "Suchen", exact: true });
  await search.fill("draft search");
  await panel.getByRole("button", { name: /Hide filters/ }).click();
  await expect(search).toBeHidden();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(search).toBeVisible();
  await expect(search).toHaveValue("draft search");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(search).toBeHidden();
  await open.click();
  await expect(search).toHaveValue("draft search");
  await search.fill("no-match-ocrcraft-filter-check");
  await panel.getByRole("button", { name: "Filtern", exact: true }).click();
  await expect(page).toHaveURL(/q=no-match-ocrcraft-filter-check/);
  await expect(panel.getByText("1 active filters", { exact: true })).toBeVisible();
  await panel.getByRole("button", { name: /Show filters/ }).click();
  await panel.getByRole("link", { name: "Zurücksetzen", exact: true }).click();
  await expect(page).toHaveURL(/\/games$/);
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
