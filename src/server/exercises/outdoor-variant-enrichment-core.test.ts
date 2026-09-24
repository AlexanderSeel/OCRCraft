import { describe, expect, it } from "vitest";
import {
  buildOutdoorVariantPlan,
  buildPreconvertedOutdoorVariantPlan,
  inferOutdoorMovementFamily,
  isSystemGeneratedOutdoorVariant,
  outdoorVariantText,
} from "./outdoor-variant-enrichment-core";

const catalogue = [
  { equipmentId: "band", seedKey: "resistance-band", nameDe: "Widerstandsband", nameEn: "Resistance Band", quantityRequired: 1 },
  { equipmentId: "box", seedKey: "box", nameDe: "Box", nameEn: "Box", quantityRequired: 1 },
  { equipmentId: "sandbag", seedKey: "sandbag", nameDe: "Sandbag", nameEn: "Sandbag", quantityRequired: 1 },
  { equipmentId: "kettlebell", seedKey: "kettlebell", nameDe: "Kettlebell", nameEn: "Kettlebell", quantityRequired: 1 },
  { equipmentId: "mat", seedKey: "mat", nameDe: "Matte", nameEn: "Mat", quantityRequired: 1 },
];

describe("outdoor exercise variant enrichment", () => {
  it("uses only explicitly approved substitutions and keeps portable equipment", () => {
    const plan = buildOutdoorVariantPlan([
      { equipmentId: "cable", seedKey: "external-cable", nameDe: "Kabelzug", nameEn: "Cable", quantityRequired: 1 },
      { equipmentId: "mat", seedKey: "mat", nameDe: "Matte", nameEn: "Mat", quantityRequired: 1 },
    ], catalogue);
    expect(plan.canApply).toBe(true);
    expect(plan.equipment.map((item) => item.seedKey).sort()).toEqual(["mat", "resistance-band"]);
    expect(outdoorVariantText(plan, "de", { movementPatterns: ["pull"] })).toContain("Zugrichtung und Schulterblattkontrolle");
  });

  it("does not guess a replacement for a generic machine", () => {
    const plan = buildOutdoorVariantPlan([
      { equipmentId: "machine", seedKey: "external-machine", nameDe: "Maschine", nameEn: "Machine", quantityRequired: 1 },
    ], catalogue);
    expect(plan.canApply).toBe(false);
    expect(plan.substitutions[0]?.replacement).toBeNull();
    expect(outdoorVariantText(plan, "en")).toBe("");
  });

  it("creates movement-specific text for already converted catalogue entries", () => {
    const plan = buildPreconvertedOutdoorVariantPlan([
      { equipmentId: "sandbag", seedKey: "sandbag", nameDe: "Sandbag", nameEn: "Sandbag", quantityRequired: 1 },
    ]);
    expect(inferOutdoorMovementFamily({ name: "Romanian Deadlift" })).toBe("hinge");
    expect(outdoorVariantText(plan, "en", { name: "Romanian Deadlift" })).toContain("hip hinge and neutral spine");
  });

  it("recognizes migration placeholder text without treating trainer text as generated", () => {
    expect(isSystemGeneratedOutdoorVariant(
      "Outdoor-Variante: Nutze Kettlebell, Sandbag, Widerstandsband, Matte oder Körpergewicht entsprechend der angezeigten Ausstattung.",
    )).toBe(true);
    expect(isSystemGeneratedOutdoorVariant("Nutze draußen ein Band am tiefen Fixpunkt und halte die Ellbogen eng.")).toBe(false);
  });
});
