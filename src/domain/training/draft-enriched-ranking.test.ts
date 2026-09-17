import { describe, expect, it } from "vitest";
import { composeTrainingDraft, type TrainingDraftExerciseCandidate, type TrainingDraftInput } from "./draft";

function candidate(
  id: string,
  name: string,
  phase: "warmup" | "main" | "cooldown",
  overrides: Partial<TrainingDraftExerciseCandidate> = {},
): TrainingDraftExerciseCandidate {
  return {
    id,
    name,
    category: phase === "warmup" ? "warmup" : phase === "cooldown" ? "cooldown" : "strength",
    defaultPhase: phase,
    riskLevel: "low",
    minAge: null,
    bodyRegions: ["full-body"],
    equipment: [],
    equipmentRequirements: [],
    stationCapacity: 20,
    tags: [],
    defaultDurationSeconds: 180,
    ...overrides,
  };
}

const input: TrainingDraftInput = {
  audience: "mixed",
  participantCount: 12,
  durationMinutes: 45,
  goals: ["Rotation"],
  bodyRegions: [],
  formats: ["free"],
  intensity: "balanced",
  preferredExerciseIds: [],
};

describe("enriched TrainingDraft ranking", () => {
  it("uses structured planning detail to prioritize a goal-relevant exercise", () => {
    const draft = composeTrainingDraft(input, [
      candidate("warm", "Warm-up", "warmup"),
      candidate("generic-a", "Alpha Strength", "main"),
      candidate("generic-b", "Beta Strength", "main"),
      candidate("generic-c", "Gamma Strength", "main"),
      candidate("rotation", "Zulu Rotation Control", "main", {
        planningText: "Kontrollierte Rotation und Anti-Rotation mit stabiler Rumpfposition.",
      }),
      candidate("cool", "Cooldown", "cooldown"),
    ]);

    const mainIds = draft.session.phases
      .find((phase) => phase.kind === "main")
      ?.items.map((item) => item.exercise.id) ?? [];

    expect(mainIds[0]).toBe("rotation");
    expect(mainIds).toContain("rotation");
    expect(mainIds).not.toContain("generic-c");
  });

  it("also uses movement-pattern metadata as deterministic planning context", () => {
    const draft = composeTrainingDraft({ ...input, goals: ["Hinge"] }, [
      candidate("warm", "Warm-up", "warmup"),
      candidate("generic-a", "Alpha Strength", "main"),
      candidate("generic-b", "Beta Strength", "main"),
      candidate("generic-c", "Gamma Strength", "main"),
      candidate("hinge", "Zulu Hip Pattern", "main", {
        movementPatterns: ["hinge"],
      }),
      candidate("cool", "Cooldown", "cooldown"),
    ]);

    const mainIds = draft.session.phases
      .find((phase) => phase.kind === "main")
      ?.items.map((item) => item.exercise.id) ?? [];

    expect(mainIds[0]).toBe("hinge");
  });
});
