import { describe, expect, it } from "vitest";
import { getDictionaryCompletenessReport } from "./dictionary-completeness";

describe("dictionary completeness", () => {
  it("keeps every supported locale structurally aligned", () => {
    const report = getDictionaryCompletenessReport();
    expect(report.locales).toEqual(["de", "en"]);
    expect(report.keys).toBeGreaterThan(0);
    expect(report.complete).toBe(true);
    expect(report.missingByLocale.de).toEqual([]);
    expect(report.missingByLocale.en).toEqual([]);
  });
});
