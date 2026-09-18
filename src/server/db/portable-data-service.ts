import "server-only";

import type { DuckDBConnection } from "@duckdb/node-api";
import { ensureDatabaseReady } from "./database-ready";
import { withDuckDbConnection } from "./duckdb";
import type { PortableExport, PortableSection } from "./portable-data-core";
export type { PortableSection } from "./portable-data-core";
const sectionTables: Record<PortableSection, readonly string[]> = {
  exercises: ["exercises", "exercise_translations", "exercise_aliases"],
  details: ["exercise_details"],
  mapping: ["body_regions", "exercise_body_regions", "exercise_muscle_relationships", "equipment", "exercise_equipment", "movement_patterns", "exercise_movement_patterns", "tags", "exercise_tags"],
  trainings: ["training_sessions", "training_phases", "training_items", "training_item_programming", "training_group_split"],
  groups: ["club_groups", "group_equipment_defaults", "group_skill_distributions", "group_format_defaults", "group_club_rule_profiles"],
  media: ["exercise_media_assets", "exercise_image_sequences", "exercise_image_generation_jobs"],
  provenance: ["exercise_source_references", "exercise_media_assets"],
};


export async function exportPortableData(requested: readonly PortableSection[]): Promise<PortableExport> {
  await ensureDatabaseReady();
  const sections = [...new Set(requested)];
  return withDuckDbConnection(async (connection) => {
    const output: Partial<Record<PortableSection, Record<string, unknown>[]>> = {};
    for (const section of sections) {
      const rows: Record<string, unknown>[] = [];
      for (const table of sectionTables[section]) {
        if (!(await tableExists(connection, table))) continue;
        const columns = await tableColumns(connection, table);
        if (!columns.length) continue;
        const reader = await connection.runAndReadAll(`SELECT ${columns.map(quoteIdentifier).join(",")} FROM ${quoteIdentifier(table)}`);
        for (const row of reader.getRows()) rows.push({ _table: table, ...Object.fromEntries(columns.map((column, index) => [column, row[index]])) });
      }
      output[section] = rows;
    }
    return { schema: "ocrcraft-portable", version: 1, exportedAt: new Date().toISOString(), sections: output };
  });
}

async function tableExists(connection: DuckDBConnection, table: string): Promise<boolean> {
  const result = await connection.runAndReadAll("SELECT count(*) FROM information_schema.tables WHERE table_name=$table", { table });
  return Number(result.getRows()[0]?.[0] ?? 0) > 0;
}

async function tableColumns(connection: DuckDBConnection, table: string): Promise<string[]> {
  const result = await connection.runAndReadAll(`SELECT column_name FROM information_schema.columns WHERE table_name=$table ORDER BY ordinal_position`, { table });
  return result.getRows().map((row) => String(row[0]));
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}
