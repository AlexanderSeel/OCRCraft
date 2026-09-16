import { DuckDBInstance } from "@duckdb/node-api";
import { describe, expect, it } from "vitest";
import { replaceExerciseFacetMappings } from "./exercise-facet-core";

const EXERCISE_ID = "11111111-1111-4111-8111-111111111111";
const EQUIPMENT_OLD = "22222222-2222-4222-8222-222222222222";
const EQUIPMENT_NEW = "33333333-3333-4333-8333-333333333333";

async function createFixture() {
  const instance = await DuckDBInstance.create(":memory:");
  const connection = await instance.connect();

  await connection.run(`
    CREATE TABLE exercise_body_regions (
      exercise_id UUID,
      body_region_id VARCHAR,
      emphasis VARCHAR
    );
    CREATE TABLE exercise_movement_patterns (
      exercise_id UUID,
      movement_pattern_id VARCHAR
    );
    CREATE TABLE exercise_tags (
      exercise_id UUID,
      tag_id VARCHAR
    );
    CREATE TABLE exercise_equipment (
      exercise_id UUID,
      equipment_id UUID,
      quantity_required INTEGER
    );

    INSERT INTO exercise_body_regions VALUES ('${EXERCISE_ID}', 'old-region', 'primary');
    INSERT INTO exercise_movement_patterns VALUES ('${EXERCISE_ID}', 'old-pattern');
    INSERT INTO exercise_tags VALUES ('${EXERCISE_ID}', 'old-tag');
    INSERT INTO exercise_equipment VALUES ('${EXERCISE_ID}', '${EQUIPMENT_OLD}', 1);
  `);

  return connection;
}

async function rows(
  connection: Awaited<ReturnType<typeof createFixture>>,
  sql: string,
): Promise<readonly (readonly unknown[])[]> {
  return (await connection.runAndReadAll(sql)).getRows();
}

describe("exercise facet mapping replacement", () => {
  it("replaces body regions, movement patterns, tags and equipment quantities", async () => {
    const connection = await createFixture();
    try {
      await replaceExerciseFacetMappings(connection, EXERCISE_ID, {
        bodyRegions: [
          { id: "core", emphasis: "primary" },
          { id: "shoulders", emphasis: "secondary" },
        ],
        movementPatternIds: ["brace", "carry"],
        tagIds: ["grip", "teamwork"],
        equipment: [{ id: EQUIPMENT_NEW, quantityRequired: 3 }],
      });

      expect(await rows(
        connection,
        `SELECT body_region_id,emphasis FROM exercise_body_regions
         WHERE exercise_id='${EXERCISE_ID}' ORDER BY body_region_id`,
      )).toEqual([
        ["core", "primary"],
        ["shoulders", "secondary"],
      ]);
      expect(await rows(
        connection,
        `SELECT movement_pattern_id FROM exercise_movement_patterns
         WHERE exercise_id='${EXERCISE_ID}' ORDER BY movement_pattern_id`,
      )).toEqual([["brace"], ["carry"]]);
      expect(await rows(
        connection,
        `SELECT tag_id FROM exercise_tags
         WHERE exercise_id='${EXERCISE_ID}' ORDER BY tag_id`,
      )).toEqual([["grip"], ["teamwork"]]);
      expect(await rows(
        connection,
        `SELECT equipment_id::VARCHAR,quantity_required FROM exercise_equipment
         WHERE exercise_id='${EXERCISE_ID}'`,
      )).toEqual([[EQUIPMENT_NEW, 3]]);
    } finally {
      connection.closeSync();
    }
  });

  it("supports clearing all optional mappings", async () => {
    const connection = await createFixture();
    try {
      await replaceExerciseFacetMappings(connection, EXERCISE_ID, {
        bodyRegions: [],
        movementPatternIds: [],
        tagIds: [],
        equipment: [],
      });

      expect(await rows(connection, "SELECT * FROM exercise_body_regions")).toEqual([]);
      expect(await rows(connection, "SELECT * FROM exercise_movement_patterns")).toEqual([]);
      expect(await rows(connection, "SELECT * FROM exercise_tags")).toEqual([]);
      expect(await rows(connection, "SELECT * FROM exercise_equipment")).toEqual([]);
    } finally {
      connection.closeSync();
    }
  });
});
