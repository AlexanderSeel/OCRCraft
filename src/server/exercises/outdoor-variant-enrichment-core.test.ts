import { describe, expect, it } from "vitest";
import { buildOutdoorVariantPlan, outdoorVariantText } from "./outdoor-variant-enrichment-core";

const catalogue = [
  { equipmentId: "band", seedKey: "resistance-band", nameDe: "Widerstandsband", nameEn: "Resistance Band", quantityRequired: 1 },
  { equipmentId: "box", seedKey: "box", nameDe: "Box", nameEn: "Box", quantityRequired: 1 },
  { equipmentId: "sandbag", seedKey: "sandbag", nameDe: "Sandbag", nameEn: "Sandbag", quantityRequired: 1 },
  { equipmentId: "mat", seedKey: "mat", nameDe: "Matte", nameEn: "Mat", quantityRequired: 1 },
];

describe("outdoor exercise variant enrichment", () => {
  it("replaces gym-bound equipment and keeps portable equipment", () => {
    const plan = buildOutdoorVariantPlan([
      { equipmentId: "cable", seedKey: "cable", nameDe: "Kabelzug", nameEn: "Cable", quantityRequired: 1 },
      { equipmentId: "mat", seedKey: "mat", nameDe: "Matte", nameEn: "Mat", quantityRequired: 1 },
    ], catalogue);

    expect(plan.canApply).toBe(true);
    expect(plan.equipment.map((item) => item.seedKey).sort()).toEqual(["mat", "resistance-band"]);
    expect(outdoorVariantText(plan, "de")).toContain("Kabelzug → Widerstandsband");
  });

  it("does not claim an outdoor variant when a gym dependency cannot be mapped", () => {
    const plan = buildOutdoorVariantPlan([
      { equipmentId: "machine", seedKey: "machine", nameDe: "Maschine", nameEn: "Machine", quantityRequired: 1 },
    ], []);

    expect(plan.canApply).toBe(false);
    expect(outdoorVariantText(plan, "en")).toBe("");
  });
});
