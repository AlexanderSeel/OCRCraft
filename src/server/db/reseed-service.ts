import "server-only";

import { withDuckDbConnection } from "./duckdb";
import { readAllMigrationScripts } from "./migrations";
import { reseedDatabase } from "./reseed-database";

export async function reseedAllDatabaseData(): Promise<void> {
  const migrationScripts = await readAllMigrationScripts();
  await withDuckDbConnection((connection) =>
    reseedDatabase(connection, migrationScripts),
  );
}
