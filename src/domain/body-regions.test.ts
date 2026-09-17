import { describe, expect, it } from "vitest";
import {
  bodyRegionsOverlap,
  detailBodyRegion,
  expandBodyRegionIds,
  getBodyRegionAntagonists,
  normalizeBodyRegionId,
} from "./body-regions";

describe("body region compatibility", () => {
  it("keeps granular regions and expands only safe broad/fine relationships", () => {
    expect(expandBodyRegionIds(["biceps"])).toEqual(expect.arrayContaining(["biceps", "upper-arms", "detail:biceps-left", "detail:biceps-right"]));
    expect(expandBodyRegionIds(["upper-arms"])).toEqual(expect.arrayContaining(["upper-arms", "biceps", "triceps"]));
    expect(expandBodyRegionIds(["abs"])).toEqual(expect.arrayContaining(["abs", "core"]));
  });

  it("keeps abs, obliques and serratus distinct while broad core includes all three", () => {
    const core = expandBodyRegionIds(["core"]);
    expect(core).toEqual(expect.arrayContaining([
      "core",
      "abs",
      "obliques",
      "serratus",
      "detail:abs-upper-left",
      "detail:abs-upper-right",
      "detail:abs-lower-left",
      "detail:abs-lower-right",
      "detail:obliques-left",
      "detail:obliques-right",
      "detail:serratus-anterior-left",
      "detail:serratus-anterior-right",
    ]));
    expect(detailBodyRegion("detail:serratus-anterior-left")?.parentId).toBe("serratus");
    expect(detailBodyRegion("detail:serratus-anterior-right")?.parentId).toBe("serratus");
    expect(bodyRegionsOverlap(["serratus"], ["detail:serratus-anterior-left"])).toBe(true);
    expect(bodyRegionsOverlap(["core"], ["detail:serratus-anterior-right"])).toBe(true);
    expect(bodyRegionsOverlap(["chest"], ["detail:serratus-anterior-left"])).toBe(false);
  });

  it("matches new granular filters against older broad exercise mappings", () => {
    expect(bodyRegionsOverlap(["biceps"], ["upper-arms"])).toBe(true);
    expect(bodyRegionsOverlap(["rear-delts"], ["shoulders"])).toBe(true);
    expect(bodyRegionsOverlap(["abs"], ["core"])).toBe(true);
    expect(bodyRegionsOverlap(["serratus"], ["core"])).toBe(true);
  });

  it("does not turn one fine region into a different sibling region", () => {
    expect(bodyRegionsOverlap(["biceps"], ["triceps"])).toBe(false);
    expect(bodyRegionsOverlap(["abs"], ["obliques"])).toBe(false);
    expect(bodyRegionsOverlap(["serratus"], ["obliques"])).toBe(false);
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
