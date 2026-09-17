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
    sourceTrainingIds: [],
    preferredExerciseIds: [],
    availableEquipment: [],
    locale: "de",
    ...overrides,
  };
}

function item(candidate: TrainingDraftExerciseCandidate, index: number, durationMinutes = 15) {
  return {
    id: `item-${index}-${candidate.id}`,
    exercise: {
      id: candidate.id,
      name: candidate.name,
      riskLevel: candidate.riskLevel,
      bodyRegions: [],
      equipment: [],
    },
    durationMinutes,
    format: "circuit" as const,
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
          items: candidates.map((entry, index) => item(entry, index)),
        },
        { id: "cooldown", kind: "cooldown", title: "Cooldown", items: [] },
      ],
    },
    validationIssues: [],
    warnings: [],
  };
}

function fullDraft(
  warmup: readonly TrainingDraftExerciseCandidate[],
  main: readonly TrainingDraftExerciseCandidate[],
  cooldown: readonly TrainingDraftExerciseCandidate[],
): TrainingDraft {
  return {
    source: "ai",
    session: {
      id: "draft",
      title: "Test",
      group: { id: "group", name: "Test", audience: "adults", participantCount: 12 },
      totalDurationMinutes: 60,
      focus: ["OCR-Technik"],
      phases: [
        { id: "warmup", kind: "warmup", title: "Warm-up", items: warmup.map((entry, index) => item(entry, index, 5)) },
        { id: "main", kind: "main", title: "Hauptteil", items: main.map((entry, index) => item(entry, index, 12)) },
        { id: "cooldown", kind: "cooldown", title: "Cooldown", items: cooldown.map((entry, index) => item(entry, index, 5)) },
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

  it("applies the same warm-up, cooldown and fatigue-sequencing audit to AI drafts", () => {
    const warmup = candidate("warm", "Unrelated Warm-up", ["calves"], ["run"], {
      category: "warmup",
      defaultPhase: "warmup",
      exerciseType: "mobility",
    });
    const highImpact = candidate("jump", "Jump", ["quadriceps"], ["jump"], {
      impactLevel: "high",
      exerciseType: "strength",
    });
    const complexSkill = candidate("rig", "Complex Rig", ["forearms-grip", "shoulders"], ["hang"], {
      category: "grip-rig",
      exerciseType: "skill",
      coordinationComplexity: "complex",
    });
    const repeatedUpper = candidate("pull", "Pull", ["lats", "biceps"], ["pull"]);
    const badCooldown = candidate("finish-strength", "Finish Strength", ["shoulders"], ["push"], {
      category: "cooldown",
      defaultPhase: "cooldown",
      exerciseType: "strength",
      impactLevel: "high",
    });
    const candidates = [warmup, highImpact, complexSkill, repeatedUpper, badCooldown];

    const result = assessTrainingSportsQuality(
      request({ goals: ["OCR-Technik"], bodyRegions: ["shoulders"], exerciseTypes: ["skill"] }),
      fullDraft([warmup], [highImpact, complexSkill, repeatedUpper], [badCooldown]),
      candidates,
    );

    expect(result.warnings.join(" ")).toContain("Warm-up hat keinen erkennbaren Bezug");
    expect(result.warnings.join(" ")).toContain("Cooldown enthält");
    expect(result.warnings.join(" ")).toContain("komplexe Koordinationsaufgabe direkt nach High-Impact-Belastung");
    expect(result.score).toBeLessThan(90);
  });

  it("flags complex skill work placed after two fatigue-heavy exercises", () => {
    const candidates = [
      candidate("strength-a", "Strength A", ["quadriceps"], ["squat"], { exerciseType: "strength" }),
      candidate("endurance", "Conditioning", ["calves"], ["run"], { exerciseType: "endurance" }),
      candidate("skill", "Precision Rig", ["forearms-grip"], ["hang"], {
        exerciseType: "skill",
        coordinationComplexity: "complex",
      }),
    ];
    const result = assessTrainingSportsQuality(
      request({ goals: ["OCR-Technik"], bodyRegions: [], exerciseTypes: ["skill"] }),
      draft(candidates),
      candidates,
    );
    expect(result.warnings.join(" ")).toContain("technisch/koordinativ anspruchsvolle Übung erst nach zwei ermüdenden Belastungen");
  });

  it("detects three consecutive selections loading the same local muscle region", () => {
    const candidates = [
      candidate("grip-a", "Grip A", ["forearms-grip", "shoulders"], ["hang"]),
      candidate("grip-b", "Grip B", ["forearms-grip", "lats"], ["pull"]),
      candidate("grip-c", "Grip C", ["forearms-grip", "core"], ["carry"]),
    ];
    const result = assessTrainingSportsQuality(
      request({ goals: ["Grip"], bodyRegions: ["forearms-grip"], exerciseTypes: [] }),
      draft(candidates),
      candidates,
    );
    expect(result.warnings.join(" ")).toContain("dieselbe lokale Region (forearms-grip");
  });
});
