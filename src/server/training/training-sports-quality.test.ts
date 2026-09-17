import { describe, expect, it } from "vitest";
import type { TrainingDraft, TrainingDraftExerciseCandidate } from "../../domain/training/draft";
import type { TrainingDraftRequest } from "./training-draft-schema";
import { assessTrainingSportsQuality } from "./training-sports-quality";

function candidate(
  id: string,
  name: string,
  bodyRegions: readonly string[],
  movementPatterns: readonly string[],
  overrides: Partial<TrainingDraftExerciseCandidate> = {},
): TrainingDraftExerciseCandidate {
  return {
    id,
    name,
    category: "strength",
    defaultPhase: "main",
    riskLevel: "low",
    minAge: null,
    bodyRegions,
    equipment: [],
    equipmentRequirements: [],
    stationCapacity: 8,
    tags: [],
    movementPatterns,
    exerciseType: "strength",
    difficulty: "beginner",
    impactLevel: "low",
    coordinationComplexity: "simple",
    trainingGoals: ["strength"],
    defaultDurationSeconds: 180,
    ...overrides,
  };
}

function request(overrides: Partial<TrainingDraftRequest> = {}): TrainingDraftRequest {
  return {
    audience: "adults",
    participantCount: 12,
    durationMinutes: 60,
    goals: ["Ganzkörper"],
    bodyRegions: ["chest"],
    avoidBodyRegions: [],
    exerciseTypes: ["strength"],
    formats: ["circuit"],
    location: "mixed",
    intensity: "balanced",
    builderMode: "local",
    preferredExerciseIds: [],
    availableEquipment: [],
    locale: "de",
    ...overrides,
  };
}

function draft(candidates: readonly TrainingDraftExerciseCandidate[]): TrainingDraft {
  return {
    source: "deterministic",
    session: {
      id: "draft",
      title: "Test",
      group: { id: "group", name: "Test", audience: "adults", participantCount: 12 },
      totalDurationMinutes: 60,
      focus: ["Ganzkörper"],
      phases: [
        { id: "warmup", kind: "warmup", title: "Warm-up", items: [] },
        {
          id: "main",
          kind: "main",
          title: "Hauptteil",
          items: candidates.map((item, index) => ({
            id: `item-${index}`,
            exercise: {
              id: item.id,
              name: item.name,
              riskLevel: item.riskLevel,
              bodyRegions: [],
              equipment: [],
            },
            durationMinutes: 15,
            format: "circuit",
          })),
        },
        { id: "cooldown", kind: "cooldown", title: "Cooldown", items: [] },
      ],
    },
    validationIssues: [],
    warnings: [],
  };
}

describe("assessTrainingSportsQuality", () => {
  it("rewards whole-body and push/pull balance", () => {
    const candidates = [
      candidate("push", "Push", ["chest"], ["push"]),
      candidate("pull", "Pull", ["lats"], ["pull"]),
      candidate("core", "Core", ["abs"], ["brace"]),
      candidate("legs", "Squat Hinge", ["quadriceps", "hamstrings"], ["squat", "hinge"]),
    ];
    const result = assessTrainingSportsQuality(request(), draft(candidates), candidates);
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.warnings[0]).toMatch(/Sportqualitätscheck: \d+\/100/);
    expect(result.warnings.join(" ")).not.toContain("Makro-Abdeckung");
    expect(result.warnings.join(" ")).not.toContain("push ohne");
  });

  it("flags missing macro coverage, movement balance and consecutive high impact", () => {
    const candidates = [
      candidate("push-a", "Push A", ["chest"], ["push"], { impactLevel: "high" }),
      candidate("push-b", "Push B", ["shoulders"], ["push"], { impactLevel: "high" }),
      candidate("push-c", "Push C", ["triceps"], ["push"]),
    ];
    const result = assessTrainingSportsQuality(request(), draft(candidates), candidates);
    expect(result.score).toBeLessThan(90);
    expect(result.warnings.join(" ")).toContain("Makro-Abdeckung");
    expect(result.warnings.join(" ")).toContain("push ohne ausgleichendes Gegenmuster pull");
    expect(result.warnings.join(" ")).toContain("High-Impact-Übungen direkt hintereinander");
  });

  it("adds a stronger warning for advanced or high-risk Kids selections", () => {
    const candidates = [
      candidate("advanced", "Advanced", ["chest"], ["push"], {
        difficulty: "advanced",
        riskLevel: "high",
      }),
    ];
    const result = assessTrainingSportsQuality(
      request({ audience: "kids", goals: ["Kraft"], bodyRegions: [] }),
      draft(candidates),
      candidates,
    );
    expect(result.warnings.join(" ")).toContain("Kids-Entwurf");
  });
});
