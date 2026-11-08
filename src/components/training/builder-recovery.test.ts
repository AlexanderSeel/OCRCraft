import { describe, expect, it } from "vitest";
import { builderRecoveryKey, builderRecoverySchema, quickPlannerRecoverySchema } from "./builder-recovery";
import { createPlanningSnapshot, readPlanningSnapshot } from "./planning-recovery";

const planner = {
  audience: "adults", participants: 10, duration: 60, goal: "Grip", bodyRegion: "core", format: "circuit",
  location: "indoor", warmupCount: 2, mainPartCounts: [3, 4], cooldownCount: 2, mainPartCount: 2,
  organizationMode: "solo", teamSize: 4, obstacleInventoryDeclared: true, availableObstacleExerciseIds: [],
};
const builder = {
  builderMode: "local", audience: "mixed", ageRange: "16+", participants: 16, duration: 75,
  goals: ["Grip"], bodyRegions: ["core"], avoidBodyRegions: [], preferredExercises: [], formats: ["circuit"],
  selectedTypes: ["strength"], sourceTrainingIds: [], competitionStyleKey: "", location: "mixed", intensity: "balanced",
  availableEquipment: {}, obstacleInventoryDeclared: true, availableObstacleExerciseIds: [],
  warmupExerciseCount: 2, mainPartExerciseCounts: [4], mainPartProgramming: [{ mode: "interval", workSeconds: 30, restSeconds: 15, rounds: 3 }],
  cooldownExerciseCount: 2, mainPartCount: 1, organizationMode: "team", teamSize: 4, title: "Recovered plan",
};
describe("builder and quick-planner recovery boundaries", () => {
  it("preserves main-part programming and explicit obstacle restrictions", () => {
    const snapshot = createPlanningSnapshot(builderRecoverySchema, builder)!;
    expect(readPlanningSnapshot(builderRecoverySchema, JSON.stringify(snapshot))?.value).toEqual(builder);
    expect(createPlanningSnapshot(quickPlannerRecoverySchema, planner)?.value.availableObstacleExerciseIds).toEqual([]);
  });
  it("rejects inconsistent main parts and invalid programming", () => {
    expect(createPlanningSnapshot(quickPlannerRecoverySchema, { ...planner, mainPartCount: 1 })).toBeNull();
    expect(createPlanningSnapshot(builderRecoverySchema, { ...builder, mainPartCount: 2 })).toBeNull();
    expect(createPlanningSnapshot(builderRecoverySchema, { ...builder, mainPartProgramming: [{ mode: "interval", workSeconds: -1 }] })).toBeNull();
  });
  it("strips generated proposals and approvals", () => {
    const snapshot = createPlanningSnapshot(builderRecoverySchema, { ...builder, draft: {}, savedId: "forged", trainerReviewed: true })!;
    expect(snapshot.value).not.toHaveProperty("draft");
    expect(snapshot.value).not.toHaveProperty("savedId");
    expect(snapshot.value).not.toHaveProperty("trainerReviewed");
  });
  it("separates new, source-based and AI-mode builder backups", () => {
    expect(new Set([builderRecoveryKey(), builderRecoveryKey("source-a"), builderRecoveryKey("source-b"), builderRecoveryKey(undefined, "ai")]).size).toBe(4);
  });
});
