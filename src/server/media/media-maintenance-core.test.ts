import { describe, expect, it } from "vitest";
import { diffMediaStorageKeys } from "./media-maintenance-core";

describe("media storage maintenance", () => {
  it("finds unreferenced and missing objects with normalized keys", () => {
    expect(diffMediaStorageKeys(
      ["exercise/a.png", "exercise\\b.png", "orphan.png"],
      ["/exercise/a.png", "exercise/b.png", "missing.png"],
    )).toEqual({
      orphanedKeys: ["orphan.png"],
      missingKeys: ["missing.png"],
    });
  });

  it("deduplicates inventory and database references", () => {
    expect(diffMediaStorageKeys(["a.png", "a.png"], ["a.png", "a.png"])).toEqual({
      orphanedKeys: [],
      missingKeys: [],
    });
  });
});
