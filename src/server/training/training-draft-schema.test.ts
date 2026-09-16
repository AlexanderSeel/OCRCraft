import { describe, expect, it } from "vitest";
import { trainingDraftRequestSchema } from "./training-draft-schema";

const request = {
  audience: "adults",
  participantCount: 16,
  durationMinutes: 60,
  goals: ["OCR-Technik"],
  bodyRegions: [],
  formats: ["circuit"],
  intensity: "balanced",
  preferredExerciseIds: [],
};

describe("training draft request equipment inventory", () => {
  it("defaults an omitted inventory to unknown equipment quantities", () => {
    const parsed = trainingDraftRequestSchema.parse(request);
    expect(parsed.availableEquipment).toEqual([]);
  });

  it("accepts explicit zero stock and rejects duplicate or invalid stock entries", () => {
    expect(trainingDraftRequestSchema.safeParse({
      ...request,
      availableEquipment: [{ equipmentId: "rig-id", quantityAvailable: 0 }],
    }).success).toBe(true);

    expect(trainingDraftRequestSchema.safeParse({
      ...request,
      availableEquipment: [
        { equipmentId: "rig-id", quantityAvailable: 1 },
        { equipmentId: "rig-id", quantityAvailable: 2 },
      ],
    }).success).toBe(false);

    expect(trainingDraftRequestSchema.safeParse({
      ...request,
      availableEquipment: [{ equipmentId: "rig-id", quantityAvailable: -1 }],
    }).success).toBe(false);
  });
});
