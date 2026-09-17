import { describe, expect, it } from "vitest";
import { validateProgressionLevels } from "./progression";

describe("exercise progression levels", () => {
  it("requires distinct levels, fallback and prerequisite guidance", () => {
    const issues = validateProgressionLevels({ level1: "", level2: "same", level3: "same", fallback: "", prerequisite: "" });
    expect(issues.map((issue) => issue.field)).toEqual(["level1", "level3", "fallback", "prerequisite"]);
  });

  it("accepts a complete progression", () => {
    expect(validateProgressionLevels({ level1: "Band assisted", level2: "Standard", level3: "Weighted", fallback: "Bodyweight", prerequisite: "Pain-free hang" })).toEqual([]);
  });
});
