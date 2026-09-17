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

describe("training draft request equipment inventory and location", () => {
  it("defaults omitted inventory and location safely", () => {
    const parsed = trainingDraftRequestSchema.parse(request);
    expect(parsed.availableEquipment).toEqual([]);
    expect(parsed.location).toBe("mixed");
  });

  it("accepts explicit indoor/outdoor location and rejects unknown values", () => {
    expect(trainingDraftRequestSchema.safeParse({ ...request, location: "indoor" }).success).toBe(true);
    expect(trainingDraftRequestSchema.safeParse({ ...request, location: "outdoor" }).success).toBe(true);
    expect(trainingDraftRequestSchema.safeParse({ ...request, location: "parking-lot" }).success).toBe(false);
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
