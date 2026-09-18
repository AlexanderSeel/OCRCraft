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

describe("training draft request equipment, obstacles, groups and location", () => {
  it("defaults omitted inventory, rotation groups and location safely", () => {
    const parsed = trainingDraftRequestSchema.parse(request);
    expect(parsed.availableEquipment).toEqual([]);
    expect(parsed.availableObstacleExerciseIds).toBeUndefined();
    expect(parsed.groupSplitCount).toBeUndefined();
    expect(parsed.location).toBe("mixed");
  });

  it("accepts a valid group id and rejects malformed group ids", () => {
    expect(trainingDraftRequestSchema.safeParse({
      ...request,
      groupId: "11111111-1111-4111-8111-111111111111",
    }).success).toBe(true);
    expect(trainingDraftRequestSchema.safeParse({
      ...request,
      groupId: "group-kids",
    }).success).toBe(false);
  });

  it("accepts explicit indoor/outdoor location and rejects unknown values", () => {
    expect(trainingDraftRequestSchema.safeParse({ ...request, location: "indoor" }).success).toBe(true);
    expect(trainingDraftRequestSchema.safeParse({ ...request, location: "outdoor" }).success).toBe(true);
    expect(trainingDraftRequestSchema.safeParse({ ...request, location: "parking-lot" }).success).toBe(false);
  });

  it("accepts solo rotation groups and rejects impossible or team-mode splits", () => {
    expect(trainingDraftRequestSchema.safeParse({
      ...request,
      organizationMode: "solo",
      groupSplitCount: 4,
    }).success).toBe(true);

    expect(trainingDraftRequestSchema.safeParse({
      ...request,
      organizationMode: "solo",
      groupSplitCount: 17,
    }).success).toBe(false);

    expect(trainingDraftRequestSchema.safeParse({
      ...request,
      organizationMode: "team",
      teamSize: 4,
      groupSplitCount: 4,
    }).success).toBe(false);
  });

  it("requires partner workouts to use exact pairs", () => {
    expect(trainingDraftRequestSchema.safeParse({
      ...request,
      formats: ["partner"],
      organizationMode: "team",
      teamSize: 2,
    }).success).toBe(true);

    expect(trainingDraftRequestSchema.safeParse({
      ...request,
      formats: ["partner"],
      organizationMode: "solo",
    }).success).toBe(false);

    expect(trainingDraftRequestSchema.safeParse({
      ...request,
      formats: ["partner"],
      organizationMode: "team",
      teamSize: 4,
    }).success).toBe(false);
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

  it("treats an empty obstacle inventory as an explicit valid constraint", () => {
    const parsed = trainingDraftRequestSchema.parse({
      ...request,
      availableObstacleExerciseIds: [],
    });
    expect(parsed.availableObstacleExerciseIds).toEqual([]);
  });

  it("accepts unique obstacle exercise ids and rejects duplicates or invalid ids", () => {
    const wall = "11111111-1111-4111-8111-111111111111";
    const rig = "22222222-2222-4222-8222-222222222222";

    expect(trainingDraftRequestSchema.safeParse({
      ...request,
      availableObstacleExerciseIds: [wall, rig],
    }).success).toBe(true);

    expect(trainingDraftRequestSchema.safeParse({
      ...request,
      availableObstacleExerciseIds: [wall, wall],
    }).success).toBe(false);

    expect(trainingDraftRequestSchema.safeParse({
      ...request,
      availableObstacleExerciseIds: ["wall"],
    }).success).toBe(false);
  });
});
