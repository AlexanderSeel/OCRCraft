import { describe, expect, it } from "vitest";
import {
  classifyEquipmentPortability,
  fixedEquipmentSeedKeys,
  portableEquipmentSeedKeys,
} from "./equipment-portability";

describe("equipment portability", () => {
  it("classifies portable hall and outdoor equipment", () => {
    for (const seedKey of portableEquipmentSeedKeys) {
      expect(classifyEquipmentPortability(seedKey)).toBe("portable");
    }
  });

  it("keeps fixed rig and obstacle equipment separate", () => {
    for (const seedKey of fixedEquipmentSeedKeys) {
      expect(classifyEquipmentPortability(seedKey)).toBe("fixed");
    }
  });

  it("does not guess portability for imported or custom equipment", () => {
    expect(classifyEquipmentPortability("external-dumbbell")).toBe("unclassified");
    expect(classifyEquipmentPortability("custom-weight")).toBe("unclassified");
    expect(classifyEquipmentPortability(null)).toBe("unclassified");
  });
});
