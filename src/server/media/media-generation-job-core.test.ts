import { describe, expect, it } from "vitest";
import { MEDIA_BATCH_MAX_EXERCISES, normalizeMediaBatchExerciseIds } from "./media-generation-job-core";

describe("media generation batch selection", () => {
  it("keeps valid UUIDs once and ignores invalid values", () => {
    expect(normalizeMediaBatchExerciseIds([
      " 35B80AB9-27A4-444D-96E4-0E3297957426 ",
      "not-an-id",
      "35b80ab9-27a4-444d-96e4-0e3297957426",
      "6f42f47b-3442-49eb-a6f3-5bc4fb374d18",
    ])).toEqual([
      "35b80ab9-27a4-444d-96e4-0e3297957426",
      "6f42f47b-3442-49eb-a6f3-5bc4fb374d18",
    ]);
  });

  it("caps a batch so one UI request cannot enqueue an unbounded generation run", () => {
    const ids = Array.from({ length: MEDIA_BATCH_MAX_EXERCISES + 5 }, (_, index) => {
      const suffix = index.toString(16).padStart(12, "0");
      return `35b80ab9-27a4-444d-96e4-${suffix}`;
    });
    expect(normalizeMediaBatchExerciseIds(ids)).toHaveLength(MEDIA_BATCH_MAX_EXERCISES);
  });
});
