import { expect, test, type Page } from "@playwright/test";

const AUDIT_ROUTES = [
  "/",
  "/training",
  "/exercises",
  "/quick-create",
  "/training/builder",
  "/admin?tab=settings",
] as const;

async function collectBasicAccessibilityIssues(page: Page): Promise<readonly string[]> {
  return page.evaluate(() => {
    const issues: string[] = [];
    const describe = (element: Element) => {
      const id = element.id ? `#${element.id}` : "";
      return `${element.tagName.toLowerCase()}${id}`;
    };
    const hasAccessibleName = (element: Element) => {
      const ariaLabel = element.getAttribute("aria-label")?.trim();
      if (ariaLabel) return true;
      const labelledBy = element.getAttribute("aria-labelledby");
      if (labelledBy?.split(/\s+/).some((id) => document.getElementById(id)?.textContent?.trim())) return true;
      if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
        if (element.labels && element.labels.length > 0) return true;
        if (element instanceof HTMLInputElement && ["hidden", "submit", "button"].includes(element.type)) return true;
        if (element.getAttribute("placeholder")?.trim()) return true;
      }
      return Boolean(element.textContent?.trim());
    };

    if (document.querySelectorAll("main").length !== 1) issues.push("page must expose exactly one main landmark");
    if (document.querySelectorAll("h1").length !== 1) issues.push("page must expose exactly one h1");

    const ids = new Set<string>();
    for (const element of document.querySelectorAll("[id]")) {
      if (ids.has(element.id)) issues.push(`duplicate id: ${element.id}`);
      ids.add(element.id);
    }

    for (const image of document.querySelectorAll("img")) {
      if (!image.hasAttribute("alt")) issues.push(`${describe(image)} has no alt attribute`);
    }

    for (const element of document.querySelectorAll("input:not([type='hidden']), select, textarea, button, a[href]")) {
      if (!hasAccessibleName(element)) issues.push(`${describe(element)} has no accessible name`);
      const tabindex = element.getAttribute("tabindex");
      if (tabindex && Number(tabindex) > 0) issues.push(`${describe(element)} uses positive tabindex`);
    }

    return issues;
  });
}

for (const route of AUDIT_ROUTES) {
  test(`basic accessibility contract: ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
    expect(await collectBasicAccessibilityIssues(page)).toEqual([]);
  });
}

test("skip link is the first keyboard stop and moves focus to main", async ({ page }) => {
  await page.goto("/exercises");
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Zum Hauptinhalt springen" });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("quick create audience selection works with keyboard only", async ({ page }) => {
  await page.goto("/quick-create");
  const kids = page.getByRole("button", { name: /^Kids/ });
  const youth = page.getByRole("button", { name: /^Jugend/ });

  await kids.focus();
  await page.keyboard.press("Enter");
  await expect(kids).toHaveAttribute("aria-pressed", "true");

  await page.keyboard.press("Tab");
  await expect(youth).toBeFocused();
  await page.keyboard.press("Space");
  await expect(youth).toHaveAttribute("aria-pressed", "true");
});

test("theme can be changed by keyboard and persists after reload", async ({ page }) => {
  await page.goto("/admin?tab=settings");
  const theme = page.getByRole("combobox", { name: "Darstellung" });
  await theme.focus();

  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme-preference", "dark");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
