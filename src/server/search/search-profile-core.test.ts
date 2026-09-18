import { describe, expect, it } from "vitest";
import {
  DEFAULT_SEARCH_RANKING_WEIGHTS,
  normalizeSearchRankingWeights,
} from "./search-profile-core";

describe("search profile weights", () => {
  it("fills missing values from the balanced defaults", () => {
    expect(normalizeSearchRankingWeights({ equipment: 80 })).toEqual({
      ...DEFAULT_SEARCH_RANKING_WEIGHTS,
      equipment: 80,
    });
  });

  it("clamps invalid or excessive weights", () => {
    expect(normalizeSearchRankingWeights({
      exact: -4,
      prefix: 999,
      summary: Number.NaN,
    })).toMatchObject({
      exact: 0,
      prefix: 500,
      summary: DEFAULT_SEARCH_RANKING_WEIGHTS.summary,
    });
  });
});
