import { describe, expect, it } from "vitest";
import {
  normalizeTrainingDraftRequest,
  parseAgeRange,
} from "./quick-create-draft-client";

describe("parseAgeRange", () => {
  it("parses open-ended ages", () => {
    expect(parseAgeRange("16+")).toEqual({ minAge: 16 });
  });

  it("parses common age ranges regardless of separator", () => {
    expect(parseAgeRange("8-12")).toEqual({ minAge: 8, maxAge: 12 });
    expect(parseAgeRange("12–8 Jahre")).toEqual({ minAge: 8, maxAge: 12 });
  });

  it("treats one exact age as both minimum and maximum", () => {
    expect(parseAgeRange("10 Jahre")).toEqual({ minAge: 10, maxAge: 10 });
  });

  it("leaves non-numeric free text unconstrained", () => {
    expect(parseAgeRange("Erwachsene")).toEqual({});
  });
});

describe("normalizeTrainingDraftRequest", () => {
  it("keeps supported values and filters unknown client values", () => {
    expect(
      normalizeTrainingDraftRequest({
        groupType: "kids",
        ageRange: "8-12",
        participantCount: 14,
        durationMinutes: 60,
        goals: ["OCR-Technik"],
        bodyRegions: ["core", "not-a-region"],
        formats: ["rig-run", "not-a-format"],
        intensity: "technique",
        preferredExerciseIds: ["exercise-1"],
      }),
    ).toEqual({
      audience: "kids",
      participantCount: 14,
      durationMinutes: 60,
      goals: ["OCR-Technik"],
      bodyRegions: ["core"],
      formats: ["rig-run"],
      intensity: "technique",
      preferredExerciseIds: ["exercise-1"],
      minAge: 8,
      maxAge: 12,
      locale: "de",
    });
  });

  it("falls back to safe audience and intensity values", () => {
    const request = normalizeTrainingDraftRequest({
      groupType: "unknown",
      ageRange: "Erwachsene",
      participantCount: 10,
      durationMinutes: 45,
      goals: ["Ganzkörper"],
      bodyRegions: [],
      formats: ["circuit"],
      intensity: "unknown",
      preferredExerciseIds: [],
    });

    expect(request.audience).toBe("mixed");
    expect(request.intensity).toBe("balanced");
    expect(request.minAge).toBeUndefined();
    expect(request.maxAge).toBeUndefined();
  });
});
