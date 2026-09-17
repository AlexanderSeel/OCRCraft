import { describe, expect, it } from "vitest";
import { adaptHasaneyldrmExercise, adaptHasaneyldrmExercises } from "./hasaneyldrm-exercises-adapter";

describe("hasaneyldrm exercise adapter", () => {
  it("maps a dataset record to a reviewable bilingual import draft without copying media", () => {
    const draft = adaptHasaneyldrmExercise({
      id: 42, name: "Goblet Squat", category: "strength", body_part: "upper legs",
      equipment: "Kettlebell", instructions: { en: "Squat while holding the kettlebell." },
      instruction_steps: { en: ["Stand tall.", "Lower with control.", "Drive up."] },
      image: "https://example.com/image.jpg", attribution: "Gym Visual",
    });
    expect(draft.seedKey).toBe("imported-goblet-squat-42");
    expect(draft.bodyRegionIds).toContain("quadriceps");
    expect(draft.equipmentSeedKeys).toEqual(["kettlebell"]);
    expect(draft.translationStatus).toBe("required");
    expect(draft.reviewStatus).toBe("draft");
    expect(draft.mediaReference.licenseLabel).toBe("Gym-Visual-Lizenz");
    expect(draft.mediaReference.usage).toBe("template_only");
    expect(draft.sourceMetadata.sourceType).toBe("dataset");
    expect(draft.sourceMetadata.provider).toBe("hasaneyldrm/exercises-dataset");
    expect(draft.warnings.join(" ")).toContain("Gym-Visual-Lizenz");
  });

  it("rejects non-array batch input and supplies safe fallback steps", () => {
    expect(() => adaptHasaneyldrmExercises({})).toThrow("JSON array");
    const [draft] = adaptHasaneyldrmExercises([{ id: "x", name: "Run", body_part: "cardio" }]);
    expect(draft.executionStepsEn).toHaveLength(3);
    expect(draft.bodyRegionIds).toEqual(["full-body"]);
  });
});
