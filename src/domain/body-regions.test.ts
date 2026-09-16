import { describe, expect, it } from "vitest";
import {
  bodyRegionsOverlap,
  expandBodyRegionIds,
  getBodyRegionAntagonists,
  normalizeBodyRegionId,
} from "./body-regions";

describe("body region compatibility", () => {
  it("keeps granular regions and expands only safe broad/fine relationships", () => {
    expect(expandBodyRegionIds(["biceps"])).toEqual(["biceps", "upper-arms"]);
    expect(expandBodyRegionIds(["upper-arms"])).toEqual(["upper-arms", "biceps", "triceps"]);
    expect(expandBodyRegionIds(["abs"])).toEqual(["abs", "core"]);
  });

  it("matches new granular filters against older broad exercise mappings", () => {
    expect(bodyRegionsOverlap(["biceps"], ["upper-arms"])).toBe(true);
    expect(bodyRegionsOverlap(["rear-delts"], ["shoulders"])).toBe(true);
    expect(bodyRegionsOverlap(["abs"], ["core"])).toBe(true);
  });

  it("does not turn one fine region into a different sibling region", () => {
    expect(bodyRegionsOverlap(["biceps"], ["triceps"])).toBe(false);
    expect(bodyRegionsOverlap(["abs"], ["obliques"])).toBe(false);
  });

  it("normalizes the legacy arms identifier without exposing it as a new canonical option", () => {
    expect(normalizeBodyRegionId("arms")).toBe("upper-arms");
    expect(normalizeBodyRegionId("not-a-region")).toBeNull();
  });

  it("provides typical antagonist regions without changing filter compatibility", () => {
    expect(getBodyRegionAntagonists("biceps")).toEqual(["triceps"]);
    expect(getBodyRegionAntagonists("quadriceps")).toEqual(["hamstrings"]);
    expect(getBodyRegionAntagonists("calves")).toEqual(["tibialis"]);
    expect(getBodyRegionAntagonists("chest")).toEqual(["upper-back", "lats"]);
    expect(getBodyRegionAntagonists("not-a-region")).toEqual([]);
  });
});
