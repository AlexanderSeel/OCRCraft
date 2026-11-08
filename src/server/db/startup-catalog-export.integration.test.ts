import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { DuckDBInstance } from "@duckdb/node-api";
import { describe, expect, it } from "vitest";

async function fixture(file: string, incomplete = false) {
  const db = await DuckDBInstance.create(file); const c = await db.connect();
  try {
    const tables = ["exercises", "ai_exercise_drafts", "training_saved_templates", "training_generation_history", "training_session_versions", "training_items", "training_phases", "training_sessions", "user_exercise_favorites", "exercise_image_generation_jobs", "app_user_roles", "app_role_permissions", "app_roles", "audit_events", "app_task_queue", "ai_provider_assignments", "ai_provider_instances", "ai_provider_usage_events", "ai_provider_settings", "app_users"];
    for (const table of tables) {
      if (incomplete && table === "app_task_queue") continue;
      await c.run(`CREATE TABLE ${table}(marker VARCHAR)`);
      await c.run(`INSERT INTO ${table} VALUES ('fixture')`);
    }
    await c.run("CREATE TABLE schema_migrations AS SELECT range AS version FROM range(1,1000)");
    await c.run("CREATE TABLE app_auth_settings(club_access_code VARCHAR,updated_at TIMESTAMP)");
    await c.run("INSERT INTO app_auth_settings VALUES ('not-a-real-secret',current_timestamp)");
    await c.run("CREATE TABLE external_import_sources(provider VARCHAR,base_url VARCHAR,encrypted_api_key VARCHAR,enabled BOOLEAN,last_import_at TIMESTAMP,last_import_result VARCHAR,updated_at TIMESTAMP)");
    await c.run("INSERT INTO external_import_sources VALUES ('fixture','https://example.invalid/?token=test-only','test-only',true,current_timestamp,'private history',current_timestamp)");
    await c.run("CREATE TABLE exercise_media_assets(provider VARCHAR)");
    await c.run("INSERT INTO exercise_media_assets VALUES ('OCRCraft named image package'),('temporary local file')");
    await c.run("CHECKPOINT");
  } finally { c.closeSync(); db.closeSync(); }
}
const build = (source: string, output: string) => execFileSync(process.execPath, [path.resolve("scripts/build-initial-database.mjs")], {
  env: { ...process.env, OCRCRAFT_INITIAL_SOURCE_DB_PATH: source, OCRCRAFT_INITIAL_OUTPUT_DB_PATH: output }, stdio: "pipe",
});

describe("startup catalog export", () => {
  it("strips credentials and transient data without changing the source", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "ocrcraft-startup-"));
    const source = path.join(dir,"source.duckdb"); const output = path.join(dir,"output.duckdb");
    try {
      await fixture(source); build(source, output);
      for (const [file, expected] of [[source,1],[output,0]] as const) {
        const db = await DuckDBInstance.create(file,{access_mode:"READ_ONLY"});const c=await db.connect();
        try {
          const result=await c.runAndReadAll("SELECT (SELECT count(*) FROM app_users),(SELECT count(*) FROM training_sessions),(SELECT count(*) FROM app_auth_settings WHERE club_access_code IS NOT NULL),(SELECT count(*) FROM external_import_sources WHERE encrypted_api_key IS NOT NULL OR enabled OR base_url LIKE '%token=%'),(SELECT count(*) FROM exercises)");
          expect(result.getRows()[0].map(Number)).toEqual([expected,expected,expected,expected,1]);
        } finally {c.closeSync();db.closeSync();}
      }
    } finally { await rm(dir,{recursive:true,force:true}); }
  });
  it("leaves an existing startup snapshot intact when sanitization fails", async () => {
    const dir=await mkdtemp(path.join(os.tmpdir(),"ocrcraft-startup-fail-"));
    try {
      const source=path.join(dir,"source.duckdb"),output=path.join(dir,"output.duckdb");
      await fixture(source,true);await writeFile(output,"previous snapshot sentinel");
      expect(()=>build(source,output)).toThrow();
      expect(await readFile(output,"utf8")).toBe("previous snapshot sentinel");
    } finally {await rm(dir,{recursive:true,force:true});}
  });
});
