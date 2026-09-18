import "server-only";

import type { DuckDBConnection } from "@duckdb/node-api";
import { requireAdmin } from "@/server/auth/identity-service";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";

interface TrainingSnapshot {
  readonly session: Record<string, unknown>;
  readonly phases: Record<string, unknown>[];
  readonly items: Record<string, unknown>[];
}

export interface TrainingVersionSummary {
  readonly id: string;
  readonly versionNumber: number;
  readonly createdAt: string;
  readonly createdBy: string | null;
}

export async function createTrainingSnapshot(sessionId: string): Promise<TrainingVersionSummary> {
  const actor = await requireAdmin();
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const snapshot = await readSnapshot(connection, sessionId);
    const next = await connection.runAndReadAll(
      "SELECT COALESCE(MAX(version_number), 0) + 1 FROM training_session_versions WHERE training_session_id=$sessionId::UUID",
      { sessionId },
    );
    const versionNumber = Number(next.getRows()[0]?.[0] ?? 1);
    await connection.run(
      `INSERT INTO training_session_versions (training_session_id,version_number,snapshot_json,created_by)
       VALUES ($sessionId::UUID,$versionNumber,$snapshot,$createdBy::UUID)`,
      { sessionId, versionNumber, snapshot: JSON.stringify(snapshot), createdBy: actor.id },
    );
    return { id: await findVersionId(connection, sessionId, versionNumber), versionNumber, createdAt: new Date().toISOString(), createdBy: actor.displayName };
  });
}

export async function listTrainingVersions(sessionId: string): Promise<readonly TrainingVersionSummary[]> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `SELECT v.id::VARCHAR,v.version_number,v.created_at::VARCHAR,COALESCE(u.display_name,u.email)
       FROM training_session_versions v LEFT JOIN app_users u ON u.id=v.created_by
       WHERE v.training_session_id=$sessionId::UUID ORDER BY v.version_number DESC LIMIT 20`,
      { sessionId },
    );
    return reader.getRows().map((row) => ({ id: String(row[0]), versionNumber: Number(row[1]), createdAt: String(row[2]), createdBy: row[3] == null ? null : String(row[3]) }));
  });
}

export async function restoreTrainingVersion(versionId: string): Promise<void> {
  await requireAdmin();
  await ensureDatabaseReady();
  await withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll("SELECT training_session_id::VARCHAR,snapshot_json FROM training_session_versions WHERE id=$versionId::UUID", { versionId });
    const row = reader.getRows()[0];
    if (!row) throw new Error("Training snapshot not found.");
    const snapshot = JSON.parse(String(row[1])) as TrainingSnapshot;
    const sessionId = String(row[0]);
    await connection.run("BEGIN TRANSACTION");
    try {
      await updateRow(connection, "training_sessions", snapshot.session, "id", sessionId);
      await connection.run("DELETE FROM training_items WHERE training_phase_id IN (SELECT id FROM training_phases WHERE training_session_id=$sessionId::UUID)", { sessionId });
      await connection.run("DELETE FROM training_phases WHERE training_session_id=$sessionId::UUID", { sessionId });
      for (const phase of snapshot.phases) await insertRow(connection, "training_phases", phase);
      for (const item of snapshot.items) await insertRow(connection, "training_items", item);
      await connection.run("COMMIT");
    } catch (error) {
      await connection.run("ROLLBACK");
      throw error;
    }
  });
}

async function readSnapshot(connection: DuckDBConnection, sessionId: string): Promise<TrainingSnapshot> {
  const session = await readRows(connection, "training_sessions", "id=$sessionId::UUID", { sessionId });
  if (!session[0]) throw new Error("Training session not found.");
  const phases = await readRows(connection, "training_phases", "training_session_id=$sessionId::UUID ORDER BY sort_order", { sessionId });
  const items = await readRows(connection, "training_items", "training_phase_id IN (SELECT id FROM training_phases WHERE training_session_id=$sessionId::UUID) ORDER BY sort_order", { sessionId });
  return { session: session[0], phases, items };
}

async function readRows(connection: DuckDBConnection, table: string, where: string, values: Record<string, string>): Promise<Record<string, unknown>[]> {
  const columns = await columnsFor(connection, table);
  const reader = await connection.runAndReadAll(`SELECT ${columns.map(quote).join(",")} FROM ${quote(table)} WHERE ${where}`, values);
  return reader.getRows().map((row) => Object.fromEntries(columns.map((column, index) => [column, row[index]])));
}

async function columnsFor(connection: DuckDBConnection, table: string): Promise<string[]> {
  const reader = await connection.runAndReadAll("SELECT column_name FROM information_schema.columns WHERE table_name=$table ORDER BY ordinal_position", { table });
  return reader.getRows().map((row) => String(row[0]));
}

async function updateRow(connection: DuckDBConnection, table: string, row: Record<string, unknown>, key: string, keyValue: string): Promise<void> {
  const columns = Object.keys(row).filter((column) => column !== key && !column.endsWith("_at"));
  if (!columns.length) return;
  const values = Object.fromEntries(columns.map((column) => [`v_${column}`, row[column]]));
  await connection.run(`UPDATE ${quote(table)} SET ${columns.map((column) => `${quote(column)}=$v_${column}`).join(",")} WHERE ${quote(key)}=$key::UUID`, { ...values, key: keyValue } as Parameters<DuckDBConnection["run"]>[1]);
}

async function insertRow(connection: DuckDBConnection, table: string, row: Record<string, unknown>): Promise<void> {
  const columns = Object.keys(row);
  const values = Object.fromEntries(columns.map((column) => [`v_${column}`, row[column]]));
  await connection.run(`INSERT INTO ${quote(table)} (${columns.map(quote).join(",")}) VALUES (${columns.map((column) => `$v_${column}`).join(",")})`, values as Parameters<DuckDBConnection["run"]>[1]);
}

async function findVersionId(connection: DuckDBConnection, sessionId: string, versionNumber: number): Promise<string> {
  const reader = await connection.runAndReadAll("SELECT id::VARCHAR FROM training_session_versions WHERE training_session_id=$sessionId::UUID AND version_number=$versionNumber", { sessionId, versionNumber });
  return String(reader.getRows()[0]?.[0]);
}

function quote(identifier: string): string { return `"${identifier.replaceAll('"', '""')}"`; }
