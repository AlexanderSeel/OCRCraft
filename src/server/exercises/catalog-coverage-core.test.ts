import { describe, expect, it } from "vitest";
import { buildCatalogCoverageReport } from "./catalog-coverage-core";

describe("catalog coverage", () => {
  it("scopes club obstacle coverage to club records and reports missing examples", () => {
    const report = buildCatalogCoverageReport([
      { id: "1", name: "Run", hasGerman: true, hasEnglish: true, hasPhase: true, hasRiskAndAge: true, hasGoal: true, hasEquipment: false, hasBodyRegion: true, hasOcrCapability: false, isClubObstacle: false, hasClubGuidance: false },
      { id: "2", name: "Irish Table", hasGerman: true, hasEnglish: true, hasPhase: true, hasRiskAndAge: true, hasGoal: true, hasEquipment: true, hasBodyRegion: true, hasOcrCapability: true, isClubObstacle: true, hasClubGuidance: true },
      { id: "3", name: "Weaver", hasGerman: false, hasEnglish: true, hasPhase: true, hasRiskAndAge: false, hasGoal: true, hasEquipment: true, hasBodyRegion: false, hasOcrCapability: true, isClubObstacle: true, hasClubGuidance: false },
    ]);

    expect(report.totalExercises).toBe(3);
    expect(report.dimensions.find((item) => item.key === "club-obstacle")).toMatchObject({ total: 2, covered: 1, missing: 1, percent: 50, examples: ["Weaver"] });
    expect(report.dimensions.find((item) => item.key === "language-de")).toMatchObject({ total: 3, covered: 2, missing: 1, examples: ["Weaver"] });
  });
});
