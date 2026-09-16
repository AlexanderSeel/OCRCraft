import "server-only";

import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import {
  runExerciseAutocomplete,
  type ExerciseAutocompleteItem,
} from "./autocomplete-core";
import type { SearchLocale } from "./search-index-service";

export type { ExerciseAutocompleteItem } from "./autocomplete-core";

export async function autocompleteExercises(
  rawQuery: string,
  locale: SearchLocale = "de",
  limit = 10,
): Promise<readonly ExerciseAutocompleteItem[]> {
  const query = rawQuery.trim();
  if (query.length < 2) return [];

  await ensureDatabaseReady();
  return withDuckDbConnection((connection) =>
    runExerciseAutocomplete(
      connection,
      query,
      locale,
      Math.max(1, Math.min(limit, 20)),
    ),
  );
}
