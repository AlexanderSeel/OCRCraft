import "server-only";

import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import { runSeedCompletenessQuery, type SeedCompletenessRow } from "./seed-completeness-core";

export interface SeedCompletenessReport {
  readonly totalCatalogExercises: number;
  readonly completeCatalogExercises: number;
  readonly totalExercises: number;
  readonly completeExercises: number;
  readonly incompleteExercises: readonly SeedCompletenessRow[];
  readonly completenessPercent: number;
}

export async function getSeedCompletenessReport(): Promise<SeedCompletenessReport> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const rows = await runSeedCompletenessQuery(connection);
    const catalogRows = await runSeedCompletenessQuery(connection, { includeImported: true });
    const incompleteExercises = rows.filter((row) => row.missingFields.length > 0);
    const completeExercises = rows.length - incompleteExercises.length;

    return {
      totalExercises: rows.length,
      totalCatalogExercises: catalogRows.length,
      completeCatalogExercises: catalogRows.filter((row) => row.missingFields.length === 0).length,
      completeExercises,
      incompleteExercises,
      completenessPercent: rows.length === 0 ? 0 : Math.round((completeExercises / rows.length) * 100),
    };
  });
}
