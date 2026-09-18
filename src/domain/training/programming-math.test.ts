import { describe, expect, it } from "vitest";
import { analyzeMainPartProgramming } from "./programming-math";

describe("main-part programming arithmetic", () => {
  it("calculates interval work/rest cycles and remainder", () => {
    expect(analyzeMainPartProgramming({ mode: "interval", workSeconds: 40, restSeconds: 20 }, 310, 4)).toEqual({
      summary: "5 vollständige Zyklen · 200s Arbeit · 100s Pause · 10s Rest",
      warnings: [],
    });
  });

  it("calculates round time after explicit recovery", () => {
    const result = analyzeMainPartProgramming({ mode: "rounds", rounds: 4, scoreMode: "quality", roundRestSeconds: 30 }, 600, 3);
    expect(result.summary).toContain("127s aktive Zeit/Runde");
    expect(result.summary).toContain("30s Rundenpause");
  });

  it("calculates ladder and pyramid repetition totals", () => {
    expect(analyzeMainPartProgramming({ mode: "ladder", ladderStart: 2, ladderEnd: 10, ladderStep: 2 }, 600, 2).totalRepetitionsPerExercise).toBe(30);
    const pyramid = analyzeMainPartProgramming({ mode: "pyramid", ladderStart: 2, ladderEnd: 6, ladderStep: 2 }, 600, 2);
    expect(pyramid.sequence).toEqual([2, 4, 6, 4, 2]);
    expect(pyramid.totalRepetitionsPerExercise).toBe(18);
  });

  it("calculates chipper and minute-based every-X workload", () => {
    expect(analyzeMainPartProgramming({ mode: "chipper", chipperRepsPerExercise: 25 }, 600, 4).summary).toContain("100 Zielwiederholungen");
    const every = analyzeMainPartProgramming({
      mode: "every",
      everyValue: 2,
      everyUnit: "minutes",
      everyWorkSeconds: 30,
      everyRestSeconds: 15,
    }, 600, 2);
    expect(every.summary).toContain("5 Trigger");
    expect(every.summary).toContain("225s Triggerzeit");
  });
});
