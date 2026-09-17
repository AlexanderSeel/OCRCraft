import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("http://localhost:3000/exercises", { waitUntil: "networkidle" });
  await mkdir(".next/muscle-map-review", { recursive: true });
  for (const [mode, label] of [["list", "Liste"], ["small", "Klein"], ["medium", "Mittel"], ["large", "Groß"], ["detail", "Detail"]]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await page.waitForFunction(value => document.querySelector(".overview-layout")?.getAttribute("data-view") === value, mode);
    await page.screenshot({ path: `.next/muscle-map-review/overview-${mode}.png` });
  }
  await page.getByRole("button", { name: "Liste", exact: true }).click();
  await page.reload({ waitUntil: "networkidle" });
  if (await page.locator(".overview-layout").getAttribute("data-view") !== "list") throw new Error("Overview view was not retained");
  const edit = await page.locator('a[href$="/edit"]').first().getAttribute("href");
  if (!edit) throw new Error("No exercise edit link");
  await page.goto(`http://localhost:3000${edit}`, { waitUntil: "networkidle" });
  const map = page.getByRole("img", { name: "Detaillierte anatomische Vorder- und Rückansicht zur Auswahl von Muskelgruppen" });
  await map.scrollIntoViewIfNeeded();
  const desktopMap = await map.boundingBox();
  const desktopTree = await page.locator(".muscle-tree").boundingBox();
  if (!desktopMap || !desktopTree || desktopTree.x < desktopMap.x + desktopMap.width) throw new Error("Map and selection are not side by side");
  await page.screenshot({ path: ".next/muscle-map-review/desktop.png" });
  await page.getByRole("searchbox", { name: "Muskel suchen" }).fill("Bizeps");
  const detail = page.getByRole("checkbox", { name: "Bizeps · rechts", exact: true });
  await detail.check();
  await page.getByRole("searchbox", { name: "Muskel suchen" }).fill("");
  if (!(await page.locator('input[type="hidden"][value="detail:biceps-right"]').count())) throw new Error("Detail was not added to form");
  await page.getByRole("button", { name: "24 Hauptbereiche", exact: true }).click();
  if (!(await page.locator('input[type="hidden"][value="detail:biceps-right"]').count())) throw new Error("Switching precision lost detail selection");
  await page.setViewportSize({ width: 390, height: 844 });
  await map.scrollIntoViewIfNeeded();
  const rect = await map.boundingBox();
  if (!rect || rect.width > 390 || Math.abs(rect.width / rect.height - 376 / 504) > 0.01) throw new Error("Map does not preserve its responsive reference ratio");
  await page.screenshot({ path: ".next/muscle-map-review/mobile.png" });
  if (errors.length) throw new Error(errors.join("\n"));
  console.log("Desktop/mobile map and detail form selection passed.");
} finally { await browser.close(); }
