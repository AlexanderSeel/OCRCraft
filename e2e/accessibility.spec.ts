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
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toBeVisible();
    expect(await collectBasicAccessibilityIssues(page)).toEqual([]);
  });
}

test("skip link is the first keyboard stop and moves focus to main", async ({ page }) => {
  await page.goto("/exercises", { waitUntil: "domcontentloaded" });
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Zum Hauptinhalt springen" });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("quick create audience selection works with keyboard only", async ({ page }) => {
  await page.goto("/quick-create", { waitUntil: "domcontentloaded" });
  const kids = page.getByRole("button", { name: /^Kids/ });
  const youth = page.getByRole("button", { name: /^Jugend/ });
  await kids.waitFor();

  await kids.focus();
  await page.keyboard.press("Enter");
  await expect(kids).toHaveAttribute("aria-pressed", "true");

  await page.keyboard.press("Tab");
  await expect(youth).toBeFocused();
  await page.keyboard.press("Space");
  await expect(youth).toHaveAttribute("aria-pressed", "true");
});

test("theme can be changed by keyboard and persists after reload", async ({ page }) => {
  await page.goto("/admin?tab=settings", { waitUntil: "domcontentloaded" });
  const theme = page.getByRole("combobox", { name: "Darstellung" });
  await theme.waitFor();
  await page.waitForFunction(() => document.documentElement.dataset.themePreference !== undefined);
  await theme.focus();

  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme-preference", "dark");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("exercise filter dialog closes with Escape and returns focus to its trigger", async ({ page }) => {
  await page.goto("/exercises", { waitUntil: "domcontentloaded" });
  const trigger = page.getByRole("button", { name: /^Muskelgruppen/ });
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "Muskelgruppen" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Dialog schließen" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("language switcher changes global navigation and persists after reload", async ({ page }) => {
  await page.goto("/training", { waitUntil: "domcontentloaded" });
  const language = page.getByRole("combobox", { name: "Sprache" });
  await language.selectOption("en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("link", { name: "Dashboard" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Exercises" }).first()).toBeVisible();

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("combobox", { name: "Language" })).toHaveValue("en");
});

async function openTutorial(page: Page, route: string, title: string) {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  const trigger = page.locator("[data-tour-trigger='guided-help']");
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveAttribute("data-tour-ready", "true");
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: title });
  await expect(dialog).toBeVisible();
  return { dialog, trigger };
}

test("exercise-create tutorial advances, focuses targets and restores focus after Escape", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("ocrcraft-locale", "de"));
  const { dialog, trigger } = await openTutorial(page, "/exercises/new", "Übung erstellen");
  await expect(dialog.getByText("Grunddaten")).toBeVisible();
  await expect(page.locator("[data-tour='exercise-identity'][data-tour-active='true']")).toBeVisible();

  await dialog.getByRole("button", { name: "Weiter" }).click();
  await expect(dialog.getByText("Vollständiger Editor")).toBeVisible();
  await expect(page.locator("main[data-tour-active='true']")).toBeVisible();

  await dialog.getByRole("button", { name: "Weiter" }).click();
  await expect(dialog.getByText("Speichern und prüfen")).toBeVisible();
  await expect(page.locator("[data-tour='exercise-save'][data-tour-active='true']")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.locator("[data-tour-active='true']")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("obstacle tutorial reaches navigation, workspace and assignment target", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("ocrcraft-locale", "de"));
  const { dialog } = await openTutorial(page, "/obstacles", "Hindernis erstellen / zuordnen");

  await expect(dialog.getByText("Bestehende Übung verwenden")).toBeVisible();
  await dialog.getByRole("button", { name: "Weiter" }).click();
  await expect(dialog.getByText("Kandidaten eingrenzen")).toBeVisible();

  await dialog.getByRole("button", { name: "Weiter" }).click();
  await expect(dialog.getByText("Kandidat prüfen")).toBeVisible();
});

test("training tutorials work in Quick Create and Builder", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("ocrcraft-locale", "de"));
  const first = await openTutorial(page, "/quick-create", "Quick Create Training");
  await expect(first.dialog.getByText("Gruppe, Alter und Dauer")).toBeVisible();
  await first.dialog.getByRole("button", { name: "Weiter" }).click();
  await expect(first.dialog.getByText("Ziele und Körperregionen")).toBeVisible();
  await page.keyboard.press("Escape");

  await page.goto("/training/builder", { waitUntil: "domcontentloaded" });
  const trigger = page.locator("[data-tour-trigger='guided-help']");
  await expect(trigger).toHaveAttribute("data-tour-ready", "true");
  await trigger.click();
  const builder = page.getByRole("dialog", { name: "Training Builder" });
  await expect(builder.getByText("Rahmen festlegen")).toBeVisible();
});

test("tutorial supports English, reduced motion and mobile viewport", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => window.localStorage.setItem("ocrcraft-locale", "en"));

  const { dialog, trigger } = await openTutorial(page, "/exercises/new", "Create an exercise");
  await expect(dialog.getByText("Core data")).toBeVisible();
  await expect(page.locator("[data-tour='exercise-identity'][data-tour-active='true']")).toBeVisible();
  await expect(dialog).toBeInViewport();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("help center tutorial explains its workspace and glossary sections", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("ocrcraft-locale", "de"));
  const { dialog } = await openTutorial(page, "/help", "Hilfezentrum");

  await expect(page.locator("[data-tour='help-reopen'][data-tour-active='true']")).toBeVisible();
  await dialog.getByRole("button", { name: "Weiter" }).click();
  await expect(page.locator("[data-tour='help-workspaces'][data-tour-active='true']")).toBeVisible();
  await dialog.getByRole("button", { name: "Weiter" }).click();
  await expect(page.locator("[data-tour='help-glossary'][data-tour-active='true']")).toBeVisible();
});

test("media tutorial covers filters, batch actions and review cards", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("ocrcraft-locale", "de"));
  const { dialog } = await openTutorial(page, "/media", "Medienreview");

  await expect(page.locator("[data-tour='media-filters'][data-tour-active='true']")).toBeVisible();
  await dialog.getByRole("button", { name: "Weiter" }).click();
  await expect(page.locator("[data-tour='media-batch'][data-tour-active='true']")).toBeVisible();
  await dialog.getByRole("button", { name: "Weiter" }).click();
  await expect(page.locator("[data-tour='media-review'][data-tour-active='true']")).toBeVisible();
});

test("outdoor tutorial covers audit, enrichment and candidate review", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("ocrcraft-locale", "de"));
  const { dialog } = await openTutorial(page, "/admin/outdoor-variants", "Outdoor-Varianten");

  await expect(page.locator("[data-tour='outdoor-audit'][data-tour-active='true']")).toBeVisible();
  await dialog.getByRole("button", { name: "Weiter" }).click();
  await expect(page.locator("[data-tour='outdoor-enrichment'][data-tour-active='true']")).toBeVisible();
  await dialog.getByRole("button", { name: "Weiter" }).click();
  await expect(page.locator("[data-tour='outdoor-candidates'][data-tour-active='true']")).toBeVisible();
});

test("AI draft tutorial separates proposal, review and approval", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("ocrcraft-locale", "de"));
  const { dialog } = await openTutorial(page, "/exercises/ai-drafts", "AI-Entwürfe prüfen");

  await expect(page.locator("[data-tour='ai-draft-create'][data-tour-active='true']")).toBeVisible();
  await dialog.getByRole("button", { name: "Weiter" }).click();
  await expect(page.locator("[data-tour='ai-draft-review'][data-tour-active='true']")).toBeVisible();
  await dialog.getByRole("button", { name: "Weiter" }).click();
  await expect(page.locator("[data-tour='ai-draft-filters'][data-tour-active='true']")).toBeVisible();
});
