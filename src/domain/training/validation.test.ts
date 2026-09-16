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

  it("budgets station capacity per exercise when the main part is a circuit", () => {
    const session = createSession();
    const circuit: TrainingSession = {
      ...session,
      group: { ...session.group, participantCount: 12 },
      phases: session.phases.map((phase) => phase.kind !== "main" ? phase : {
        ...phase,
        items: [
          { ...phase.items[0]!, format: "circuit" as const, exercise: { ...phase.items[0]!.exercise, stationCapacity: 3 } },
          { ...phase.items[0]!, id: "main-item-2", format: "circuit" as const, exercise: { ...phase.items[0]!.exercise, id: "carry", stationCapacity: 3 } },
        ],
      }),
    };

    expect(validateTrainingSession(circuit)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "station-capacity",
          participantCount: 12,
          participantsAtExercise: 6,
          stationCapacity: 3,
          recommendedStationCount: 2,
        }),
      ]),
    );
  });

  it("warns when simultaneous circuit stations exceed declared equipment stock", () => {
    const session = createSession();
    const circuit: TrainingSession = {
      ...session,
      group: { ...session.group, participantCount: 8 },
      phases: session.phases.map((phase) => phase.kind !== "main" ? phase : {
        ...phase,
        items: phase.items.map((item, index) => ({
          ...item,
          format: "circuit",
          exercise: {
            ...item.exercise,
            stationCapacity: 2,
            equipmentRequirements: [{
              equipmentId: "medicine-ball",
              name: "Medizinball",
              quantityPerStation: 1,
            }],
            name: `Station ${index + 1}`,
          },
        })),
      }),
    };

    expect(validateTrainingSession(circuit, undefined, [
      { equipmentId: "medicine-ball", quantityAvailable: 3 },
    ])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "equipment-conflict",
          severity: "warning",
          equipmentId: "medicine-ball",
          requiredQuantity: 4,
          availableQuantity: 3,
        }),
      ]),
    );
  });

  it("reports unknown equipment stock separately without treating it as zero", () => {
    const session = createSession();
    const circuit: TrainingSession = {
      ...session,
      group: { ...session.group, participantCount: 8 },
      phases: session.phases.map((phase) => phase.kind !== "main" ? phase : {
        ...phase,
        items: phase.items.map((item) => ({
          ...item,
          format: "circuit",
          exercise: {
            ...item.exercise,
            stationCapacity: 2,
            equipmentRequirements: [{
              equipmentId: "medicine-ball",
              name: "Medizinball",
              quantityPerStation: 1,
            }],
          },
        })),
      }),
    };

    expect(validateTrainingSession(circuit)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "equipment-availability-unknown",
          equipmentId: "medicine-ball",
        }),
      ]),
    );
    expect(validateTrainingSession(circuit).some((issue) => issue.code === "equipment-conflict")).toBe(false);
  });

  it("keeps equipment conflicts scoped to simultaneously running circuits", () => {
    const session = createSession();
    const sequential: TrainingSession = {
      ...session,
      phases: session.phases.map((phase) => phase.kind !== "main" ? phase : {
        ...phase,
        items: phase.items.map((item) => ({
          ...item,
          format: "amrap",
          exercise: {
            ...item.exercise,
            stationCapacity: 1,
            equipmentRequirements: [{
              equipmentId: "medicine-ball",
              name: "Medizinball",
              quantityPerStation: 1,
            }],
          },
        })),
      }),
    };

    const issues = validateTrainingSession(sequential, undefined, [
      { equipmentId: "medicine-ball", quantityAvailable: 1 },
    ]);
    expect(issues.some((issue) => issue.code === "equipment-conflict")).toBe(false);
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
