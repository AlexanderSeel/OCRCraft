import { describe, expect, it } from "vitest";
import { reviewedAiTrainingPersistenceSchema } from "./reviewed-training-draft-schema";

function item(exerciseId: string, mainPartIndex?: number) {
  return {
    exerciseId,
    durationMinutes: 3,
    ...(mainPartIndex == null ? {} : { mainPartIndex, mainPartTitle: `Hauptteil ${mainPartIndex}` }),
  };
}

const base = {
  request: {
    audience: "adults",
    participantCount: 12,
    durationMinutes: 60,
    goals: ["OCR-Technik"],
    bodyRegions: [],
    avoidBodyRegions: [],
    exerciseTypes: [],
    formats: ["circuit"],
    location: "mixed",
    intensity: "balanced",
    builderMode: "ai",
    warmupExerciseCount: 1,
    mainExerciseCount: 2,
    mainPartExerciseCounts: [2, 3],
    cooldownExerciseCount: 1,
    mainPartCount: 2,
    organizationMode: "solo",
    sourceTrainingIds: [],
    preferredExerciseIds: [],
    availableEquipment: [],
    locale: "de",
  },
  reviewed: {
    phases: [
      { kind: "warmup", items: [item("warmup-1")] },
      {
        kind: "main",
        items: [
          item("main-1", 1),
          item("main-2", 1),
          item("main-3", 2),
          item("main-4", 2),
          item("main-5", 2),
        ],
      },
      { kind: "cooldown", items: [item("cooldown-1")] },
    ],
  },
};

describe("reviewed AI persistence main-part counts", () => {
  it("accepts different requested exercise counts per main part", () => {
    expect(reviewedAiTrainingPersistenceSchema.safeParse(base).success).toBe(true);
  });

  it("requires the persisted group to match the group whose rules were validated", () => {
    const groupId = "11111111-1111-4111-8111-111111111111";
    expect(reviewedAiTrainingPersistenceSchema.safeParse({
      ...base,
      groupId,
      request: { ...base.request, groupId },
    }).success).toBe(true);

    expect(reviewedAiTrainingPersistenceSchema.safeParse({
      ...base,
      groupId: "22222222-2222-4222-8222-222222222222",
      request: { ...base.request, groupId },
    }).success).toBe(false);
  });

  it("rejects a reviewed selection whose per-part distribution is wrong even when the total matches", () => {
    const invalid = {
      ...base,
      reviewed: {
        phases: [
          base.reviewed.phases[0],
          {
            kind: "main",
            items: [
              item("main-1", 1),
              item("main-2", 1),
              item("main-3", 1),
              item("main-4", 2),
              item("main-5", 2),
            ],
          },
          base.reviewed.phases[2],
        ],
      },
    };

    const result = reviewedAiTrainingPersistenceSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message.includes("Hauptteil 1 muss 2 Übungen"))).toBe(true);
      expect(result.error.issues.some((issue) => issue.message.includes("Hauptteil 2 muss 3 Übungen"))).toBe(true);
    }
  });
});
