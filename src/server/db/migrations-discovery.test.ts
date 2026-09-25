import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { readAllMigrationScripts } from "./migrations";

describe("runtime migration discovery", () => {
  it("discovers the current migration directory including the latest schema", async () => {
    const scripts = await readAllMigrationScripts();
    expect(scripts.length).toBeGreaterThanOrEqual(90);
    expect(scripts.some((sql) => sql.includes("game_movement_pattern_completion"))).toBe(true);
    expect(scripts.some((sql) => sql.includes("ocr_skill_matrix_club_dimension_review"))).toBe(true);
  });
});
