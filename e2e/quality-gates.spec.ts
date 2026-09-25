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
    await expect(page.getByRole("button", { name: "Liste", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Detail", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Mittel", exact: true })).toHaveCount(0);
  }
});

test("quick create exposes template selection without relying on a URL parameter", async ({ page }) => {
  await page.goto("/quick-create", { waitUntil: "domcontentloaded" });
  const selector = page.getByRole("combobox", { name: "Trainingsvorlage auswählen" });
  await expect(selector).toBeVisible();
  expect(await selector.locator("option").count()).toBeGreaterThan(1);
  const firstTemplateValue = await selector.locator("option").nth(1).getAttribute("value");
  await selector.selectOption({ index: 1 });
  await expect(selector).toHaveValue(firstTemplateValue ?? "");
  await expect(page.getByRole("textbox", { name: "Alter / Bereich" })).toHaveValue("16+");
});

test("quick create carries Kids age and safety choices into the review", async ({ page }) => {
  await page.goto("/quick-create", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /^Kids/ }).click();
  await page.getByRole("textbox", { name: "Alter / Bereich" }).fill("8–12");
  await page.getByRole("button", { name: "Weiter" }).click();
  await page.getByRole("button", { name: "Weiter" }).click();
  await page.getByRole("button", { name: "Weiter" }).click();
  await expect(page.getByText("Belastungssteuerung darf konfigurierte Sicherheitsregeln nie überschreiben.")).toBeVisible();
  await page.getByRole("button", { name: "Weiter" }).click();

  await expect(page.getByRole("heading", { name: "Entwurf prüfen" })).toBeVisible();
  await expect(page.getByText("Kids · 8–12 · 16 Personen")).toBeVisible();
});

test("training builder exposes age-aware safety boundaries and team capacity", async ({ page }) => {
  await page.goto("/training/builder", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Training Builder" })).toBeVisible();

  const audience = page.getByRole("combobox", { name: "Zielgruppe" }).last();
  await audience.selectOption("kids");
  await expect(page.getByRole("textbox", { name: "Alter" }).last()).toBeVisible();
  await expect(page.getByText("Alter, Ort, Ausschlussbereiche, Risiko, Equipment, Hindernisbestand und Stationskapazität bleiben harte Grenzen.")).toBeVisible();

  await page.getByRole("combobox", { name: "Organisation im Hauptteil" }).selectOption("team");
  await expect(page.getByRole("spinbutton", { name: "Teamgröße" })).toBeVisible();
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
  await expect(page.getByRole("link", { name: "Zurücksetzen" })).toHaveAttribute("href", "/games");
  await expect(page.getByRole("textbox", { name: "Suchen" })).toHaveValue("team");
});

test("groups use URL-based search and audience filters", async ({ page }) => {
  await page.goto("/groups?q=kids&audience=kids", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("filter-side-panel")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Suchen" })).toHaveValue("kids");
  await expect(page.getByRole("combobox", { name: "Zielgruppe" })).toHaveValue("kids");
  await expect(page.getByRole("link", { name: "Zurücksetzen" })).toHaveAttribute("href", "/groups");
});

test("AI drafts use a compact URL-based search filter", async ({ page }) => {
  await page.goto("/exercises/ai-drafts?q=carry", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("filter-side-panel")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Suchen" })).toHaveValue("carry");
  await expect(page.getByRole("link", { name: "Zurücksetzen" })).toHaveAttribute("href", "/exercises/ai-drafts");
});

test("outdoor review uses shared status and search filters", async ({ page }) => {
  await page.goto("/admin/outdoor-variants?q=bench&status=review", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("filter-side-panel")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Suchen" })).toHaveValue("bench");
  await expect(page.getByRole("combobox", { name: "Status" })).toHaveValue("review");
  await expect(page.getByRole("link", { name: "Zurücksetzen" })).toHaveAttribute("href", "/admin/outdoor-variants");
});

test("media keeps filter state in the URL and exposes a compact result count", async ({ page }) => {
  await page.goto("/media?q=cargo&type=video&review=pending", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("filter-side-panel")).toBeVisible();
  await expect(page.getByTestId("filter-side-panel").getByRole("textbox", { name: "Suchen" })).toHaveValue("cargo");
  await expect(page.getByRole("combobox", { name: "Medientyp" })).toHaveValue("video");
  await expect(page.getByRole("link", { name: "Zurücksetzen" })).toHaveAttribute("href", "/media");
  await expect(page.getByText("Gefiltert", { exact: true })).toBeVisible();
});

test("training templates keep their audience and focus filters compact", async ({ page }) => {
  await page.goto("/training/templates?audience=kids&focus=mobility", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("filter-side-panel")).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Zielgruppe" })).toHaveValue("kids");
  await expect(page.getByRole("combobox", { name: "Schwerpunkt" })).toHaveValue("mobility");
  await expect(page.getByRole("link", { name: "Zurücksetzen" })).toHaveAttribute("href", "/training/templates");
});

test("catalog view controls change the rendered result layout", async ({ page }) => {
  await page.goto("/games", { waitUntil: "domcontentloaded" });
  const overview = page.getByTestId("overview-layout");
  const results = page.locator(".catalog-results").first();
  await expect(results).toBeVisible();

  await page.getByRole("button", { name: "Liste" }).click();
  await expect(overview).toHaveAttribute("data-view", "list");
  await expect(results.locator(".view-secondary").first()).toBeHidden();

  await page.getByRole("button", { name: "Groß" }).click();
  await expect(overview).toHaveAttribute("data-view", "large");
  await expect(results.locator(".view-secondary").first()).toBeVisible();
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


test("quick create generates and persists a validated training", async ({ page }) => {
  await page.goto("/quick-create", { waitUntil: "domcontentloaded" });

  for (let step = 0; step < 4; step += 1) {
    await page.getByRole("button", { name: "Weiter" }).click();
  }
  await expect(page.getByRole("heading", { name: "Entwurf prüfen" })).toBeVisible();

  const generate = page.getByRole("button", { name: "Trainingsentwurf erstellen" });
  await generate.click();
  await expect(page.getByText("Dieser Entwurf ist noch nicht gespeichert.")).toBeVisible({ timeout: 20_000 });

  const title = page.getByRole("textbox", { name: "Trainingstitel" });
  await title.fill("E2E Quick Create Training");
  const save = page.getByRole("button", { name: "Training speichern" });
  await expect(save).toBeEnabled();
  await save.click();

  await expect(page.getByText("Training gespeichert", { exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("link", { name: "Gespeicherte Trainings öffnen" })).toBeVisible();
});

test("training builder keeps real edits through generation and persistence", async ({ page }) => {
  await page.goto("/training/builder", { waitUntil: "domcontentloaded" });

  await page.getByRole("combobox", { name: "Zielgruppe" }).last().selectOption("kids");
  const age = page.getByRole("textbox", { name: "Alter" }).last();
  await age.fill("10");
  await page.getByRole("combobox", { name: "Organisation im Hauptteil" }).selectOption("team");
  await page.getByRole("spinbutton", { name: "Teamgröße" }).fill("3");

  const title = page.getByRole("textbox", { name: "Trainingstitel" });
  await title.fill("E2E Builder Kids Team");
  await page.getByRole("button", { name: "Lokal planen" }).click();

  await expect(page.getByText("Dieser Entwurf ist noch nicht gespeichert.")).toBeVisible({ timeout: 20_000 });
  const save = page.getByRole("button", { name: "Training speichern" });
  await expect(save).toBeEnabled();
  await save.click();

  await expect(page.getByRole("link", { name: "Gespeichertes Training öffnen" })).toBeVisible({ timeout: 20_000 });
});

test("Kids planning does not weaken minimum-age safety boundaries to avoid a zero-result pool", async ({ page }) => {
  await page.goto("/training/builder", { waitUntil: "domcontentloaded" });
  await page.getByRole("combobox", { name: "Zielgruppe" }).last().selectOption("kids");
  await page.getByRole("textbox", { name: "Alter" }).last().fill("5");

  await page.getByRole("button", { name: "Lokal planen" }).click();

  await expect(page.getByText("Planung fehlgeschlagen", { exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Alter, Ort, Ausschlussbereiche, Risiko, Equipment, Hindernisbestand und Stationskapazität bleiben harte Grenzen.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Training speichern" })).toBeDisabled();
});
