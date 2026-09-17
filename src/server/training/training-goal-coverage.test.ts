import { describe, expect, it } from "vitest";
import type { TrainingDraft, TrainingDraftExerciseCandidate } from "@/domain/training/draft";
import type { TrainingDraftRequest } from "./training-draft-schema";
import { assessStructuredTrainingGoalCoverage } from "./training-goal-coverage";

const request: TrainingDraftRequest = {
  audience: "adults",
  participantCount: 12,
  durationMinutes: 60,
  goals: ["Kraftausdauer", "Ganzkörper"],
  bodyRegions: [],
  avoidBodyRegions: [],
  exerciseTypes: [],
  formats: ["circuit"],
  location: "mixed",
  intensity: "balanced",
  builderMode: "local",
  warmupExerciseCount: 2,
  mainExerciseCount: 4,
  cooldownExerciseCount: 2,
  mainPartCount: 1,
  organizationMode: "solo",
  sourceTrainingIds: [],
  preferredExerciseIds: [],
  availableEquipment: [],
  locale: "de",
};

function candidate(id: string, trainingGoals: TrainingDraftExerciseCandidate["trainingGoals"]): TrainingDraftExerciseCandidate {
  return {
    id,
    name: id,
    category: "strength",
    defaultPhase: "main",
    riskLevel: "low",
    minAge: null,
    bodyRegions: ["core"],
    equipment: [],
    equipmentRequirements: [],
    stationCapacity: 12,
    tags: [],
    movementPatterns: ["brace"],
    exerciseType: "strength",
    difficulty: "beginner",
    impactLevel: "low",
    coordinationComplexity: "simple",
    trainingGoals,
    defaultDurationSeconds: 180,
  };
}

function draft(exerciseId: string): TrainingDraft {
  return {
    source: "deterministic",
    session: {
      id: "draft",
      title: "Draft",
      group: { id: "group", name: "Group", audience: "adults", participantCount: 12 },
      totalDurationMinutes: 60,
      focus: request.goals,
      phases: [
        { id: "warm", kind: "warmup", title: "Warm-up", items: [] },
        {
          id: "main",
          kind: "main",
          title: "Main",
          items: [{
            id: "item",
            exercise: {
              id: exerciseId,
              name: exerciseId,
              riskLevel: "low",
              bodyRegions: ["core"],
              equipment: [],
              stationCapacity: 12,
            },
            durationMinutes: 60,
            format: "circuit",
          }],
        },
        { id: "cool", kind: "cooldown", title: "Cooldown", items: [] },
      ],
    },
    validationIssues: [],
    warnings: [],
  };
}

describe("structured training goal coverage", () => {
  it("does not warn when the selected exercises cover a mapped semantic goal", () => {
    const pool = [candidate("carry", ["strength_endurance"])];
    expect(assessStructuredTrainingGoalCoverage(request, draft("carry"), pool)).toEqual([]);
  });

  it("warns for an uncovered mapped goal but ignores free-form goals outside the taxonomy", () => {
    const pool = [candidate("brace", ["strength"])];
    const warnings = assessStructuredTrainingGoalCoverage(request, draft("brace"), pool);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("Kraftausdauer");
    expect(warnings[0]).not.toContain("Ganzkörper");
  });
});
