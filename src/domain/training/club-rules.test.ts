import { describe, expect, it } from "vitest";
import {
  combineClubTrainingRules,
  impactAllowedByClubRules,
  riskAllowedByClubRules,
} from "./club-rules";

describe("club rule profiles", () => {
  it("uses the stricter risk limit between profile and group override", () => {
    expect(combineClubTrainingRules("competition", "low").maximumRiskLevel).toBe("low");
    expect(combineClubTrainingRules("safety-first", "high").maximumRiskLevel).toBe("medium");
  });

  it("filters risk according to the effective profile", () => {
    const standard = combineClubTrainingRules("standard", null);
    const safetyFirst = combineClubTrainingRules("safety-first", null);

    expect(riskAllowedByClubRules("high", standard)).toBe(true);
    expect(riskAllowedByClubRules("medium", safetyFirst)).toBe(true);
    expect(riskAllowedByClubRules("high", safetyFirst)).toBe(false);
  });

  it("applies the stricter reusable youth safety overlay", () => {
    const rules = combineClubTrainingRules("competition", "high", {
      name: "Kids Safety",
      audience: "kids",
      maximumRiskLevel: "medium",
      maximumImpactLevel: "low",
      supervisionRequirement: "direct",
      restrictedExerciseIds: ["rope-climb"],
      minimumParticipantAge: 7,
      maximumParticipantAge: 11,
    });

    expect(rules.maximumRiskLevel).toBe("medium");
    expect(rules.audienceSafety?.kids?.maximumImpactLevel).toBe("low");
    expect(rules.audienceSafety?.kids?.requireDirectSupervision).toBe(true);
    expect(rules.restrictedExerciseIds).toEqual(["rope-climb"]);
    expect(rules.safetyProfileName).toBe("Kids Safety");
    expect(rules.safetyProfileAudience).toBe("kids");
    expect(rules.safetyMinimumAge).toBe(7);
  });

  it("keeps audience impact limits active for kids and youth", () => {
    const kidsYouth = combineClubTrainingRules("kids-youth", null);
    expect(impactAllowedByClubRules("kids", "low", kidsYouth)).toBe(true);
    expect(impactAllowedByClubRules("kids", "high", kidsYouth)).toBe(false);
    expect(impactAllowedByClubRules("youth", "high", kidsYouth)).toBe(false);

    const competition = combineClubTrainingRules("competition", null);
    expect(impactAllowedByClubRules("kids", "high", competition)).toBe(false);
  });
});
