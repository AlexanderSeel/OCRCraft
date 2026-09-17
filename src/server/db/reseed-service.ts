import "server-only";

import { withDuckDbConnection } from "./duckdb";
import { readAllMigrationScripts } from "./migrations";
import { reseedDatabase } from "./reseed-database";
import { seedBundledHasaneyldrmExercises } from "@/server/exercises/import/hasaneyldrm-exercises-persistence";

export async function reseedAllDatabaseData(): Promise<void> {
  const migrationScripts = await readAllMigrationScripts();
  await withDuckDbConnection((connection) =>
    reseedDatabase(connection, migrationScripts),
  );
  if (process.env.NODE_ENV !== "test") await seedBundledHasaneyldrmExercises();
}
