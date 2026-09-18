import { describe, expect, it } from "vitest";
import { assessYouthSafetyProfileCompatibility } from "./youth-safety-profile";

describe("youth safety profile compatibility", () => {
  const profile = { audience: "kids" as const, minAge: 7, maxAge: 11 };

  it("accepts a group fully contained in the profile range", () => {
    expect(assessYouthSafetyProfileCompatibility(
      { audience: "kids", minAge: 8, maxAge: 10 },
      profile,
    )).toEqual({ compatible: true });
  });

  it("rejects target-group mismatches and incomplete age ranges", () => {
    expect(assessYouthSafetyProfileCompatibility(
      { audience: "youth", minAge: 8, maxAge: 10 },
      profile,
    )).toEqual({ compatible: false, reason: "audience" });
    expect(assessYouthSafetyProfileCompatibility(
      { audience: "kids", minAge: null, maxAge: 10 },
      profile,
    )).toEqual({ compatible: false, reason: "missing-age-range" });
  });

  it("rejects groups extending outside the configured age range", () => {
    expect(assessYouthSafetyProfileCompatibility(
      { audience: "kids", minAge: 6, maxAge: 10 },
      profile,
    )).toEqual({ compatible: false, reason: "age-range" });
  });
});
