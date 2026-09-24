import { describe, expect, it } from "vitest";
import { guideForPath, parseTourProgress, serializeTourProgress, TOUR_GUIDES } from "./guided-tour-core";

describe("guided tour route registry", () => {
  it.each([
    ["/", "overview"],
    ["/training", "training"],
    ["/training/123", "training"],
    ["/quick-create", "quick-create"],
    ["/training/builder", "training-builder"],
    ["/exercises", "exercises"],
    ["/exercises/new", "exercise-create"],
    ["/exercises/ai-drafts", "ai-drafts"],
    ["/obstacles", "obstacles"],
    ["/games", "games"],
    ["/groups", "groups"],
    ["/media", "media"],
    ["/admin/outdoor-variants", "outdoor"],
    ["/admin?tab=overview", "admin"],
  ])("maps %s to %s", (path, id) => {
    expect(guideForPath(path).id).toBe(id);
  });

  it("keeps every guide bilingual and attached to real data-tour selectors", () => {
    for (const guide of TOUR_GUIDES) {
      expect(guide.de.trim()).not.toBe("");
      expect(guide.en.trim()).not.toBe("");
      expect(guide.steps.length).toBeGreaterThan(0);
      for (const step of guide.steps) {
        expect(step.selector).toMatch(/^\[data-tour=/);
        expect(step.de.title.trim()).not.toBe("");
        expect(step.de.text.trim()).not.toBe("");
        expect(step.en.title.trim()).not.toBe("");
        expect(step.en.text.trim()).not.toBe("");
      }
    }
  });
  it("restores and safely clamps persisted progress", () => {
    expect(parseTourProgress(null, 3)).toEqual({ stepIndex: 0, completed: false });
    expect(parseTourProgress('{"stepIndex":1,"completed":false}', 3)).toEqual({ stepIndex: 1, completed: false });
    expect(parseTourProgress('{"stepIndex":99,"completed":true}', 3)).toEqual({ stepIndex: 2, completed: true });
    expect(parseTourProgress("broken", 3)).toEqual({ stepIndex: 0, completed: false });
    expect(serializeTourProgress({ stepIndex: 2, completed: false })).toBe('{"stepIndex":2,"completed":false}');
  });
});
