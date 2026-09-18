import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { DuckDBConnection } from "@duckdb/node-api";
import { withDuckDbConnection } from "./duckdb";

interface Migration {
  readonly version: number;
  readonly fileName: string;
}

const migrations: readonly Migration[] = [
  { version: 1, fileName: "001_initial.sql" },
  { version: 2, fileName: "002_exercise_catalog.sql" },
  { version: 3, fileName: "003_seed_exercise_catalog.sql" },
  { version: 4, fileName: "004_exercise_details.sql" },
  { version: 5, fileName: "005_running_seed_guidance.sql" },
  { version: 6, fileName: "006_obstacle_seed_guidance.sql" },
  { version: 7, fileName: "007_grip_rig_seed_guidance.sql" },
  { version: 8, fileName: "008_carry_lift_seed_guidance.sql" },
  { version: 9, fileName: "009_warmup_seed_enrichment.sql" },
  { version: 10, fileName: "010_exercise_media_assets.sql" },
  { version: 11, fileName: "011_muscle_regions.sql" },
  { version: 12, fileName: "012_seed_movement_patterns.sql" },
  { version: 13, fileName: "013_foundational_strength_seed_cohort.sql" },
  { version: 14, fileName: "014_seed_cross_locale_aliases.sql" },
  { version: 15, fileName: "015_movement_teamwork_seed_cohort.sql" },
  { version: 16, fileName: "016_exercise_image_sequences.sql" },
  { version: 17, fileName: "017_exercise_training_phases.sql" },
  { version: 18, fileName: "018_exercise_training_goals.sql" },
  { version: 19, fileName: "019_exercise_movement_classification.sql" },
  { version: 20, fileName: "020_ocr_transfer_tags.sql" },
  { version: 21, fileName: "021_muscle_relationships.sql" },
  { version: 22, fileName: "022_detailed_body_regions.sql" },
  { version: 23, fileName: "023_serratus_region.sql" },
  { version: 24, fileName: "024_group_training_defaults.sql" },
  { version: 25, fileName: "025_seed_alias_completeness.sql" },
  { version: 26, fileName: "026_external_media_licensing.sql" },
  { version: 27, fileName: "027_exercise_source_references.sql" },
  { version: 28, fileName: "028_seed_quality_expansion.sql" },
  { version: 29, fileName: "029_training_generation_history.sql" },
  { version: 30, fileName: "030_duplicate_review.sql" },
  { version: 31, fileName: "031_exercise_facets.sql" },
  { version: 32, fileName: "032_partner_club_rules.sql" },
  { version: 33, fileName: "033_exercise_logistics_detail.sql" },
  { version: 34, fileName: "034_ai_exercise_drafts.sql" },
  { version: 35, fileName: "035_outdoor_exercise_variants.sql" },
  { version: 36, fileName: "036_running_pace_hr_guidance.sql" },
  { version: 37, fileName: "037_club_obstacle_dimensions.sql" },
  { version: 38, fileName: "038_training_main_parts_team_structure.sql" },
  { version: 39, fileName: "039_training_route_metadata.sql" },
  { version: 40, fileName: "040_exercise_progression_relations.sql" },
  { version: 41, fileName: "041_training_item_programming.sql" },
  { version: 42, fileName: "042_training_group_split.sql" },
  { version: 43, fileName: "043_group_skill_and_format_defaults.sql" },
  { version: 44, fileName: "044_group_club_rule_profile.sql" },
];

export async function readAllMigrationScripts(): Promise<readonly string[]> {
  return Promise.all(
    migrations.map(({ fileName }) =>
      readFile(
        path.join(process.cwd(), "src", "server", "db", "migrations", fileName),
        "utf8",
      ),
    ),
  );
}

async function getAppliedVersions(): Promise<Set<number>> {
  return withDuckDbConnection(async (connection) => {
    await connection.run(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name VARCHAR NOT NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT current_timestamp
      )
    `);

    const reader = await connection.runAndReadAll(
      "SELECT version FROM schema_migrations ORDER BY version",
    );

    return new Set(reader.getRows().map(([version]) => Number(version)));
  });
}

export async function runSqlScript(
  connection: DuckDBConnection,
  sql: string,
): Promise<void> {
  const statements = await connection.extractStatements(sql);
  for (let index = 0; index < statements.count; index += 1) {
    const statement = await statements.prepare(index);
    await statement.run();
  }
}

export async function applyPendingMigrations(): Promise<readonly number[]> {
  const applied = await getAppliedVersions();
  const scripts = await readAllMigrationScripts();
  const newlyApplied: number[] = [];

  for (let index = 0; index < migrations.length; index += 1) {
    const migration = migrations[index];
    if (applied.has(migration.version)) continue;

    await withDuckDbConnection(async (connection) => {
      await runSqlScript(connection, scripts[index]);
    });
    newlyApplied.push(migration.version);
  }

  return newlyApplied;
}

export async function runMigrations(): Promise<void> {
  await applyPendingMigrations();
}
