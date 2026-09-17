import { describe, expect, it } from "vitest";
import type { TrainingDraftExerciseCandidate } from "@/domain/training/draft";
import { getTrainingPhaseBudgets } from "@/domain/training/draft";
import { composeAiTrainingDraft } from "./ai-training-composer";
import { trainingDraftRequestSchema } from "./training-draft-schema";

function candidate(
  id: string,
  phase: "warmup" | "main" | "cooldown",
  bodyRegions: readonly string[] = ["full-body"],
): TrainingDraftExerciseCandidate {
  return {
    id,
    name: id,
    category: phase === "warmup" ? "warmup" : phase === "cooldown" ? "cooldown" : "strength",
    defaultPhase: phase,
    riskLevel: "low",
    minAge: null,
    bodyRegions,
    equipment: [],
    equipmentRequirements: [],
    stationCapacity: 20,
    tags: [],
    movementPatterns: [],
    exerciseType: phase === "main" ? "strength" : "drill",
    trainingGoals: phase === "main" ? ["strength"] : [],
    defaultDurationSeconds: 180,
    instructions: `${id} instructions`,
    level1: `${id} easy`,
    level2: `${id} standard`,
    level3: `${id} hard`,
  };
}

const request = trainingDraftRequestSchema.parse({
  audience: "adults",
  participantCount: 12,
  durationMinutes: 60,
  goals: ["Kraft"],
  bodyRegions: ["core"],
  avoidBodyRegions: [],
  exerciseTypes: ["strength"],
  formats: ["circuit"],
  location: "indoor",
  intensity: "balanced",
  builderMode: "ai",
  preferredExerciseIds: [],
  availableEquipment: [],
  locale: "de",
});

const approved = [
  candidate("warm", "warmup", ["core"]),
  candidate("main-a", "main", ["core"]),
  candidate("main-b", "main", ["quadriceps"]),
  candidate("cool", "cooldown", ["core"]),
];

function proposal(mainId = "main-a") {
  return {
    title: "AI Test",
    rationale: "Technik und Kraft sinnvoll verteilt.",
    phases: [
      { kind: "warmup", items: [{ exerciseId: "warm" }] },
      { kind: "main", items: [{ exerciseId: mainId, format: "circuit", level: "level2" }] },
      { kind: "cooldown", items: [{ exerciseId: "cool" }] },
    ],
  };
}

describe("AI training composer", () => {
  it("rehydrates approved exercises and assigns exact phase budgets", () => {
    const draft = composeAiTrainingDraft({
      proposal: proposal(),
      request,
      approvedExercises: approved,
      providerId: "test-provider",
    });

    expect(draft.source).toBe("ai");
    expect(draft.session.phases.flatMap((phase) => phase.items).map((item) => item.exercise.id)).toEqual([
      "warm", "main-a", "cool",
    ]);
    const budgets = getTrainingPhaseBudgets(60);
    expect(draft.session.phases.map((phase) => [phase.kind, phase.items.reduce((sum, item) => sum + item.durationMinutes, 0)])).toEqual([
      ["warmup", budgets.warmup],
      ["main", budgets.main],
      ["cooldown", budgets.cooldown],
    ]);
    expect(draft.session.phases[1]?.items[0]?.levelLabel).toBe("main-a standard");
    expect(draft.warnings.join(" ")).toContain("test-provider");
  });

  it("rejects exercises outside the approved pool", () => {
    expect(() => composeAiTrainingDraft({
      proposal: proposal("invented-exercise"), request, approvedExercises: approved, providerId: "test",
    })).toThrow(/nicht freigegebene Übung/);
  });

  it("rejects exercises that conflict with an avoided muscle region", () => {
    const avoidCore = trainingDraftRequestSchema.parse({
      ...request,
      bodyRegions: [],
      avoidBodyRegions: ["core"],
    });
    expect(() => composeAiTrainingDraft({
      proposal: proposal(), request: avoidCore, approvedExercises: approved, providerId: "test",
    })).toThrow(/ausgeschlossener Körperregion/);
  });

  it("rejects a provider assigning a main exercise to warm-up", () => {
    const invalid = {
      ...proposal(),
      phases: [
        { kind: "warmup", items: [{ exerciseId: "main-a" }] },
        { kind: "main", items: [{ exerciseId: "warm" }] },
        { kind: "cooldown", items: [{ exerciseId: "cool" }] },
      ],
    };
    expect(() => composeAiTrainingDraft({
      proposal: invalid, request, approvedExercises: approved, providerId: "test",
    })).toThrow(/unpassenden Phase/);
  });
});
