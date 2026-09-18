import { expect, test } from "@playwright/test";

const CATALOG_ROUTES = [
  "/",
  "/training",
  "/training/templates",
  "/exercises",
  "/games",
  "/obstacles",
  "/groups",
  "/media",
  "/exercises/ai-drafts",
] as const;

async function assertPageShell(page: import("@playwright/test").Page, route: string) {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await expect(page.locator("main")).toBeVisible();
  await expect(page.locator("h1")).toHaveCount(1);
  const layout = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    mainWidth: document.querySelector("main")?.getBoundingClientRect().width ?? 0,
  }));
  expect(layout.documentWidth, `${route} has horizontal overflow`).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.mainWidth, `${route} main content is not laid out`).toBeGreaterThan(0);
}

for (const route of CATALOG_ROUTES) {
  test(`layout quality gate: ${route}`, async ({ page }) => {
    await assertPageShell(page, route);
  });
}

test("catalog pages expose the shared view switcher", async ({ page }) => {
  for (const route of [
    "/training",
    "/training/templates",
    "/exercises",
    "/games",
    "/obstacles",
    "/groups",
    "/media",
    "/exercises/ai-drafts",
    "/admin/outdoor-variants",
  ] as const) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("overview-layout")).toBeVisible();
    await expect(page.getByRole("group", { name: "Übersichtsdarstellung" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Liste" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Detail" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Mittel", exact: true })).toHaveCount(0);
  }
});

test("quick create exposes template selection without relying on a URL parameter", async ({ page }) => {
  await page.goto("/quick-create", { waitUntil: "domcontentloaded" });
  await page.locator("[data-quick-create-ready='true']").waitFor();
  const selector = page.getByRole("combobox", { name: "Trainingsvorlage auswählen" });
  await expect(selector).toBeVisible();
  expect(await selector.locator("option").count()).toBeGreaterThan(1);
  await selector.selectOption({ index: 1 });
  await expect(page.getByText("Vorlage geladen")).toBeVisible();
});

test("obstacles keep assignment search outside the filter panel", async ({ page }) => {
  await page.goto("/obstacles", { waitUntil: "domcontentloaded" });
  const filterPanel = page.getByTestId("filter-side-panel");
  await expect(filterPanel).toBeVisible();
  await expect(filterPanel.getByRole("heading", { name: "Bestehende Übung als Hindernis übernehmen" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Bestehende Übung als Hindernis übernehmen" })).toBeVisible();
  const panelLayout = await filterPanel.evaluate((element) => getComputedStyle(element).width);
  expect(Number.parseFloat(panelLayout)).toBeGreaterThan(0);
});

test("games use the shared filter panel with URL-reset semantics", async ({ page }) => {
  await page.goto("/games?q=team&status=archived&size=20", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("filter-side-panel")).toBeVisible();
  await expect(page.getByRole("link", { name: "Filter zurücksetzen" })).toHaveAttribute("href", "/games");
  await expect(page.getByRole("textbox", { name: "Suchen" })).toHaveValue("team");
});

test("catalog view controls change the rendered result layout", async ({ page }) => {
  await page.goto("/games", { waitUntil: "domcontentloaded" });
  const overview = page.getByTestId("overview-layout");
  const results = page.locator(".catalog-results").first();
  await expect(results).toBeVisible();

  await page.getByRole("button", { name: "Liste" }).click();
  await expect(overview).toHaveAttribute("data-view", "list");
  const listColumns = await results.evaluate((element) => getComputedStyle(element).gridTemplateColumns);

  await page.getByRole("button", { name: "Groß" }).click();
  await expect(overview).toHaveAttribute("data-view", "large");
  const largeColumns = await results.evaluate((element) => getComputedStyle(element).gridTemplateColumns);
  expect(largeColumns).not.toBe(listColumns);
});

test("catalog templates keep detail content out of compact views", async ({ page }) => {
  await page.goto("/obstacles", { waitUntil: "domcontentloaded" });
  const overview = page.getByTestId("overview-layout");
  const detailSlots = page.locator(".catalog-card .view-detail").first();
  await expect(detailSlots).toBeAttached();

  await page.getByRole("button", { name: "Klein", exact: true }).click();
  await expect(overview).toHaveAttribute("data-view", "small");
  await expect(detailSlots).toBeHidden();

  await page.getByRole("button", { name: "Detail", exact: true }).click();
  await expect(overview).toHaveAttribute("data-view", "detail");
  await expect(detailSlots).toBeVisible();
});

test("mobile layout stays within the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["/", "/training", "/quick-create", "/exercises"] as const) {
    await assertPageShell(page, route);
  }
});
