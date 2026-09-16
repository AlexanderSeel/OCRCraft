import { describe, expect, it } from "vitest";
import { composeTrainingDraft, type TrainingDraftExerciseCandidate, type TrainingDraftInput } from "./draft";
import { getPlannedDurationMinutes } from "./validation";

const candidates: readonly TrainingDraftExerciseCandidate[] = [
  { id: "jog", name: "Easy Jog", category: "warmup", defaultPhase: "warmup", riskLevel: "low", minAge: null, bodyRegions: ["full-body"], equipment: [], tags: ["running"], defaultDurationSeconds: 300 },
  { id: "circles", name: "Arm Circles", category: "warmup", defaultPhase: "warmup", riskLevel: "low", minAge: null, bodyRegions: ["shoulders"], equipment: [], tags: ["mobility"], defaultDurationSeconds: 180 },
  { id: "run", name: "Tempo Run", category: "running", defaultPhase: "main", riskLevel: "low", minAge: null, bodyRegions: ["full-body", "calves"], equipment: [], tags: ["running", "endurance"], defaultDurationSeconds: 600 },
  { id: "hang", name: "Active Hang", category: "grip-rig", defaultPhase: "main", riskLevel: "medium", minAge: 10, bodyRegions: ["forearms-grip", "upper-back"], equipment: ["Rig"], tags: ["grip", "rig"], defaultDurationSeconds: 180, level2: "Aktiver Hang" },
  { id: "carry", name: "Farmer Carry", category: "carry-lift", defaultPhase: "main", riskLevel: "low", minAge: null, bodyRegions: ["forearms-grip", "core"], equipment: ["Kettlebell"], tags: ["carry", "grip"], defaultDurationSeconds: 300 },
  { id: "squat", name: "Bodyweight Squat", category: "strength", defaultPhase: "main", riskLevel: "low", minAge: null, bodyRegions: ["quadriceps", "glutes"], equipment: [], tags: ["strength"], defaultDurationSeconds: 240 },
  { id: "plank", name: "Plank", category: "core", defaultPhase: "main", riskLevel: "low", minAge: null, bodyRegions: ["core"], equipment: [], tags: ["core"], defaultDurationSeconds: 180 },
  { id: "restricted", name: "Advanced Obstacle", category: "ocr-skill", defaultPhase: "main", riskLevel: "high", minAge: 14, bodyRegions: ["full-body"], equipment: ["Rig"], tags: ["ocr"], defaultDurationSeconds: 240 },
  { id: "walk", name: "Easy Walk", category: "cooldown", defaultPhase: "cooldown", riskLevel: "low", minAge: null, bodyRegions: ["full-body"], equipment: [], tags: ["recovery"], defaultDurationSeconds: 240 },
  { id: "stretch", name: "Hip Mobility", category: "cooldown", defaultPhase: "cooldown", riskLevel: "low", minAge: null, bodyRegions: ["hips"], equipment: [], tags: ["mobility"], defaultDurationSeconds: 240 },
];

const baseInput: TrainingDraftInput = {
  audience: "mixed",
  participantCount: 16,
  durationMinutes: 60,
  goals: ["Laufen", "Grip"],
  bodyRegions: ["forearms-grip", "core"],
  formats: ["rig-run"],
  intensity: "balanced",
  preferredExerciseIds: ["carry"],
};

describe("composeTrainingDraft", () => {
  it("creates all three phases with exact total duration", () => {
    const draft = composeTrainingDraft(baseInput, candidates);

    expect(draft.session.phases.map((phase) => phase.kind)).toEqual(["warmup", "main", "cooldown"]);
    expect(getPlannedDurationMinutes(draft.session)).toBe(60);
    expect(draft.validationIssues.filter((issue) => issue.code === "duration-mismatch")).toHaveLength(0);
  });

  it("prioritizes explicit preferred exercises while keeping goal-relevant variety", () => {
    const draft = composeTrainingDraft(baseInput, candidates);
    const mainIds = draft.session.phases.find((phase) => phase.kind === "main")?.items.map((item) => item.exercise.id) ?? [];

    expect(mainIds).toContain("carry");
    expect(mainIds).toContain("run");
    expect(mainIds).toContain("hang");
  });

  it("excludes exercises above the requested minimum participant age", () => {
    const draft = composeTrainingDraft({ ...baseInput, audience: "kids", minAge: 10, preferredExerciseIds: ["restricted"] }, candidates);
    const selectedIds = draft.session.phases.flatMap((phase) => phase.items.map((item) => item.exercise.id));

    expect(selectedIds).not.toContain("restricted");
    expect(draft.warnings.some((warning) => warning.includes("restricted"))).toBe(true);
  });

  it("is deterministic for identical input and candidate data", () => {
    expect(composeTrainingDraft(baseInput, candidates)).toEqual(composeTrainingDraft(baseInput, candidates));
  });
});
