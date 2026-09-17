import { describe, expect, it } from "vitest";
import type { TrainingDraft } from "@/domain/training/draft";
import { applyMainPartProgramming, mainPartProgrammingLabel } from "./main-part-programming";
import { trainingDraftRequestSchema } from "./training-draft-schema";

function exercise(id: string) {
  return {
    id,
    name: id,
    riskLevel: "low" as const,
    bodyRegions: [],
    equipment: [],
  };
}

const draft: TrainingDraft = {
  source: "deterministic",
  session: {
    id: "draft",
    title: "Programming test",
    group: {
      id: "group",
      name: "Test",
      audience: "adults",
      participantCount: 10,
    },
    totalDurationMinutes: 30,
    focus: ["OCR-Technik"],
    phases: [
      {
        id: "warmup",
        kind: "warmup",
        title: "Aufwärmen",
        items: [{ id: "w1", exercise: exercise("w1"), durationMinutes: 3 }],
      },
      {
        id: "main",
        kind: "main",
        title: "Hauptteil",
        items: [
          { id: "m1", exercise: exercise("m1"), durationMinutes: 2, mainPartIndex: 1, mainPartTitle: "Hauptteil 1" },
          { id: "m2", exercise: exercise("m2"), durationMinutes: 2, mainPartIndex: 1, mainPartTitle: "Hauptteil 1" },
          { id: "m3", exercise: exercise("m3"), durationMinutes: 4, mainPartIndex: 2, mainPartTitle: "Hauptteil 2" },
        ],
      },
      {
        id: "cooldown",
        kind: "cooldown",
        title: "Cooldown",
        items: [{ id: "c1", exercise: exercise("c1"), durationMinutes: 3 }],
      },
    ],
  },
  validationIssues: [],
  warnings: [],
};

const request = trainingDraftRequestSchema.parse({
  audience: "adults",
  participantCount: 10,
  durationMinutes: 30,
  goals: ["OCR-Technik"],
  bodyRegions: [],
  formats: ["circuit"],
  intensity: "balanced",
  warmupExerciseCount: 1,
  mainExerciseCount: 2,
  mainPartExerciseCounts: [2, 1],
  mainPartProgramming: [
    { mode: "interval", workSeconds: 50, restSeconds: 20 },
    { mode: "every", everyValue: 500, everyUnit: "metres" },
  ],
  cooldownExerciseCount: 1,
  mainPartCount: 2,
  preferredExerciseIds: [],
});

describe("main-part programming", () => {
  it("applies one trainer-owned prescription to every item in its main part", () => {
    const result = applyMainPartProgramming(request, draft);
    const main = result.session.phases.find((phase) => phase.kind === "main");

    expect(main?.items[0]?.programming).toEqual({ mode: "interval", workSeconds: 50, restSeconds: 20 });
    expect(main?.items[1]?.programming).toEqual({ mode: "interval", workSeconds: 50, restSeconds: 20 });
    expect(main?.items[2]?.programming).toEqual({ mode: "every", everyValue: 500, everyUnit: "metres" });
    expect(result.session.phases.find((phase) => phase.kind === "warmup")?.items[0]?.programming).toBeUndefined();
  });

  it("reports useful work/rest arithmetic when a block leaves transition time", () => {
    const result = applyMainPartProgramming(request, draft);
    expect(result.warnings.some((warning) => warning.includes("Hauptteil 1") && warning.includes("30s bleiben"))).toBe(true);
  });

  it("formats the supported prescriptions for trainer-facing surfaces", () => {
    expect(mainPartProgrammingLabel({ mode: "rounds", rounds: 4, scoreMode: "quality" })).toContain("4 Runden");
    expect(mainPartProgrammingLabel({ mode: "pyramid", ladderStart: 2, ladderEnd: 10, ladderStep: 2 })).toContain("Pyramide");
    expect(mainPartProgrammingLabel({ mode: "every", everyValue: 400, everyUnit: "metres" })).toBe("Alle 400 m");
  });
});
