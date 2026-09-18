import { describe, expect, it } from "vitest";
import { TEAM_COMPETITION_STYLES, getTeamCompetitionStyle } from "./team-competition-catalog";

describe("team competition catalog", () => {
  it("provides distinct, internally consistent OCRCraft competition styles", () => {
    expect(TEAM_COMPETITION_STYLES.length).toBeGreaterThanOrEqual(5);
    expect(new Set(TEAM_COMPETITION_STYLES.map((style) => style.key)).size).toBe(TEAM_COMPETITION_STYLES.length);
    for (const style of TEAM_COMPETITION_STYLES) {
      expect(style.formats).toContain("team-competition");
      expect(style.mainPartTitlesDe).toHaveLength(style.mainPartExerciseCounts.length);
      expect(style.mainPartProgramming).toHaveLength(style.mainPartExerciseCounts.length);
      expect(style.teamSize).toBeGreaterThanOrEqual(2);
    }
  });

  it("models the requested three-person strength/speed/skill competition", () => {
    const style = getTeamCompetitionStyle("triad-specialists");
    expect(style?.teamSize).toBe(3);
    expect(style?.mainPartTitlesDe).toEqual([
      "Komplex 1 · Kraft",
      "Komplex 2 · Schnelligkeit",
      "Komplex 3 · Technik",
      "Team-Finisher · gemeinsam",
    ]);
  });
});
