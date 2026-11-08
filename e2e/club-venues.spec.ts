import { expect, test } from "@playwright/test";

for (const planner of ["quick-planner", "builder", "quick-create"] as const) {
  test(`venue selection is accessible, recoverable and translated on mobile: ${planner}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(planner === "quick-create" ? "/quick-create" : "/training/builder", { waitUntil: "domcontentloaded" });
    if (planner === "quick-create") {
      await page.getByRole("button", { name: "Weiter", exact: true }).click();
      await page.getByRole("button", { name: "Weiter", exact: true }).click();
    }
    const picker = planner === "quick-planner" ? page.locator('[data-tour="builder"]').getByTestId("club-venue-picker")
      : planner === "builder" ? page.getByTestId("club-venue-picker").last() : page.getByTestId("club-venue-picker");
    const select = picker.getByRole("combobox", { name: "Vereinsgelände", exact: true });
    await select.selectOption("synthetic-court");
    await expect(picker).toContainText("keine Shuttlelänge");
    await expect(select).toHaveAttribute("aria-describedby", /help$/);
    if (planner !== "quick-create") await expect(page.getByRole("combobox", { name: "Ort", exact: true }).nth(planner === "quick-planner" ? 0 : 1)).toHaveValue("outdoor");
    await expect.poll(() => page.evaluate(() => Object.entries(localStorage).some(([key, value]) => key.includes("recovery") && value.includes('"venueId":"synthetic-court"')))).toBe(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    const recoveryId = planner === "quick-planner" ? "quick-planner-recovery" : planner === "builder" ? "builder-recovery" : "quick-create-recovery";
    await page.getByTestId(recoveryId).getByRole("button", { name: "Planung wiederherstellen", exact: true }).click();
    await expect(select).toHaveValue("synthetic-court");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await picker.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath("club-venue-mobile.png") });
    await page.getByRole("combobox", { name: "Sprache", exact: true }).selectOption("en");
    await expect(picker.getByRole("combobox", { name: "Club venue", exact: true })).toHaveValue("synthetic-court");
    await expect(picker).toContainText("no shuttle length is inferred");
  });
}

test("the local builder sends the venue to generation and keeps its warning visible", async ({ page }) => {
  await page.goto("/training/builder", { waitUntil: "domcontentloaded" });
  await page.getByRole("combobox", { name: "Vereinsgelände", exact: true }).last().selectOption("athletics-field");
  const response = page.waitForResponse((result) => result.url().endsWith("/api/training/draft") && result.request().method() === "POST");
  await page.getByRole("button", { name: "Lokal planen", exact: true }).click();
  const result = await response;
  expect(result.request().postDataJSON()).toMatchObject({ venueId: "athletics-field", location: "outdoor" });
  expect(result.ok()).toBe(true);
  const draft = await result.json();
  expect(draft.warnings.join(" ")).toContain("400-m-Laufbahn");
  await expect(page.getByText(/Laufvolumen und Laufzeit sind noch nicht automatisch nachgewiesen/).first()).toBeVisible();
  await page.getByRole("textbox", { name: "Trainingstitel", exact: true }).fill("E2E venue provenance");
  const persistedResponse = page.waitForResponse((response) => response.url().endsWith("/api/training/draft/persist") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Training speichern", exact: true }).last().click();
  const saved = await persistedResponse;
  expect(saved.ok()).toBe(true);
  const { id } = await saved.json();
  await page.goto(`/training/builder?source=${id}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("combobox", { name: "Vereinsgelände", exact: true }).last()).toHaveValue("athletics-field");
});

test("native validation removes its own error without removing field help", async ({ page }) => {
  await page.goto("/training/builder", { waitUntil: "domcontentloaded" });
  const picker = page.getByTestId("club-venue-picker").last();
  const select = picker.getByRole("combobox", { name: "Vereinsgelände", exact: true });
  await select.selectOption("synthetic-court");
  const helpId = await select.getAttribute("aria-describedby");
  expect(helpId).toBeTruthy();
  // Exercise the native validation handler on a real field with existing help.
  // The required constraint is confined to this isolated browser test.
  const invalid = await select.evaluate((element: HTMLSelectElement) => {
    element.required = true;
    element.value = "";
    const valid = element.checkValidity();
    return { valid, ariaInvalid: element.getAttribute("aria-invalid") };
  });
  expect(invalid).toEqual({ valid: false, ariaInvalid: "true" });
  await select.selectOption("synthetic-court");
  await expect(select).not.toHaveAttribute("aria-invalid", "true");
  await expect(select).toHaveAttribute("aria-describedby", helpId!);
  await expect(page.getByText("Dieses Pflichtfeld ist erforderlich.")).toHaveCount(0);
});

test("both generator modes reject a conflicting indoor venue at the API boundary", async ({ request }) => {
  for (const builderMode of ["local", "ai"]) {
    const result = await request.post("/api/training/draft", { data: {
      audience: "adults", participantCount: 8, durationMinutes: 60, goals: ["OCR-Technik"], bodyRegions: [],
      formats: ["circuit"], intensity: "balanced", preferredExerciseIds: [], location: "indoor", venueId: "synthetic-court", builderMode,
    } });
    expect(result.status()).toBe(400);
    expect((await result.json()).issues.fieldErrors).toHaveProperty("venueId");
  }
});
