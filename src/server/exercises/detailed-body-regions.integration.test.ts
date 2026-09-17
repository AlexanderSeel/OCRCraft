import { readFile } from "node:fs/promises";
import { DuckDBInstance } from "@duckdb/node-api";
import { expect, it } from "vitest";
import { BODY_REGION_IDS, COARSE_BODY_REGION_IDS, expandBodyRegionIds } from "../../domain/body-regions";
import { replaceExerciseFacetMappings } from "./exercise-facet-core";

it("migrates all details and persists primary/secondary selections with valid foreign keys", async () => {
  const instance = await DuckDBInstance.create(":memory:");
  const connection = await instance.connect();
  try {
    await connection.run(`
      CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY,name VARCHAR);
      CREATE TABLE body_regions (id VARCHAR PRIMARY KEY,label_de VARCHAR,label_en VARCHAR);
      CREATE TABLE exercise_body_regions (exercise_id UUID,body_region_id VARCHAR REFERENCES body_regions(id),emphasis VARCHAR);
      CREATE TABLE exercise_movement_patterns (exercise_id UUID,movement_pattern_id VARCHAR);
      CREATE TABLE exercise_tags (exercise_id UUID,tag_id VARCHAR);
      CREATE TABLE exercise_equipment (exercise_id UUID,equipment_id UUID,quantity_required INTEGER);
    `);
    for (const id of COARSE_BODY_REGION_IDS) await connection.run("INSERT INTO body_regions VALUES ($id,$id,$id)", { id });
    const sql = await readFile("src/server/db/migrations/022_detailed_body_regions.sql", "utf8");
    for (let repeat = 0; repeat < 2; repeat++) {
      const statements = await connection.extractStatements(sql);
      for (let i = 0; i < statements.count; i++) await (await statements.prepare(i)).run();
    }
    expect((await connection.runAndReadAll("SELECT count(*)::INTEGER FROM body_regions")).getRows()).toEqual([[BODY_REGION_IDS.length]]);
    const id = "11111111-1111-4111-8111-111111111111";
    await replaceExerciseFacetMappings(connection, id, {
      bodyRegions: [{ id: "detail:biceps-left", emphasis: "primary" }, { id: "detail:forearm-right", emphasis: "secondary" }],
      movementPatternIds: [], tagIds: [], equipment: [],
    });
    expect((await connection.runAndReadAll("SELECT body_region_id,emphasis FROM exercise_body_regions ORDER BY body_region_id")).getRows()).toEqual([
      ["detail:biceps-left", "primary"], ["detail:forearm-right", "secondary"],
    ]);
    for (const [filter, expected] of [["biceps", 1], ["detail:biceps-right", 0]] as const) {
      const result = await connection.runAndReadAll("SELECT count(*)::INTEGER FROM exercise_body_regions WHERE list_contains(string_split($regions, ','),body_region_id)", { regions: expandBodyRegionIds([filter]).join(",") });
      expect(result.getRows()).toEqual([[expected]]);
    }
  } finally { connection.closeSync(); instance.closeSync(); }
});
