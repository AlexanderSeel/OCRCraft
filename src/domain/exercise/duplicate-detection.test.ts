import { describe, expect, it } from "vitest";
import { assessExerciseDuplicate, shouldReviewDuplicate } from "./duplicate-detection";

describe("exercise duplicate detection", () => {
  it("flags identical names with matching context", () => {
    const assessment = assessExerciseDuplicate(
      { id: "a", names: ["Goblet Squat"], aliases: [], equipment: ["Kettlebell"], bodyRegions: ["quadriceps"] },
      { id: "b", names: ["goblet-squat"], aliases: [], equipment: ["Kettlebell"], bodyRegions: ["quadriceps"] },
    );
    expect(assessment.score).toBeGreaterThanOrEqual(0.72);
    expect(assessment.classification).toBe("same");
    expect(shouldReviewDuplicate(assessment)).toBe(true);
  });

  it("does not flag unrelated movements", () => {
    const assessment = assessExerciseDuplicate(
      { id: "a", names: ["Sprint"], aliases: [], equipment: [], bodyRegions: ["legs"] },
      { id: "b", names: ["Dead Hang"], aliases: [], equipment: ["rig"], bodyRegions: ["grip"] },
    );
    expect(shouldReviewDuplicate(assessment)).toBe(false);
    expect(assessment.classification).toBe("new");
  });

  it("marks similar context with different identity as a conflict", () => {
    const assessment = assessExerciseDuplicate(
      { id: "a", names: ["Front Rack Carry"], aliases: [], equipment: ["Dumbbell"], bodyRegions: ["shoulders", "core"] },
      { id: "b", names: ["Front Rack March"], aliases: [], equipment: ["Dumbbell"], bodyRegions: ["shoulders", "core"] },
    );
    expect(assessment.classification).toBe("conflict");
    expect(shouldReviewDuplicate(assessment)).toBe(true);
  });
});
