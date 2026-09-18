import { describe, expect, it } from "vitest";
import { trainingDraftPersistenceSchema } from "./training-draft-persistence-schema";

const GROUP_A = "11111111-1111-4111-8111-111111111111";
const GROUP_B = "22222222-2222-4222-8222-222222222222";

function request(groupId?: string) {
  return {
    ...(groupId ? { groupId } : {}),
    audience: "adults",
    participantCount: 12,
    durationMinutes: 60,
    goals: ["OCR-Technik"],
    bodyRegions: [],
    formats: ["circuit"],
    intensity: "balanced",
    preferredExerciseIds: [],
  };
}

describe("training draft persistence group binding", () => {
  it("accepts an ungrouped draft or the exact validated group", () => {
    expect(trainingDraftPersistenceSchema.safeParse({
      request: request(),
    }).success).toBe(true);

    expect(trainingDraftPersistenceSchema.safeParse({
      request: request(GROUP_A),
      groupId: GROUP_A,
    }).success).toBe(true);
  });

  it("rejects missing or different persisted group ids", () => {
    expect(trainingDraftPersistenceSchema.safeParse({
      request: request(GROUP_A),
    }).success).toBe(false);

    expect(trainingDraftPersistenceSchema.safeParse({
      request: request(),
      groupId: GROUP_A,
    }).success).toBe(false);

    expect(trainingDraftPersistenceSchema.safeParse({
      request: request(GROUP_A),
      groupId: GROUP_B,
    }).success).toBe(false);
  });
});
