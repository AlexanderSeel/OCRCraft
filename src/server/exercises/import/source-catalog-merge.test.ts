import { describe, expect, it } from "vitest";
import { findBestSourceCatalogMatch, sourceCatalogCompleteness, sourceCatalogMatchScore } from "./source-catalog-merge";

describe("source catalog merge", () => {
  it("accepts the agreed 70 percent threshold for near-identical names", () => {
    expect(sourceCatalogMatchScore({ name: "stationary bike run v. 3" }, { name: "stationary bike run" })).toBeGreaterThanOrEqual(0.7);
  });

  it("does not match unrelated names", () => {
    expect(sourceCatalogMatchScore({ name: "barbell squat" }, { name: "single leg balance" })).toBeLessThan(0.7);
  });

  it("prefers the more complete candidate when scores tie", () => {
    const input = { name: "standing carry" };
    const short = { name: "standing carry", category: "carry" };
    const complete = { name: "standing carry", category: "carry", equipment: ["kettlebell"], instructions: ["Walk under control"] };
    expect(sourceCatalogCompleteness(complete)).toBeGreaterThan(sourceCatalogCompleteness(short));
    expect(findBestSourceCatalogMatch(input, [short, complete])?.candidate).toBe(complete);
  });

  it("returns no candidate below the threshold", () => {
    expect(findBestSourceCatalogMatch({ name: "rope climb" }, [{ name: "seated shoulder press" }])).toBeNull();
  });
});
