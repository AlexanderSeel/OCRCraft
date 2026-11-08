import { describe, expect, it } from "vitest";
import { createQuickCreateSnapshot, readQuickCreateSnapshot } from "./quick-create-recovery";

const inputs = {
  step: 3, selectedGroupId: "", selectedTemplateKey: "", groupType: "kids", ageRange: "8–12",
  participantCount: 12, duration: 60, groupOrganizationMode: "solo", goals: ["Koordination"],
  bodyRegions: ["core"], avoidBodyRegions: [], preferredExercises: [], formats: ["circuit"],
  competitionStyleKey: "", location: "indoor", availableEquipment: {}, obstacleInventoryDeclared: true,
  availableObstacleExerciseIds: [], intensity: "technique", sessionTitle: "Kindertraining",
};
describe("Quick Create recovery boundary", () => {
  it("round-trips planning choices including an explicit empty obstacle inventory", () => {
    const snapshot = createQuickCreateSnapshot(inputs)!;
    expect(readQuickCreateSnapshot(JSON.stringify(snapshot))?.value).toEqual(inputs);
  });
  it("rejects malformed, oversized, incompatible and invalid snapshots", () => {
    expect(readQuickCreateSnapshot("{" )).toBeNull();
    expect(readQuickCreateSnapshot(" ".repeat(128001))).toBeNull();
    const snapshot = createQuickCreateSnapshot(inputs)!;
    expect(readQuickCreateSnapshot(JSON.stringify({ ...snapshot, version: 2 }))).toBeNull();
    expect(readQuickCreateSnapshot(JSON.stringify({ ...snapshot, value: { ...inputs, participantCount: -1 } }))).toBeNull();
  });
  it("does not restore approval, persisted IDs or generated proposals from local storage", () => {
    const snapshot = createQuickCreateSnapshot({ ...inputs, draft: { approved: true }, persistedId: "forged", trainerReviewed: true })!;
    expect(snapshot.value).not.toHaveProperty("draft");
    expect(snapshot.value).not.toHaveProperty("persistedId");
    expect(snapshot.value).not.toHaveProperty("trainerReviewed");
  });
});
