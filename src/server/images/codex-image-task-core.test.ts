import { describe, expect, it } from "vitest";
import {
  buildCodexImageOutputFilename,
  chooseCodexImageFigurePresentation,
  sanitizeCodexImageSlug,
} from "./codex-image-task-core";

describe("Codex image task helpers", () => {
  it("keeps figure presentation stable per exercise", () => {
    const first = chooseCodexImageFigurePresentation("air-squat");
    expect(first).toBe(chooseCodexImageFigurePresentation("air-squat"));
    expect(["adult_woman", "adult_man"]).toContain(first);
  });

  it("creates safe deterministic output names", () => {
    expect(sanitizeCodexImageSlug("90/90 Hüftwechsel")).toBe("90-90-huftwechsel");
    expect(buildCodexImageOutputFilename(7, "air-squat", "Kniebeuge")).toBe("0007-air-squat.png");
    expect(buildCodexImageOutputFilename(12, null, "Überkreuzlauf / Carioca")).toBe("0012-uberkreuzlauf-carioca.png");
  });
});
