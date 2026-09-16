import "server-only";

import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import {
  listExercises,
  type ExerciseListItem,
} from "@/server/exercises/exercise-repository";
import { runBm25ExerciseSearch } from "./exercise-search-core";
import type { SearchLocale } from "./exercise-search-documents";

export interface ExerciseSearchOptions {
  readonly query?: string;
  readonly category?: string;
  readonly locale?: SearchLocale;
  readonly archived?: boolean;
  readonly limit?: number;
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
}: ExerciseSearchOptions = {}): Promise<readonly ExerciseListItem[]> {
  const query = rawQuery.trim();
  const safeLimit = Math.max(1, Math.min(limit, 200));
  const fallbackOptions = { query, category, locale, archived, limit: safeLimit };

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
      });
    });

    return result ?? fallbackSearch(fallbackOptions);
  } catch {
    return fallbackSearch(fallbackOptions);
  }
}
