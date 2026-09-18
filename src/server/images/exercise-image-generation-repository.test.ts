import { describe, expect, it } from "vitest";
import { normalizeImageExecutionSteps } from "./exercise-image-generation-core";

describe("exercise image execution steps", () => {
  it("folds imported guidance beyond seven frames into the final frame", () => {
    const steps = normalizeImageExecutionSteps(["1", "2", "3", "4", "5", "6", "7", "8", "9"]);
    expect(steps).toHaveLength(7);
    expect(steps.slice(0, 6)).toEqual(["1", "2", "3", "4", "5", "6"]);
    expect(steps[6]).toBe("7 8 9");
  });

  it("does not change valid storyboards", () => {
    expect(normalizeImageExecutionSteps(["start", "move", "reset"])).toEqual(["start", "move", "reset"]);
  });
});
