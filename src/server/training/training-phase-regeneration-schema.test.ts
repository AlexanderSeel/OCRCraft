import { describe, expect, it } from "vitest";
import { trainingPhaseRegenerationSchema } from "./training-phase-regeneration-schema";

const request = {
  audience: "adults",
  participantCount: 12,
  durationMinutes: 60,
  goals: ["Kraftausdauer"],
  bodyRegions: ["core"],
  avoidBodyRegions: [],
  exerciseTypes: ["strength"],
  formats: ["circuit"],
  location: "indoor",
  intensity: "balanced",
  builderMode: "local",
  preferredExerciseIds: [],
  availableEquipment: [],
  minAge: 18,
  locale: "de",
};

const current = {
  title: "Test Training",
  phases: [
    { kind: "warmup", items: [{ exerciseId: "warm-1", durationMinutes: 9, format: "free" }] },
    { kind: "main", items: [{ exerciseId: "main-1", durationMinutes: 45, format: "circuit" }] },
    { kind: "cooldown", items: [{ exerciseId: "cool-1", durationMinutes: 6, format: "free" }] },
  ],
};

describe("training phase regeneration schema", () => {
  it("accepts one complete reviewed phase set and a target phase", () => {
    expect(trainingPhaseRegenerationSchema.safeParse({ request, phase: "main", current }).success).toBe(true);
  });

  it("rejects duplicate phase kinds", () => {
    const invalid = {
      ...current,
      phases: [current.phases[0], current.phases[0], current.phases[2]],
    };
    expect(trainingPhaseRegenerationSchema.safeParse({ request, phase: "main", current: invalid }).success).toBe(false);
  });

  it("rejects duplicate exercise ids across preserved draft phases", () => {
    const invalid = {
      ...current,
      phases: [
        current.phases[0],
        current.phases[1],
        { kind: "cooldown", items: [{ exerciseId: "warm-1", durationMinutes: 6, format: "free" }] },
      ],
    };
    expect(trainingPhaseRegenerationSchema.safeParse({ request, phase: "main", current: invalid }).success).toBe(false);
  });
});
