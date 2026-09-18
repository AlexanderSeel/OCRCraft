import "server-only";

import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import {
  listExercises,
  type ExerciseListItem,
} from "@/server/exercises/exercise-repository";
import { runBm25ExerciseSearch, type SearchRankingWeights } from "./exercise-search-core";
import type { SearchLocale } from "./exercise-search-documents";

export interface ExerciseSearchOptions {
  readonly query?: string;
  readonly category?: string;
  readonly locale?: SearchLocale;
  readonly archived?: boolean;
  readonly limit?: number;
  readonly offset?: number;
  readonly rankingWeights?: Partial<SearchRankingWeights>;
}

function environmentRankingWeights(): Partial<SearchRankingWeights> {
  const read = (name: string): number | undefined => {
    const value = Number(process.env[name]);
    return Number.isFinite(value) ? value : undefined;
  };
  return {
    exact: read("OCRCRAFT_SEARCH_WEIGHT_EXACT"),
    prefix: read("OCRCRAFT_SEARCH_WEIGHT_PREFIX"),
    alias: read("OCRCRAFT_SEARCH_WEIGHT_ALIAS"),
  };
}

async function fallbackSearch(
  options: Required<Pick<ExerciseSearchOptions, "query" | "locale" | "archived" | "limit">> &
    Pick<ExerciseSearchOptions, "category">,
): Promise<readonly ExerciseListItem[]> {
  return listExercises(options);
}

/**
 * Searches the live FTS index when it is known to be healthy. A dirty/failed
 * index never hides fresh CRUD changes: OCRCraft falls back to the structured
 * repository search until an explicit index rebuild succeeds.
 */
export async function searchExercises({
  query: rawQuery = "",
  category,
  locale = "de",
  archived = false,
  limit = 80,
  offset = 0,
  rankingWeights,
}: ExerciseSearchOptions = {}): Promise<readonly ExerciseListItem[]> {
  const query = rawQuery.trim();
  const safeLimit = Math.max(1, Math.min(limit, 200));
  const fallbackOptions = { query, category, locale, archived, limit: safeLimit, offset };

  if (query.length < 2 || archived) {
    return fallbackSearch(fallbackOptions);
  }

  await ensureDatabaseReady();

  try {
    const result = await withDuckDbConnection(async (connection) => {
      const stateReader = await connection.runAndReadAll(
        "SELECT status FROM search_index_state WHERE locale=$locale",
        { locale },
      );
      const status = String(stateReader.getRows()[0]?.[0] ?? "dirty");
      if (status !== "healthy") return null;

      return runBm25ExerciseSearch(connection, {
        query,
        category,
        locale,
        limit: safeLimit,
        offset,
        rankingWeights: rankingWeights ?? environmentRankingWeights(),
      });
    });

    return result ?? fallbackSearch(fallbackOptions);
  } catch {
    return fallbackSearch(fallbackOptions);
  }
}
