import { describe, expect, it } from "vitest";
import type { TrainingDraftExerciseCandidate } from "../../domain/training/draft";
import { rankDraftExerciseAlternatives } from "./draft-item-alternative";

function candidate(
  id: string,
  difficulty: "beginner" | "intermediate" | "advanced",
  equipment: number,
  overrides: Partial<TrainingDraftExerciseCandidate> = {},
): TrainingDraftExerciseCandidate {
  return {
    id,
    name: id,
    category: "strength",
    defaultPhase: "main",
    riskLevel: "low",
    minAge: null,
    bodyRegions: ["quadriceps"],
    equipment: Array.from({ length: equipment }, (_, index) => `eq-${index}`),
    equipmentRequirements: Array.from({ length: equipment }, (_, index) => ({
      equipmentId: `eq-${index}`,
      name: `Equipment ${index}`,
      quantityPerStation: 1,
    })),
    stationCapacity: 8,
    tags: [],
    movementPatterns: ["squat"],
    exerciseType: "strength",
    difficulty,
    impactLevel: "low",
    coordinationComplexity: "simple",
    trainingGoals: ["strength"],
    defaultDurationSeconds: 180,
    ...overrides,
  };
}

describe("draft exercise alternatives", () => {
  it("prefers a lower difficulty for easier mode while preserving movement/body similarity", () => {
    const current = candidate("current", "intermediate", 1);
    const alternatives = rankDraftExerciseAlternatives(
      current,
      [
        current,
        candidate("easy-similar", "beginner", 1),
        candidate("same", "intermediate", 1),
        candidate("hard", "advanced", 1),
      ],
      "main",
      "easier",
      new Set(),
      [],
    );
    expect(alternatives[0]?.candidate.id).toBe("easy-similar");
  });

  it("prefers a higher difficulty for harder mode", () => {
    const current = candidate("current", "intermediate", 1);
    const alternatives = rankDraftExerciseAlternatives(
      current,
      [current, candidate("easy", "beginner", 1), candidate("hard", "advanced", 1)],
      "main",
      "harder",
      new Set(),
      [],
    );
    expect(alternatives[0]?.candidate.id).toBe("hard");
  });

  it("prefers equipment-free alternatives and excludes already used or avoided candidates", () => {
    const current = candidate("current", "intermediate", 2);
    const alternatives = rankDraftExerciseAlternatives(
      current,
      [
        current,
        candidate("used", "intermediate", 0),
        candidate("avoided", "intermediate", 0, { bodyRegions: ["shoulders"] }),
        candidate("free", "intermediate", 0),
        candidate("one-equipment", "intermediate", 1),
      ],
      "main",
      "equipment",
      new Set(["used"]),
      ["shoulders"],
    );
    expect(alternatives.map((entry) => entry.candidate.id)).toEqual(["free", "one-equipment"]);
  });
});
