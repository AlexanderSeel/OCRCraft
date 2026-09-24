import { copyFile, mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { DuckDBInstance } from "@duckdb/node-api";

const projectRoot = process.cwd();
const sourcePath = path.join(projectRoot, "data", "ocrcraft.duckdb");
const outputPath = path.join(projectRoot, "data", "ocrcraft.initial.duckdb");
const migrationsDirectory = path.join(projectRoot, "src", "server", "db", "migrations");

async function runScript(connection, sql) {
  const statements = await connection.extractStatements(sql);
  for (let index = 0; index < statements.count; index += 1) {
    const statement = await statements.prepare(index);
    await statement.run();
  }
}

await mkdir(path.dirname(outputPath), { recursive: true });
await rm(outputPath, { force: true });
await copyFile(sourcePath, outputPath);

const instance = await DuckDBInstance.create(outputPath);
const connection = await instance.connect();
try {
  const applied = new Set((await connection.runAndReadAll("SELECT version FROM schema_migrations")).getRows().map(([version]) => Number(version)));
  for (const version of [86, 87]) {
    if (applied.has(version)) continue;
    const fileName = `${String(version).padStart(3, "0")}_${version === 86 ? "portable_catalog_review_completion" : "reviewed_outdoor_conversion_policy"}.sql`;
    await runScript(connection, await readFile(path.join(migrationsDirectory, fileName), "utf8"));
  }

  // Do not ship local accounts, generated sessions, audit history or provider
  // credentials in the deployable catalog snapshot.
  for (const table of [
    "training_saved_templates", "training_generation_history", "training_session_versions",
    "training_items", "training_phases", "training_sessions", "user_exercise_favorites",
    "exercise_image_generation_jobs",
    "app_user_roles", "audit_events", "app_task_queue", "ai_provider_assignments",
    "ai_provider_instances", "ai_provider_usage_events", "ai_provider_settings", "app_users",
  ]) await connection.run(`DELETE FROM ${table}`);
  // Ship only media whose files are checked into the repository.
  await connection.run(
    "DELETE FROM exercise_media_assets WHERE provider IS NULL OR provider <> 'OCRCraft named image package'",
  );
  await connection.run("CHECKPOINT");

  const stats = await connection.runAndReadAll(`
    SELECT
      (SELECT count(*) FROM exercises),
      (SELECT count(*) FROM exercise_media_assets),
      (SELECT count(*) FROM exercise_media_assets WHERE provider='OCRCraft named image package'),
      (SELECT count(*) FROM app_users),
      (SELECT count(*) FROM training_sessions),
      (SELECT max(version) FROM schema_migrations)
  `);
  console.log(JSON.stringify({ outputPath, stats: stats.getRows()[0].map(Number) }, null, 2));
} finally {
  connection.closeSync();
  instance.closeSync();
}
