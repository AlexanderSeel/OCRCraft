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

  it("warns how many parallel stations or rotations are needed for the group", () => {
    const session = createSession();
    const withLimitedStation: TrainingSession = {
      ...session,
      phases: session.phases.map((phase) => phase.kind !== "main" ? phase : {
        ...phase,
        items: phase.items.map((item) => ({
          ...item,
          exercise: { ...item.exercise, stationCapacity: 5 },
        })),
      }),
    };

    expect(validateTrainingSession(withLimitedStation)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "station-capacity",
          severity: "warning",
          participantCount: 12,
          stationCapacity: 5,
          recommendedStationCount: 3,
        }),
      ]),
    );
  });

  it("does not warn when everyone fits within the station capacity", () => {
    const session = createSession();
    const withAvailableCapacity: TrainingSession = {
      ...session,
      group: { ...session.group, participantCount: 5 },
      phases: session.phases.map((phase) => phase.kind !== "main" ? phase : {
        ...phase,
        items: phase.items.map((item) => ({
          ...item,
          exercise: { ...item.exercise, stationCapacity: 5 },
        })),
      }),
    };

    expect(validateTrainingSession(withAvailableCapacity)).toEqual([]);
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
