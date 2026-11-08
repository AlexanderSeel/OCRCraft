import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { DuckDBInstance } from "@duckdb/node-api";
import { expect, it } from "vitest";

it("named-package import preserves a colliding file even when the database does not reference it", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ocrcraft-named-collision-"));
  const databasePath = path.join(root, "data", "ocrcraft.duckdb");
  const source = path.join(root, "package");
  const destination = path.join(root, "public", "generated", "exercises", "named", "sample", "sample.png");
  try {
    await mkdir(path.dirname(databasePath), { recursive: true });
    await mkdir(path.join(source, "images"), { recursive: true });
    await mkdir(path.dirname(destination), { recursive: true });
    const original = Buffer.from("previous review candidate");
    await writeFile(destination, original);
    const png = Buffer.alloc(24);
    png.writeUInt32BE(0x89504e47, 0);
    png.write("IHDR", 12, "ascii");
    png.writeUInt32BE(16, 16);
    png.writeUInt32BE(16, 20);
    await writeFile(path.join(source, "images", "sample.png"), png);
    await writeFile(path.join(source, "import-manifest.json"), JSON.stringify([
      { filename: "sample.png", suggested_seed_key: "sample" },
    ]));

    const instance = await DuckDBInstance.create(databasePath);
    const connection = await instance.connect();
    try {
      await connection.run("CREATE TABLE exercises(id UUID,seed_key VARCHAR,canonical_name VARCHAR,archived BOOLEAN)");
      await connection.run("INSERT INTO exercises VALUES ('35b80ab9-27a4-444d-96e4-0e3297957426','sample','Sample',false)");
      await connection.run("CREATE TABLE exercise_translations(exercise_id UUID,locale VARCHAR,name VARCHAR)");
      await connection.run("CREATE TABLE exercise_aliases(exercise_id UUID,alias VARCHAR)");
      await connection.run("CREATE TABLE exercise_media_assets(exercise_id UUID,storage_key VARCHAR,source_type VARCHAR,review_status VARCHAR,generation_status VARCHAR)");
      await connection.run("CHECKPOINT");
    } finally {
      connection.closeSync();
      instance.closeSync();
    }

    const result = spawnSync(process.execPath, [
      path.resolve("scripts/import-named-exercise-images.mjs"), `--source=${source}`,
    ], { cwd: root, encoding: "utf8" });
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("EEXIST");
    expect(await readFile(destination)).toEqual(original);
    expect(await readdir(path.dirname(destination))).toEqual(["sample.png"]);

    const check = await DuckDBInstance.create(databasePath, { access_mode: "READ_ONLY" });
    const reader = await check.connect();
    try {
      const rows = await reader.runAndReadAll("SELECT count(*) FROM exercise_media_assets");
      expect(Number(rows.getRows()[0][0])).toBe(0);
    } finally {
      reader.closeSync();
      check.closeSync();
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
