export interface SearchRankingWeights {
  readonly exact: number;
  readonly prefix: number;
  readonly alias: number;
  readonly summary: number;
  readonly taxonomy: number;
  readonly bodyRegions: number;
  readonly equipment: number;
  readonly instructions: number;
}

export const DEFAULT_SEARCH_RANKING_WEIGHTS: SearchRankingWeights = {
  exact: 100,
  prefix: 75,
  alias: 50,
  summary: 20,
  taxonomy: 25,
  bodyRegions: 25,
  equipment: 20,
  instructions: 10,
};

function normalizedWeight(value: unknown, fallback: number): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(500, number)) : fallback;
}

export function normalizeSearchRankingWeights(
  input?: Partial<SearchRankingWeights>,
): SearchRankingWeights {
  return {
    exact: normalizedWeight(input?.exact, DEFAULT_SEARCH_RANKING_WEIGHTS.exact),
    prefix: normalizedWeight(input?.prefix, DEFAULT_SEARCH_RANKING_WEIGHTS.prefix),
    alias: normalizedWeight(input?.alias, DEFAULT_SEARCH_RANKING_WEIGHTS.alias),
    summary: normalizedWeight(input?.summary, DEFAULT_SEARCH_RANKING_WEIGHTS.summary),
    taxonomy: normalizedWeight(input?.taxonomy, DEFAULT_SEARCH_RANKING_WEIGHTS.taxonomy),
    bodyRegions: normalizedWeight(input?.bodyRegions, DEFAULT_SEARCH_RANKING_WEIGHTS.bodyRegions),
    equipment: normalizedWeight(input?.equipment, DEFAULT_SEARCH_RANKING_WEIGHTS.equipment),
    instructions: normalizedWeight(input?.instructions, DEFAULT_SEARCH_RANKING_WEIGHTS.instructions),
  };
}
