import "server-only";

import { randomUUID } from "node:crypto";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ClubGroupAudience = "kids" | "youth" | "adults" | "mixed";
export type ClubGroupRiskLevel = "low" | "medium" | "high";

export interface ClubGroupInput {
  readonly name: string;
  readonly audience: ClubGroupAudience;
  readonly minAge: number | null;
  readonly maxAge: number | null;
  readonly defaultParticipantCount: number;
  readonly defaultDurationMinutes: number | null;
  readonly defaultLocale: "de" | "en";
  readonly maximumRiskLevel: ClubGroupRiskLevel | null;
}

export interface ClubGroup extends ClubGroupInput {
  readonly id: string;
  readonly archived: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly linkedTrainingCount: number;
}

function assertUuid(value: string): void {
  if (!UUID_PATTERN.test(value)) throw new Error("Gruppe ist ungültig.");
}

function rowToGroup(row: readonly unknown[]): ClubGroup {
  return {
    id: String(row[0]),
    name: String(row[1]),
    audience: String(row[2]) as ClubGroupAudience,
    minAge: row[3] == null ? null : Number(row[3]),
    maxAge: row[4] == null ? null : Number(row[4]),
    defaultParticipantCount: Number(row[5]),
    defaultDurationMinutes: row[6] == null ? null : Number(row[6]),
    defaultLocale: String(row[7]) as "de" | "en",
    maximumRiskLevel: row[8] == null ? null : String(row[8]) as ClubGroupRiskLevel,
    archived: Boolean(row[9]),
    createdAt: String(row[10]),
    updatedAt: String(row[11]),
    linkedTrainingCount: Number(row[12]),
  };
}

export async function listClubGroups(includeArchived = false): Promise<readonly ClubGroup[]> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `
      SELECT
        g.id::VARCHAR,
        g.name,
        g.audience,
        g.min_age,
        g.max_age,
        g.default_participant_count,
        g.default_duration_minutes,
        g.default_locale,
        g.maximum_risk_level,
        g.archived,
        g.created_at,
        g.updated_at,
        (
          SELECT count(*)
          FROM training_sessions s
          WHERE s.group_id=g.id
        ) AS linked_training_count
      FROM club_groups g
      WHERE $includeArchived OR g.archived=false
      ORDER BY g.archived, g.name
      `,
      { includeArchived },
    );
    return reader.getRows().map(rowToGroup);
  });
}

export async function createClubGroup(input: ClubGroupInput): Promise<string> {
  await ensureDatabaseReady();
  const id = randomUUID();
  await withDuckDbConnection(async (connection) => {
    await connection.run(
      `
      INSERT INTO club_groups (
        id, name, audience, min_age, max_age, default_participant_count,
        default_duration_minutes, default_locale, maximum_risk_level
      ) VALUES (
        $id::UUID, $name, $audience, $minAge, $maxAge, $participants,
        $duration, $locale, $risk
      )
      `,
      {
        id,
        name: input.name.trim(),
        audience: input.audience,
        minAge: input.minAge,
        maxAge: input.maxAge,
        participants: input.defaultParticipantCount,
        duration: input.defaultDurationMinutes,
        locale: input.defaultLocale,
        risk: input.maximumRiskLevel,
      },
    );
  });
  return id;
}

export async function updateClubGroup(id: string, input: ClubGroupInput): Promise<boolean> {
  assertUuid(id);
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `
      UPDATE club_groups
      SET
        name=$name,
        audience=$audience,
        min_age=$minAge,
        max_age=$maxAge,
        default_participant_count=$participants,
        default_duration_minutes=$duration,
        default_locale=$locale,
        maximum_risk_level=$risk,
        updated_at=current_timestamp
      WHERE id=$id::UUID
      RETURNING id::VARCHAR
      `,
      {
        id,
        name: input.name.trim(),
        audience: input.audience,
        minAge: input.minAge,
        maxAge: input.maxAge,
        participants: input.defaultParticipantCount,
        duration: input.defaultDurationMinutes,
        locale: input.defaultLocale,
        risk: input.maximumRiskLevel,
      },
    );
    return reader.getRows().length > 0;
  });
}

export async function setClubGroupArchived(id: string, archived: boolean): Promise<boolean> {
  assertUuid(id);
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `
      UPDATE club_groups
      SET archived=$archived, updated_at=current_timestamp
      WHERE id=$id::UUID
      RETURNING id::VARCHAR
      `,
      { id, archived },
    );
    return reader.getRows().length > 0;
  });
}
