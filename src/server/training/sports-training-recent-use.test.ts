import { describe, expect, it } from "vitest";
import type { TrainingDraftExerciseCandidate, TrainingDraftInput } from "@/domain/training/draft";
import { composeSportsTrainingDraft } from "./sports-training-composer";

type CandidateWithHistory = TrainingDraftExerciseCandidate & { readonly recentUseCount?: number };

function candidate(
  id: string,
  phase: "warmup" | "main" | "cooldown",
  recentUseCount = 0,
): CandidateWithHistory {
  return {
    id,
    name: id,
    category: phase === "warmup" ? "warmup" : phase === "cooldown" ? "cooldown" : "strength",
    defaultPhase: phase,
    riskLevel: "low",
    minAge: null,
    bodyRegions: phase === "main" ? ["quadriceps"] : ["core"],
    equipment: [],
    equipmentRequirements: [],
    stationCapacity: 8,
    tags: [],
    movementPatterns: phase === "main" ? ["squat"] : ["mobility"],
    exerciseType: phase === "warmup" ? "drill" : phase === "cooldown" ? "recovery" : "strength",
    difficulty: "beginner",
    impactLevel: "low",
    coordinationComplexity: "simple",
    trainingGoals: phase === "main" ? ["strength"] : [],
    defaultDurationSeconds: 180,
    recentUseCount,
  };
}

const input: TrainingDraftInput = {
  audience: "adults",
  participantCount: 12,
  durationMinutes: 60,
  goals: ["Kraft"],
  bodyRegions: [],
  avoidBodyRegions: [],
  exerciseTypes: ["strength"],
  formats: ["circuit"],
  intensity: "balanced",
  preferredExerciseIds: [],
  availableEquipment: [],
};

describe("local sports planner recent-use diversity", () => {
  it("uses recent history as a soft penalty when equivalent fresh alternatives exist", () => {
    const draft = composeSportsTrainingDraft(input, [
      candidate("warm-a", "warmup"),
      candidate("warm-b", "warmup"),
      candidate("cool", "cooldown"),
      candidate("main-repeated", "main", 6),
      candidate("main-fresh-a", "main"),
      candidate("main-fresh-b", "main"),
      candidate("main-fresh-c", "main"),
      candidate("main-fresh-d", "main"),
    ]);

    const mainIds = draft.session.phases
      .find((phase) => phase.kind === "main")
      ?.items.map((item) => item.exercise.id) ?? [];

    expect(mainIds).toHaveLength(4);
    expect(mainIds).not.toContain("main-repeated");
    expect(mainIds).toEqual(expect.arrayContaining([
      "main-fresh-a",
      "main-fresh-b",
      "main-fresh-c",
      "main-fresh-d",
    ]));
  });

  it("still permits a recently used exercise when the trainer explicitly prefers it", () => {
    const draft = composeSportsTrainingDraft(
      { ...input, preferredExerciseIds: ["main-repeated"] },
      [
        candidate("warm-a", "warmup"),
        candidate("warm-b", "warmup"),
        candidate("cool", "cooldown"),
        candidate("main-repeated", "main", 6),
        candidate("main-fresh-a", "main"),
        candidate("main-fresh-b", "main"),
        candidate("main-fresh-c", "main"),
        candidate("main-fresh-d", "main"),
      ],
    );

    const mainIds = draft.session.phases
      .find((phase) => phase.kind === "main")
      ?.items.map((item) => item.exercise.id) ?? [];

    expect(mainIds).toContain("main-repeated");
  });
});
