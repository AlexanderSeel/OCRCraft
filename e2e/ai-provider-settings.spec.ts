import { expect, test } from "@playwright/test";

test("AI instance can be saved, activated and deactivated with its assignments intact", async ({ page }) => {
  // Local adapter needs no secret and this test never contacts a provider.
  const name = `Activation regression ${Date.now()}`;
  await page.goto("/admin?tab=settings");
  await page.getByRole("button", { name: "+ AI hinzufügen", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByRole("combobox", { name: "Provider", exact: true }).selectOption("openai-compatible");
  await dialog.getByRole("textbox", { name: "Anzeigename", exact: true }).fill(name);
  await dialog.getByRole("textbox", { name: "Base URL", exact: true }).fill("http://127.0.0.1:11434/v1");
  await dialog.getByLabel(/^Textmodell/).fill("test-model");
  await dialog.getByRole("checkbox", { name: "Trainingsgenerierung", exact: true }).check();
  await dialog.getByRole("checkbox", { name: "AI-Instanz aktivieren", exact: true }).uncheck();
  await dialog.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(page).toHaveURL(/aiSaved=/);
  await page.reload();
  const row = page.getByRole("row").filter({ hasText: name });
  await expect(row).toContainText("Inaktiv");
  await expect(row).toContainText("Trainingsgenerierung");
  for (const enabled of [true, false, true, false]) {
    await row.getByRole("button", { name: "Bearbeiten", exact: true }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByRole("checkbox", { name: "AI-Instanz aktivieren", exact: true }).setChecked(enabled);
    const saved = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname === "/admin");
    await dialog.getByRole("button", { name: "Speichern", exact: true }).click();
    await (await saved).finished();
    await expect(page.getByText("AI-Konfiguration wurde gespeichert.", { exact: true })).toBeVisible();
    await expect(page).not.toHaveURL(/aiError=/);
    await page.reload();
    await expect(row).toContainText(enabled ? "Bereit" : "Inaktiv");
    await expect(row).toContainText("Trainingsgenerierung");
    await expect(row).toContainText("test-model");
  }
  await row.getByRole("button", { name: "Bearbeiten", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByRole("checkbox", { name: "AI-Instanz aktivieren", exact: true }).check();
  await dialog.getByLabel(/^Textmodell/).fill("");
  await dialog.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(page).toHaveURL(/aiError=/);
  await page.reload();
  await expect(row).toContainText("Inaktiv");
  await expect(row).toContainText("test-model");
  await expect(row).toContainText("Trainingsgenerierung");
});
