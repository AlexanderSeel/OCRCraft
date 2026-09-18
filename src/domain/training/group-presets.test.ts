import { describe, expect, it } from "vitest";
import { GROUP_PRESETS, GROUP_PRESET_KEYS, getGroupPreset } from "./group-presets";

describe("training group presets", () => {
  it("defines every requested preset exactly once", () => {
    expect(GROUP_PRESETS.map((preset) => preset.key)).toEqual(GROUP_PRESET_KEYS);
    expect(new Set(GROUP_PRESETS.map((preset) => preset.key)).size).toBe(GROUP_PRESETS.length);
  });

  it("keeps optional skill distributions internally consistent", () => {
    for (const preset of GROUP_PRESETS) {
      if (!preset.skillDistribution) continue;
      expect(
        preset.skillDistribution.beginnerPercent
        + preset.skillDistribution.intermediatePercent
        + preset.skillDistribution.advancedPercent,
      ).toBe(100);
    }
  });

  it("resolves known presets and leaves unknown presets unset", () => {
    expect(getGroupPreset("kids")?.audience).toBe("kids");
    expect(getGroupPreset("competition")?.ruleProfile).toBe("competition");
    expect(getGroupPreset("unknown")).toBeUndefined();
  });
});
