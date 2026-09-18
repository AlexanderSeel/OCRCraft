import { describe, expect, it } from "vitest";
import {
  collectSavedTemplateExerciseIds,
  savedTemplateItemCount,
  savedTrainingTemplateSnapshotSchema,
} from "./saved-training-template-core";

const snapshot = {
  version: 1,
  session: {
    title: "OCR Team",
    totalDurationMinutes: 60,
    locale: "de",
    notes: null,
    organizationMode: "team",
    teamSize: 3,
    groupSplitCount: null,
  },
  phases: [
    {
      kind: "main",
      title: "Hauptteil",
      sortOrder: 0,
      items: [
        {
          exerciseId: "11111111-1111-4111-8111-111111111111",
          titleOverride: null,
          format: "team-competition",
          durationMinutes: 10,
          instructions: null,
          levelLabel: "Level 2",
          sortOrder: 0,
          mainPartIndex: 1,
          mainPartTitle: "Komplex 1 · Kraft",
          programming: { mode: "rounds", rounds: 2, scoreMode: "quality" },
        },
        {
          exerciseId: "11111111-1111-4111-8111-111111111111",
          titleOverride: null,
          format: "team-competition",
          durationMinutes: 10,
          instructions: null,
          levelLabel: null,
          sortOrder: 1,
          mainPartIndex: 2,
          mainPartTitle: "Team-Finisher",
          programming: { mode: "chipper" },
        },
      ],
    },
  ],
} as const;

describe("saved training template snapshot", () => {
  it("validates a complete snapshot and preserves team competition programming", () => {
    const parsed = savedTrainingTemplateSnapshotSchema.parse(snapshot);
    expect(parsed.session.teamSize).toBe(3);
    expect(parsed.phases[0].items[0].mainPartTitle).toBe("Komplex 1 · Kraft");
    expect(savedTemplateItemCount(parsed)).toBe(2);
  });

  it("allows an empty phase so in-progress trainings can become templates", () => {
    expect(savedTrainingTemplateSnapshotSchema.safeParse({
      ...snapshot,
      phases: [{ kind: "cooldown", title: "Cooldown", sortOrder: 0, items: [] }],
    }).success).toBe(true);
  });

  it("deduplicates referenced exercise ids", () => {
    const parsed = savedTrainingTemplateSnapshotSchema.parse(snapshot);
    expect(collectSavedTemplateExerciseIds(parsed)).toEqual([
      "11111111-1111-4111-8111-111111111111",
    ]);
  });

  it("rejects malformed snapshots instead of partially restoring them", () => {
    expect(savedTrainingTemplateSnapshotSchema.safeParse({
      ...snapshot,
      session: { ...snapshot.session, organizationMode: "unknown" },
    }).success).toBe(false);
  });
});
