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

test("mobile layout stays within the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["/", "/training", "/quick-create", "/exercises"] as const) {
    await assertPageShell(page, route);
  }
});
