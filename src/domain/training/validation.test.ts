import { describe, expect, it } from "vitest";
import type { TrainingSession } from "./model";
import {
  getPlannedDurationMinutes,
  validateTrainingSession,
} from "./validation";

function createSession(): TrainingSession {
  return {
    id: "session-1",
    title: "Test Session",
    group: {
      id: "group-1",
      name: "Open Training",
      audience: "mixed",
      participantCount: 12,
    },
    totalDurationMinutes: 60,
    focus: ["OCR-Technik"],
    phases: [
      {
        id: "warmup",
        kind: "warmup",
        title: "Warm-up",
        items: [
          {
            id: "warmup-item",
            durationMinutes: 10,
            exercise: {
              id: "easy-run",
              name: "Easy Run",
              riskLevel: "low",
              bodyRegions: ["full-body"],
              equipment: [],
            },
          },
        ],
      },
      {
        id: "main",
        kind: "main",
        title: "Main",
        items: [
          {
            id: "main-item",
            durationMinutes: 40,
            exercise: {
              id: "rig",
              name: "Rig Traverse",
              riskLevel: "medium",
              bodyRegions: ["forearms-grip", "shoulders"],
              equipment: ["Rig"],
            },
          },
        ],
      },
      {
        id: "cooldown",
        kind: "cooldown",
        title: "Cooldown",
        items: [
          {
            id: "cooldown-item",
            durationMinutes: 10,
            exercise: {
              id: "mobility",
              name: "Mobility",
              riskLevel: "low",
              bodyRegions: ["hips", "shoulders"],
              equipment: [],
            },
          },
        ],
      },
    ],
  };
}

describe("training validation", () => {
  it("calculates the complete planned duration", () => {
    expect(getPlannedDurationMinutes(createSession())).toBe(60);
  });

  it("accepts a complete session with matching duration", () => {
    expect(validateTrainingSession(createSession())).toEqual([]);
  });

  it("reports a missing required phase", () => {
    const session = createSession();
    const withoutCooldown: TrainingSession = {
      ...session,
      phases: session.phases.filter((phase) => phase.kind !== "cooldown"),
    };

    expect(validateTrainingSession(withoutCooldown)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "missing-phase", severity: "error" }),
      ]),
    );
  });

  it("enforces a configured maximum risk level", () => {
    const issues = validateTrainingSession(createSession(), {
      requiredPhases: ["warmup", "main", "cooldown"],
      durationToleranceMinutes: 2,
      maximumRiskLevel: "low",
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "risk-restricted", severity: "error" }),
      ]),
    );
  });
});
