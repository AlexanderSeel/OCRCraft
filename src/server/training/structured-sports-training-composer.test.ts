import { describe, expect, it } from "vitest";
import type { TrainingDraftExerciseCandidate } from "@/domain/training/draft";
import { composeStructuredSportsTrainingDraft } from "./structured-sports-training-composer";

function candidate(
  id: string,
  phase: "warmup" | "main" | "cooldown",
  overrides: Partial<TrainingDraftExerciseCandidate> = {},
): TrainingDraftExerciseCandidate {
  return {
    id,
    name: id,
    category: phase === "warmup" ? "warmup" : phase === "cooldown" ? "cooldown" : "general",
    defaultPhase: phase,
    riskLevel: "low",
    minAge: null,
    bodyRegions: ["full-body"],
    equipment: [],
    equipmentRequirements: [],
    stationCapacity: 12,
    tags: [],
    movementPatterns: phase === "main" ? ["brace"] : ["mobility"],
    exerciseType: phase === "main" ? "strength" : phase === "warmup" ? "mobility" : "recovery",
    difficulty: "beginner",
    impactLevel: "low",
    coordinationComplexity: "simple",
    trainingGoals: phase === "cooldown" ? ["recovery"] : ["strength"],
    planningText: "",
    defaultDurationSeconds: 180,
    level1: "Leicht",
    level2: "Standard",
    level3: "Fortgeschritten",
    ...overrides,
  };
}

describe("structured partner workout", () => {
  it("prefers teamwork candidates and persists the partner format", () => {
    const draft = composeStructuredSportsTrainingDraft({
      audience: "adults",
      participantCount: 12,
      durationMinutes: 45,
      goals: ["Teamwork"],
      bodyRegions: [],
      avoidBodyRegions: [],
      exerciseTypes: [],
      formats: ["partner"],
      intensity: "balanced",
      preferredExerciseIds: [],
      availableEquipment: [],
      minAge: 18,
      warmupExerciseCount: 1,
      mainExerciseCount: 1,
      mainPartExerciseCounts: [1],
      cooldownExerciseCount: 1,
      mainPartCount: 1,
      organizationMode: "team",
      teamSize: 2,
    }, [
      candidate("warm", "warmup"),
      candidate("cool", "cooldown"),
      candidate("solo-strength", "main", {
        trainingGoals: ["strength"],
        planningText: "Individuelle Kraftübung.",
      }),
      candidate("partner-drill", "main", {
        exerciseType: "drill",
        trainingGoals: ["teamwork"],
        tags: ["partner", "team"],
        planningText: "Partnerweise mit klaren Rollen arbeiten.",
        stationCapacity: 2,
      }),
    ]);

    const main = draft.session.phases.find((phase) => phase.kind === "main");
    expect(main?.items).toHaveLength(1);
    expect(main?.items[0]?.exercise.id).toBe("partner-drill");
    expect(main?.items[0]?.format).toBe("partner");
    expect(draft.session.group.organizationMode).toBe("team");
    expect(draft.session.group.teamSize).toBe(2);
  });
});
