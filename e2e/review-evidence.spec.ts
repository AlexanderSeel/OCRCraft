import { expect, test } from "@playwright/test";

test("admin separates compatibility markers from review evidence on mobile and in English", async ({ page }, testInfo) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto("/admin?tab=overview",{waitUntil:"domcontentloaded"});
  const evidence=page.getByTestId("seed-review-evidence");
  await expect(evidence).toContainText("Versionierte Revieweinträge");
  await expect(evidence).toContainText("Kompatibilitätsmarkierungen");
  await expect(evidence).toContainText("keine fachliche Freigabe");
  const metrics=await evidence.locator("dl > div").evaluateAll((elements)=>elements.map((element)=>({label:element.querySelector("dt")?.textContent,value:element.querySelector("dd")?.textContent})));
  expect(metrics.map((metric)=>metric.label)).toEqual(["Versionierte Revieweinträge","Kompatibilitätsmarkierungen","Nachbearbeitung / unklare Nachweise","Ohne Revieweintrag"]);
  expect(metrics.every((metric)=>/^\d+$/.test(metric.value ?? ""))).toBe(true);
  expect(metrics.reduce((total,metric)=>total+Number(metric.value),0)).toBeGreaterThan(0);
  await expect(page.getByText(/^Fachreview:.*bestanden/)).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await evidence.scrollIntoViewIfNeeded();
  await page.screenshot({path:testInfo.outputPath("seed-review-evidence-mobile.png")});
  await page.getByRole("combobox",{name:"Sprache",exact:true}).selectOption("en");
  await expect(evidence).toContainText("Compatibility markers");
  await expect(evidence).toContainText("do not represent content approval");
});
