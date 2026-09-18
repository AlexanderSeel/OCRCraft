import "server-only";

import type { DuckDBConnection } from "@duckdb/node-api";
import { ensureDatabaseReady } from "./database-ready";
import { withDuckDbConnection } from "./duckdb";
import { parsePortableImport, type PortableExport, type PortableSection } from "./portable-data-core";
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
const importOrder = ["body_regions", "movement_patterns", "tags", "equipment", "exercises", "exercise_translations", "exercise_aliases", "exercise_details", "exercise_body_regions", "exercise_muscle_relationships", "exercise_equipment", "exercise_movement_patterns", "exercise_tags", "training_sessions", "training_phases", "training_items", "club_groups", "exercise_media_assets", "exercise_image_sequences", "exercise_image_generation_jobs", "exercise_source_references"];


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

export interface PortableImportResult {
  readonly imported: number;
  readonly skipped: number;
  readonly sections: readonly PortableSection[];
}

export async function importPortableData(value: unknown): Promise<PortableImportResult> {
  const parsed = parsePortableImport(value);
  if (!parsed.ok) throw new Error(`Portable import validation failed: ${parsed.errors.join("; ")}`);
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const entries = Object.entries(parsed.data.sections).flatMap(([section, records]) => records.map((record) => ({ section: section as PortableSection, record })));
    const allowed = new Set(Object.values(sectionTables).flat());
    const tableColumnsCache = new Map<string, string[]>();
    for (const { section, record } of entries) {
      const table = typeof record._table === "string" ? record._table : "";
      if (!sectionTables[section]?.includes(table) || !allowed.has(table)) throw new Error(`Table ${table || "(missing)"} is not allowed in section ${section}.`);
      if (!tableColumnsCache.has(table)) {
        const columns = await tableColumns(connection, table);
        if (!columns.length) throw new Error(`Table ${table} does not exist.`);
        tableColumnsCache.set(table, columns);
      }
      const columns = tableColumnsCache.get(table) ?? [];
      for (const column of Object.keys(record).filter((key) => key !== "_table")) if (!columns.includes(column)) throw new Error(`Column ${table}.${column} is not part of the current schema.`);
    }

    let imported = 0;
    let skipped = 0;
    await connection.run("BEGIN TRANSACTION");
    try {
      const sorted = entries.sort((left, right) => importOrder.indexOf(String(left.record._table)) - importOrder.indexOf(String(right.record._table)));
      for (const { record } of sorted) {
        const table = String(record._table);
        const columns = Object.keys(record).filter((key) => key !== "_table");
        if (!columns.length) { skipped += 1; continue; }
        const values = Object.fromEntries(columns.map((column) => [`v_${column}`, record[column]]));
        await connection.run(`INSERT OR IGNORE INTO ${quoteIdentifier(table)} (${columns.map(quoteIdentifier).join(",")}) VALUES (${columns.map((column) => `$v_${column}`).join(",")})`, values as Parameters<typeof connection.run>[1]);
        imported += 1;
      }
      await connection.run("COMMIT");
    } catch (error) {
      await connection.run("ROLLBACK");
      throw error;
    }
    return { imported, skipped, sections: [...new Set(entries.map((entry) => entry.section))] };
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
