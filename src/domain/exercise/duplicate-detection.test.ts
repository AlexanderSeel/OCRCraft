import { describe, expect, it } from "vitest";
import { duplicateArchiveId } from "./duplicate-detection";

describe("duplicateArchiveId", () => {
  it("returns the other exercise when the left record is kept", () => {
    expect(duplicateArchiveId("left", "right", "left")).toBe("right");
  });

  it("returns the other exercise when the right record is kept", () => {
    expect(duplicateArchiveId("left", "right", "right")).toBe("left");
  });

  it("rejects a keep id that is not part of the duplicate task", () => {
    expect(() => duplicateArchiveId("left", "right", "unrelated")).toThrow("duplicate-keep-exercise-mismatch");
  });
});
