import { describe, expect, it } from "vitest";
import { CODEX_IMAGE_P1_BATCHES } from "./codex-image-p1-batches";

describe("Codex P1 image batches", () => {
  it("keeps the staged seed backlog unique and complete", () => {
    const all = Object.values(CODEX_IMAGE_P1_BATCHES).flat();
    expect(all).toHaveLength(42);
    expect(new Set(all).size).toBe(42);
    expect(CODEX_IMAGE_P1_BATCHES["single-subject"]).toHaveLength(17);
    expect(CODEX_IMAGE_P1_BATCHES["ocrfra-obstacles"]).toHaveLength(11);
    expect(CODEX_IMAGE_P1_BATCHES["games-partner"]).toHaveLength(14);
  });
});
