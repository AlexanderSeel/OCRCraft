import { describe, expect, it } from "vitest";
import type { TrainingDraftExerciseCandidate, TrainingDraftInput } from "@/domain/training/draft";
import { composeSportsTrainingDraft } from "./sports-training-composer";

const baseInput: TrainingDraftInput = {
  audience: "adults",
  participantCount: 12,
  durationMinutes: 60,
  goals: ["Kraft"],
  bodyRegions: ["biceps"],
  avoidBodyRegions: [],
  exerciseTypes: ["strength"],
  formats: ["circuit"],
  intensity: "balanced",
  preferredExerciseIds: [],
  availableEquipment: [],
  minAge: 18,
};

function candidate(
  id: string,
  phase: "warmup" | "main" | "cooldown",
  overrides: Partial<TrainingDraftExerciseCandidate> = {},
): TrainingDraftExerciseCandidate {
  return {
    id,
    name: id,
    category: phase === "warmup" ? "warmup" : phase === "cooldown" ? "cooldown" : "strength",
    defaultPhase: phase,
    riskLevel: "low",
    minAge: null,
    bodyRegions: phase === "main" ? ["core"] : ["full-body"],
    equipment: [],
    equipmentRequirements: [],
    stationCapacity: 12,
    tags: [],
    movementPatterns: phase === "main" ? ["brace"] : ["mobility"],
    exerciseType: phase === "cooldown" ? "recovery" : phase === "warmup" ? "mobility" : "strength",
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

function phaseIds(draft: ReturnType<typeof composeSportsTrainingDraft>, phase: "warmup" | "main" | "cooldown") {
  return draft.session.phases.find((entry) => entry.kind === phase)?.items.map((item) => item.exercise.id) ?? [];
}

describe("local sports training composer", () => {
  it("uses a target muscle and its typical antagonist when both are available", () => {
    const draft = composeSportsTrainingDraft(
      { ...baseInput, durationMinutes: 45 },
      [
        candidate("warm", "warmup"),
        candidate("cool", "cooldown"),
        candidate("biceps-curl", "main", {
          bodyRegions: ["biceps"],
          movementPatterns: ["pull"],
          trainingGoals: ["strength"],
        }),
        candidate("triceps-push", "main", {
          bodyRegions: ["triceps"],
          movementPatterns: ["push"],
          trainingGoals: ["strength"],
        }),
        candidate("squat", "main", {
          bodyRegions: ["quadriceps", "glutes"],
          movementPatterns: ["squat"],
        }),
        candidate("hinge", "main", {
          bodyRegions: ["hamstrings", "glutes"],
          movementPatterns: ["hinge"],
        }),
      ],
    );

    const main = phaseIds(draft, "main");
    expect(main).toContain("biceps-curl");
    expect(main).toContain("triceps-push");
    expect(draft.source).toBe("deterministic");
  });

  it("covers distinct requested exercise types before repeating one type", () => {
    const draft = composeSportsTrainingDraft(
      {
        ...baseInput,
        durationMinutes: 75,
        goals: ["OCR-Technik", "Ausdauer"],
        bodyRegions: [],
        exerciseTypes: ["skill", "endurance"],
        intensity: "technique",
      },
      [
        candidate("warm", "warmup"),
        candidate("cool", "cooldown"),
        candidate("skill-1", "main", { exerciseType: "skill", category: "ocr-skill", trainingGoals: ["ocr_technique"] }),
        candidate("skill-2", "main", { exerciseType: "skill", category: "ocr-skill", trainingGoals: ["ocr_technique"] }),
        candidate("run-1", "main", { exerciseType: "endurance", category: "running", trainingGoals: ["endurance"], movementPatterns: ["run"] }),
        candidate("strength-1", "main", { exerciseType: "strength", trainingGoals: ["strength"] }),
        candidate("balance-1", "main", { exerciseType: "drill", category: "balance-agility", trainingGoals: ["coordination"] }),
      ],
    );

    const main = phaseIds(draft, "main");
    expect(main.some((id) => id.startsWith("skill-"))).toBe(true);
    expect(main).toContain("run-1");
  });

  it("avoids consecutive high-impact work when lower-impact alternatives exist", () => {
    const draft = composeSportsTrainingDraft(
      { ...baseInput, durationMinutes: 75, goals: ["Ausdauer"], bodyRegions: [], exerciseTypes: [] },
      [
        candidate("warm", "warmup"),
        candidate("cool", "cooldown"),
        candidate("a-high", "main", { exerciseType: "endurance", category: "running", impactLevel: "high", trainingGoals: ["endurance"], movementPatterns: ["run"] }),
        candidate("b-high", "main", { exerciseType: "endurance", category: "running", impactLevel: "high", trainingGoals: ["endurance"], movementPatterns: ["jump"] }),
        candidate("c-moderate", "main", { exerciseType: "endurance", category: "running", impactLevel: "moderate", trainingGoals: ["endurance"], movementPatterns: ["run"] }),
        candidate("d-low", "main", { exerciseType: "strength", impactLevel: "low", trainingGoals: ["strength"], movementPatterns: ["brace"] }),
        candidate("e-low", "main", { exerciseType: "mobility", category: "mobility", impactLevel: "low", trainingGoals: ["mobility"], movementPatterns: ["mobility"] }),
      ],
    );

    const main = draft.session.phases.find((phase) => phase.kind === "main")?.items ?? [];
    const impacts = main.map((item) => {
      const source = ["a-high", "b-high"].includes(item.exercise.id) ? "high" : "other";
      return source;
    });
    expect(impacts.some((value, index) => value === "high" && impacts[index + 1] === "high")).toBe(false);
  });

  it("reports an unmet movement counterpart instead of silently claiming balance", () => {
    const draft = composeSportsTrainingDraft(
      { ...baseInput, durationMinutes: 45, bodyRegions: [], exerciseTypes: [] },
      [
        candidate("warm", "warmup"),
        candidate("cool", "cooldown"),
        candidate("push-1", "main", { bodyRegions: ["chest"], movementPatterns: ["push"] }),
        candidate("push-2", "main", { bodyRegions: ["triceps"], movementPatterns: ["push"] }),
        candidate("legs", "main", { bodyRegions: ["quadriceps"], movementPatterns: ["squat"] }),
      ],
    );

    expect(draft.warnings.some((warning) => warning.includes("push") && warning.includes("pull"))).toBe(true);
  });

  it("selects warm-up and cooldown exercises that match the actual main-part demands", () => {
    const draft = composeSportsTrainingDraft(
      {
        ...baseInput,
        durationMinutes: 45,
        goals: ["OCR-Technik"],
        bodyRegions: ["shoulders"],
        exerciseTypes: ["skill"],
        intensity: "technique",
      },
      [
        candidate("generic-warmup", "warmup", {
          bodyRegions: ["quadriceps"],
          movementPatterns: ["squat"],
        }),
        candidate("shoulder-prep", "warmup", {
          bodyRegions: ["shoulders"],
          movementPatterns: ["hang"],
          exerciseType: "drill",
        }),
        candidate("generic-cooldown", "cooldown", {
          bodyRegions: ["calves"],
        }),
        candidate("shoulder-recovery", "cooldown", {
          bodyRegions: ["shoulders"],
          movementPatterns: ["mobility"],
          exerciseType: "recovery",
        }),
        candidate("rig-skill", "main", {
          category: "grip-rig",
          bodyRegions: ["shoulders", "forearms-grip"],
          movementPatterns: ["hang"],
          exerciseType: "skill",
          trainingGoals: ["ocr_technique", "grip"],
        }),
        candidate("pull-skill", "main", {
          category: "grip-rig",
          bodyRegions: ["lats", "biceps"],
          movementPatterns: ["pull"],
          exerciseType: "skill",
          trainingGoals: ["ocr_technique"],
        }),
        candidate("core", "main", { bodyRegions: ["core"], movementPatterns: ["brace"] }),
      ],
    );

    expect(phaseIds(draft, "warmup")).toContain("shoulder-prep");
    expect(phaseIds(draft, "cooldown")).toContain("shoulder-recovery");
  });

  it("assigns conservative stored levels for kids and safe progressions for adult conditioning", () => {
    const pool = [
      candidate("warm", "warmup"),
      candidate("cool", "cooldown"),
      candidate("main-a", "main", { bodyRegions: ["biceps"], movementPatterns: ["pull"] }),
      candidate("main-b", "main", { bodyRegions: ["triceps"], movementPatterns: ["push"] }),
      candidate("main-c", "main", { bodyRegions: ["quadriceps"], movementPatterns: ["squat"] }),
    ];

    const kids = composeSportsTrainingDraft(
      { ...baseInput, audience: "kids", minAge: 10, durationMinutes: 45 },
      pool,
    );
    const kidLevels = kids.session.phases.find((phase) => phase.kind === "main")?.items.map((item) => item.levelLabel) ?? [];
    expect(kidLevels.every((level) => level === "Leicht")).toBe(true);

    const conditioning = composeSportsTrainingDraft(
      { ...baseInput, intensity: "conditioning", durationMinutes: 45 },
      pool,
    );
    const adultLevels = conditioning.session.phases.find((phase) => phase.kind === "main")?.items.map((item) => item.levelLabel) ?? [];
    expect(adultLevels.every((level) => level === "Fortgeschritten")).toBe(true);
  });

  it("prefers stations that can handle the expected circuit group size", () => {
    const draft = composeSportsTrainingDraft(
      {
        ...baseInput,
        participantCount: 24,
        durationMinutes: 45,
        goals: ["Kraft"],
        bodyRegions: [],
        exerciseTypes: ["strength"],
      },
      [
        candidate("warm", "warmup"),
        candidate("cool", "cooldown"),
        candidate("bottleneck", "main", {
          bodyRegions: ["core"],
          movementPatterns: ["brace"],
          stationCapacity: 1,
        }),
        candidate("roomy", "main", {
          bodyRegions: ["core"],
          movementPatterns: ["brace"],
          stationCapacity: 12,
        }),
        candidate("push", "main", { bodyRegions: ["chest"], movementPatterns: ["push"], stationCapacity: 12 }),
        candidate("pull", "main", { bodyRegions: ["lats"], movementPatterns: ["pull"], stationCapacity: 12 }),
        candidate("legs", "main", { bodyRegions: ["quadriceps"], movementPatterns: ["squat"], stationCapacity: 12 }),
      ],
    );

    const main = phaseIds(draft, "main");
    expect(main).toContain("roomy");
    expect(main).not.toContain("bottleneck");
  });
});
