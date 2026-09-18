import "server-only";

import { ensureDatabaseReady } from "./database-ready";
import { withDuckDbConnection } from "./duckdb";

export interface AuditEvent {
  readonly id: string;
  readonly actorType: string;
  readonly action: string;
  readonly entityType: string;
  readonly entityId: string | null;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: string;
}

export async function recordAuditEvent(input: {
  readonly action: string;
  readonly entityType: string;
  readonly entityId?: string;
  readonly metadata?: Record<string, unknown>;
  readonly actorType?: string;
  readonly actorId?: string;
}): Promise<void> {
  await ensureDatabaseReady();
  await withDuckDbConnection((connection) => connection.run(
    `INSERT INTO audit_events (actor_type,actor_id,action,entity_type,entity_id,metadata_json)
     VALUES ($actorType,$actorId,$action,$entityType,$entityId,$metadata)`,
    {
      actorType: input.actorType ?? "system",
      actorId: input.actorId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: JSON.stringify(input.metadata ?? {}),
    },
  ));
}

export async function listRecentAuditEvents(limit = 25): Promise<readonly AuditEvent[]> {
  await ensureDatabaseReady();
  const boundedLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `SELECT id::VARCHAR,actor_type,action,entity_type,entity_id,metadata_json,created_at::VARCHAR
       FROM audit_events ORDER BY created_at DESC LIMIT ${boundedLimit}`,
    );
    return reader.getRows().map((row) => ({
      id: String(row[0]),
      actorType: String(row[1]),
      action: String(row[2]),
      entityType: String(row[3]),
      entityId: row[4] == null ? null : String(row[4]),
      metadata: parseMetadata(row[5]),
      createdAt: String(row[6]),
    }));
  });
}

function parseMetadata(value: unknown): Record<string, unknown> {
  if (typeof value !== "string") return {};
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}
