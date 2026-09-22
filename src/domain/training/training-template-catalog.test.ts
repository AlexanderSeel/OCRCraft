import { describe, expect, it } from "vitest";
import { BODY_REGIONS, TRAINING_FORMATS } from "./model";
import { TRAINING_TEMPLATE_FOCUS_KEYS, TRAINING_TEMPLATES } from "./training-template-catalog";

describe("training template catalog", () => {
  it("contains 26 unique original OCRCraft templates", () => {
    expect(TRAINING_TEMPLATES).toHaveLength(26);
    expect(new Set(TRAINING_TEMPLATES.map((item) => item.key)).size).toBe(26);
    expect(TRAINING_TEMPLATES.every((item) => item.provenance.authoring === "ocrcraft_original")).toBe(true);
  });

  it("covers every requested focus for adults, kids and youth", () => {
    for (const focus of TRAINING_TEMPLATE_FOCUS_KEYS) {
      expect(TRAINING_TEMPLATES.some((item) => item.focus === focus && item.audience === "adults")).toBe(true);
      expect(TRAINING_TEMPLATES.some((item) => item.focus === focus && item.audience === "kids")).toBe(true);
      expect(TRAINING_TEMPLATES.some((item) => item.focus === focus && item.audience === "youth")).toBe(true);
    }
  });

  it("uses supported planner constraints and explicit source/licensing metadata", () => {
    const bodyRegions = new Set<string>(BODY_REGIONS);
    const formats = new Set<string>(TRAINING_FORMATS);
    for (const item of TRAINING_TEMPLATES) {
      expect(item.bodyRegions.every((region) => bodyRegions.has(region))).toBe(true);
      expect(item.formats.length).toBeGreaterThan(0);
      expect(item.formats.every((format) => formats.has(format))).toBe(true);
      expect(item.provenance.referenceUrl.startsWith("https://www.vibss.de/")).toBe(true);
      expect(item.provenance.relationship).toBe("taxonomy_reference");
      expect(item.provenance.licenseNote).toContain("keine externen Texte oder Bilder");
    }
  });
});
