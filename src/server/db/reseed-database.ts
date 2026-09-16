import type { DuckDBConnection } from "@duckdb/node-api";

const tablesToClear = [
  "exercise_media_assets",
  "training_items",
  "training_phases",
  "training_sessions",
  "club_groups",
  "search_documents_de",
  "search_documents_en",
  "search_index_state",
  "exercise_carry_guidance",
  "exercise_obstacle_guidance",
  "exercise_running_guidance",
  "exercise_common_mistakes",
  "exercise_coaching_cues",
  "exercise_execution_steps",
  "exercise_details",
  "exercise_equipment",
  "exercise_aliases",
  "exercise_movement_patterns",
  "exercise_tags",
  "exercise_body_regions",
  "exercise_translations",
  "exercises",
  "equipment",
  "tags",
  "movement_patterns",
  "body_regions",
  "schema_migrations",
] as const;

function withoutTransactionWrappers(sql: string): string {
  return sql
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => !/^\s*(BEGIN TRANSACTION|COMMIT);?\s*$/i.test(line))
    .join("\n");
}

async function executeScript(connection: DuckDBConnection, sql: string): Promise<void> {
  const statements = await connection.extractStatements(sql);
  for (let index = 0; index < statements.count; index += 1) {
    const statement = await statements.prepare(index);
    await statement.run();
  }
}

/** Clears all stored app data and restores the database from the checked-in migrations. */
export async function reseedDatabase(
  connection: DuckDBConnection,
  migrationScripts: readonly string[],
): Promise<void> {
  await connection.run("BEGIN TRANSACTION");

  try {
    await connection.run("DROP VIEW IF EXISTS exercise_seed_coverage");

    for (const table of tablesToClear) {
      try {
        await connection.run(`DROP TABLE IF EXISTS ${table}`);
      } catch (error) {
        throw new Error(`Failed to drop ${table}`, { cause: error });
      }
    }

    for (const script of migrationScripts) {
      await executeScript(connection, withoutTransactionWrappers(script));
    }

    await connection.run("COMMIT");
  } catch (error) {
    try {
      await connection.run("ROLLBACK");
    } catch {
      // Keep the original migration failure as the actionable error.
    }
    throw error;
  }
}
