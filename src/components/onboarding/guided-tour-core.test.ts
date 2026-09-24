import { describe, expect, it } from "vitest";
import { guideForPath, TOUR_GUIDES } from "./guided-tour-core";

describe("guided tour route registry", () => {
  it.each([
    ["/", "overview"],
    ["/training", "training"],
    ["/training/123", "training"],
    ["/quick-create", "training-create"],
    ["/training/builder", "training-create"],
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
});
