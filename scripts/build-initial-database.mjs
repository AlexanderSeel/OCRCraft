import { access, copyFile, mkdir, readFile, readdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DuckDBInstance } from "@duckdb/node-api";

const projectRoot = process.cwd();
const sourcePath = path.resolve(process.env.OCRCRAFT_INITIAL_SOURCE_DB_PATH ?? path.join(projectRoot, "data", "ocrcraft.duckdb"));
const outputPath = path.resolve(process.env.OCRCRAFT_INITIAL_OUTPUT_DB_PATH ?? path.join(projectRoot, "data", "ocrcraft.initial.duckdb"));
const stagingPath = `${outputPath}.build-${randomUUID()}.tmp`;
const backupPath = `${outputPath.replace(/\.duckdb$/, "")}.backup-${Date.now()}.duckdb`;
const migrationsDirectory = path.join(projectRoot, "src", "server", "db", "migrations");

async function runScript(connection, sql) {
  const statements = await connection.extractStatements(sql);
  for (let index = 0; index < statements.count; index += 1) {
    const statement = await statements.prepare(index);
    await statement.run();
  }
}

// A source with a WAL must be checkpointed by its owner before export.
try { await access(`${sourcePath}.wal`); throw new Error("Checkpoint the source database before exporting its catalog (WAL present)."); }
catch (error) { if (error.code !== "ENOENT") throw error; }
await mkdir(path.dirname(outputPath), { recursive: true });
await copyFile(sourcePath, stagingPath);
const instance = await DuckDBInstance.create(stagingPath);
const connection = await instance.connect();
try {
  const applied = new Set((await connection.runAndReadAll("SELECT version FROM schema_migrations")).getRows().map(([version]) => Number(version)));
  const migrationFiles = (await readdir(migrationsDirectory))
    .filter((fileName) => /^\d{3}_.*\.sql$/.test(fileName))
    .sort();
  for (const fileName of migrationFiles) {
    const version = Number(fileName.slice(0, 3));
    if (applied.has(version)) continue;
    await runScript(connection, await readFile(path.join(migrationsDirectory, fileName), "utf8"));
  }

  // Do not ship local accounts, generated sessions, audit history or provider
  // credentials in the deployable catalog snapshot.
  for (const table of [
    "ai_exercise_drafts", "training_saved_templates", "training_generation_history", "training_session_versions",
    "training_items", "training_phases", "training_sessions", "user_exercise_favorites",
    "exercise_image_generation_jobs",
    "app_user_roles", "app_role_permissions", "app_roles", "audit_events", "app_task_queue", "ai_provider_assignments",
    "ai_provider_instances", "ai_provider_usage_events", "ai_provider_settings", "app_users",
  ]) await connection.run(`DELETE FROM ${table}`);
  await connection.run("UPDATE app_auth_settings SET club_access_code=NULL,updated_at=current_timestamp");
  // Reset endpoints too: a custom local URL may itself contain credentials.
  await connection.run("DELETE FROM external_import_sources");
  await connection.run(`INSERT INTO external_import_sources(provider,base_url,enabled) VALUES
    ('exercisedb','https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com',false),
    ('hasaneyldrm','https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json',false)`);
  const credentialCount = await connection.runAndReadAll(`SELECT
    (SELECT count(*) FROM app_auth_settings WHERE club_access_code IS NOT NULL)
    + (SELECT count(*) FROM external_import_sources WHERE encrypted_api_key IS NOT NULL)
    + (SELECT count(*) FROM ai_provider_instances)
    + (SELECT count(*) FROM ai_provider_settings)
    + (SELECT count(*) FROM app_users)`);
  if (Number(credentialCount.getRows()[0][0]) !== 0) throw new Error("Startup snapshot still contains deployment credentials.");
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
} catch (error) {
  connection.closeSync();
  instance.closeSync();
  await rm(stagingPath, { force: true });
  throw error;
}
connection.closeSync();
instance.closeSync();
// Publish only a fully migrated and sanitized snapshot, retaining the old one.
try { await copyFile(outputPath, backupPath); }
catch (error) { if (error.code !== "ENOENT") throw error; }
try { await rename(stagingPath, outputPath); }
catch (error) { await rm(stagingPath, { force: true }); throw error; }
console.log(JSON.stringify({ outputPath, backupPath, published: true }));
