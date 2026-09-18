import { describe, expect, it } from "vitest";
import {
  normalizeTrainingDraftRequest,
  parseAgeRange,
} from "./quick-create-draft-client";

describe("parseAgeRange", () => {
  it("parses open-ended ages", () => {
    expect(parseAgeRange("16+")).toEqual({ minAge: 16 });
    expect(parseAgeRange("ab 18")).toEqual({ minAge: 18 });
    expect(parseAgeRange("bis 12")).toEqual({ maxAge: 12 });
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
  it("keeps supported granular muscle regions, exercise types and builder mode while filtering unknown values", () => {
    expect(
      normalizeTrainingDraftRequest({
        groupId: "11111111-1111-4111-8111-111111111111",
        groupType: "kids",
        ageRange: "8-12",
        participantCount: 14,
        durationMinutes: 60,
        goals: ["OCR-Technik"],
        bodyRegions: ["core", "biceps", "rear-delts", "abs", "not-a-region"],
        avoidBodyRegions: ["calves", "core", "not-a-region"],
        exerciseTypes: ["skill", "obstacle", "not-a-type"],
        formats: ["rig-run", "not-a-format"],
        location: "indoor",
        intensity: "technique",
        builderMode: "ai",
        sourceTrainingIds: [
          "11111111-1111-4111-8111-111111111111",
          "11111111-1111-4111-8111-111111111111",
          "not-a-training-id",
          "22222222-2222-4222-8222-222222222222",
        ],
        preferredExerciseIds: ["exercise-1"],
        availableEquipment: [
          { equipmentId: "sandbag", quantityAvailable: 6 },
          { equipmentId: "cones", quantityAvailable: 0 },
        ],
        availableObstacleExerciseIds: [
          "33333333-3333-4333-8333-333333333333",
          "33333333-3333-4333-8333-333333333333",
          "not-an-obstacle-id",
          "44444444-4444-4444-8444-444444444444",
        ],
      }),
    ).toEqual({
      groupId: "11111111-1111-4111-8111-111111111111",
      audience: "kids",
      participantCount: 14,
      durationMinutes: 60,
      goals: ["OCR-Technik"],
      bodyRegions: ["core", "biceps", "rear-delts", "abs"],
      avoidBodyRegions: ["calves"],
      exerciseTypes: ["skill", "obstacle"],
      formats: ["rig-run"],
      location: "indoor",
      intensity: "technique",
      builderMode: "ai",
      warmupExerciseCount: 2,
      mainExerciseCount: 4,
      cooldownExerciseCount: 2,
      mainPartCount: 1,
      mainPartExerciseCounts: [4],
      mainPartProgramming: [{ mode: "standard" }],
      organizationMode: "solo",
      teamSize: undefined,
      groupSplitCount: undefined,
      sourceTrainingIds: [
        "11111111-1111-4111-8111-111111111111",
        "22222222-2222-4222-8222-222222222222",
      ],
      preferredExerciseIds: ["exercise-1"],
      availableEquipment: [
        { equipmentId: "sandbag", quantityAvailable: 6 },
        { equipmentId: "cones", quantityAvailable: 0 },
      ],
      availableObstacleExerciseIds: [
        "33333333-3333-4333-8333-333333333333",
        "44444444-4444-4444-8444-444444444444",
      ],
      minAge: 8,
      maxAge: 12,
      locale: "de",
    });
  });

  it("normalizes explicit solo rotation groups and removes them in team mode", () => {
    const base = {
      groupType: "adults",
      ageRange: "18+",
      participantCount: 20,
      durationMinutes: 60,
      goals: ["OCR-Technik"],
      bodyRegions: [],
      formats: ["circuit"],
      intensity: "balanced",
      preferredExerciseIds: [],
    };

    expect(normalizeTrainingDraftRequest({
      ...base,
      organizationMode: "solo",
      groupSplitCount: 4,
    }).groupSplitCount).toBe(4);

    expect(normalizeTrainingDraftRequest({
      ...base,
      organizationMode: "solo",
      groupSplitCount: 50,
    }).groupSplitCount).toBe(20);

    const team = normalizeTrainingDraftRequest({
      ...base,
      organizationMode: "team",
      teamSize: 5,
      groupSplitCount: 4,
    });
    expect(team.teamSize).toBe(5);
    expect(team.groupSplitCount).toBeUndefined();
  });

  it("preserves the difference between undeclared and explicitly empty obstacle inventory", () => {
    const base = {
      groupType: "adults",
      ageRange: "18+",
      participantCount: 10,
      durationMinutes: 60,
      goals: ["OCR-Technik"],
      bodyRegions: [],
      formats: ["circuit"],
      intensity: "balanced",
      preferredExerciseIds: [],
    };

    expect(normalizeTrainingDraftRequest(base).availableObstacleExerciseIds).toBeUndefined();
    expect(normalizeTrainingDraftRequest({ ...base, availableObstacleExerciseIds: [] }).availableObstacleExerciseIds).toEqual([]);
  });

  it("preserves a valid template key and drops malformed values", () => {
    const base = {
      groupType: "adults",
      ageRange: "18+",
      participantCount: 10,
      durationMinutes: 60,
      goals: ["Ganzkörper"],
      bodyRegions: [],
      formats: ["circuit"],
      intensity: "balanced",
      preferredExerciseIds: [],
    };

    expect(normalizeTrainingDraftRequest({ ...base, templateKey: "adult-ocr-base-engine" }).templateKey).toBe("adult-ocr-base-engine");
    expect(normalizeTrainingDraftRequest({ ...base, templateKey: "../bad key" }).templateKey).toBeUndefined();
  });

  it("falls back to safe audience, location, intensity and local builder values", () => {
    const request = normalizeTrainingDraftRequest({
      groupType: "unknown",
      ageRange: "Erwachsene",
      participantCount: 10,
      durationMinutes: 45,
      goals: ["Ganzkörper"],
      bodyRegions: [],
      exerciseTypes: ["not-a-type"],
      formats: ["circuit"],
      location: "unknown",
      intensity: "unknown",
      builderMode: "unknown",
      preferredExerciseIds: [],
    });

    expect(request.audience).toBe("mixed");
    expect(request.location).toBe("mixed");
    expect(request.intensity).toBe("balanced");
    expect(request.builderMode).toBe("local");
    expect(request.groupId).toBeUndefined();
    expect(request.exerciseTypes).toEqual([]);
    expect(request.sourceTrainingIds).toEqual([]);
    expect(request.minAge).toBeUndefined();
    expect(request.maxAge).toBeUndefined();
    expect(request.availableEquipment).toEqual([]);
    expect(request.availableObstacleExerciseIds).toBeUndefined();
    expect(request.groupSplitCount).toBeUndefined();
    expect(request.avoidBodyRegions).toEqual([]);
  });
});
