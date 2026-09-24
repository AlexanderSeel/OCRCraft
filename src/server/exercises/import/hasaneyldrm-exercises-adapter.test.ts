import { describe, expect, it } from "vitest";
import { adaptHasaneyldrmExercise, adaptHasaneyldrmExercises, importedEquipmentCatalogSeedKey } from "./hasaneyldrm-exercises-adapter";

describe("hasaneyldrm exercise adapter", () => {
  it("maps a dataset record to a reviewable bilingual import draft without copying media", () => {
    const draft = adaptHasaneyldrmExercise({
      id: 42, name: "Goblet Squat", category: "strength", body_part: "upper legs",
      equipment: "Kettlebell", instructions: { en: "Squat while holding the kettlebell." },
      instruction_steps: { en: ["Stand tall.", "Lower with control.", "Drive up."] },
      image: "https://example.com/image.jpg", video: "videos/goblet-squat.mp4", attribution: "Gym Visual",
      license_label: "CC BY 4.0",
      license_verified: true,
    });
    expect(draft.seedKey).toBe("imported-goblet-squat-42");
    expect(draft.bodyRegionIds).toContain("quadriceps");
    expect(draft.equipmentSeedKeys).toEqual(["kettlebell"]);
    expect(draft.translationStatus).toBe("required");
    expect(draft.reviewStatus).toBe("draft");
    expect(draft.mediaReference.licenseLabel).toBe("CC BY 4.0");
    expect(draft.mediaReference.licenseVerified).toBe(true);
    expect(draft.mediaReference.usage).toBe("template_only");
    expect(draft.mediaReference.video).toBe("videos/goblet-squat.mp4");
    expect(draft.sourceMetadata.sourceType).toBe("dataset");
    expect(draft.sourceMetadata.provider).toBe("hasaneyldrm/exercises-dataset");
    expect(draft.warnings.join(" ")).toContain("pending until source/license review");
  });

  it("does not copy external text or media without an explicit usable license/right label", () => {
    const draft = adaptHasaneyldrmExercise({
      id: 7,
      name: "External Exercise",
      body_part: "cardio",
      instructions: { en: "Copyrighted source description." },
      instruction_steps: { en: ["Source step one.", "Source step two.", "Source step three."] },
      image: "https://example.com/source.jpg",
      license_label: "CC BY 4.0",
      license_verified: false,
    });
    expect(draft.summaryEn).not.toContain("Copyrighted source description");
    expect(draft.executionStepsEn.join(" ")).not.toContain("Source step one");
    expect(draft.mediaReference.image).toBeUndefined();
    expect(draft.mediaReference.licenseLabel).toBeNull();
    expect(draft.mediaReference.licenseVerified).toBe(false);
    expect(draft.warnings.join(" ")).toContain("not copied");
  });

  it("normalizes portable import equipment and keeps gym dependencies explicit", () => {
    expect(importedEquipmentCatalogSeedKey("bodyweight")).toBeNull();
    expect(importedEquipmentCatalogSeedKey("kettlebell")).toBe("kettlebell");
    expect(importedEquipmentCatalogSeedKey("mat")).toBe("mat");
    expect(importedEquipmentCatalogSeedKey("dumbbell")).toBe("external-dumbbell");
    expect(importedEquipmentCatalogSeedKey("machine")).toBe("external-machine");
  });

  it("rejects non-array batch input and supplies safe fallback steps", () => {
    expect(() => adaptHasaneyldrmExercises({})).toThrow("JSON array");
    const [draft] = adaptHasaneyldrmExercises([{ id: "x", name: "Run", body_part: "cardio" }]);
    expect(draft.executionStepsEn).toHaveLength(3);
    expect(draft.bodyRegionIds).toEqual(["full-body"]);
  });
});
