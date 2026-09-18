import "server-only";

import { randomUUID } from "node:crypto";
import type { ClubRuleProfileKey } from "@/domain/training/club-rules";
import type { TrainingFormat, TrainingLocation } from "@/domain/training/model";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import type { DuckDBConnection } from "@duckdb/node-api";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ClubGroupAudience = "kids" | "youth" | "adults" | "mixed";
export type ClubGroupRiskLevel = "low" | "medium" | "high";

export interface ClubGroupEquipmentDefault {
  readonly equipmentId: string;
  readonly quantityAvailable: number;
}

export interface ClubGroupSkillDistribution {
  readonly beginnerPercent: number;
  readonly intermediatePercent: number;
  readonly advancedPercent: number;
}

export interface ClubGroupInput {
  readonly name: string;
  readonly audience: ClubGroupAudience;
  readonly minAge: number | null;
  readonly maxAge: number | null;
  readonly defaultParticipantCount: number;
  readonly defaultDurationMinutes: number | null;
  readonly defaultLocale: "de" | "en";
  readonly maximumRiskLevel: ClubGroupRiskLevel | null;
  readonly defaultLocation?: TrainingLocation;
  readonly defaultEquipment?: readonly ClubGroupEquipmentDefault[];
  readonly skillDistribution?: ClubGroupSkillDistribution | null;
  readonly preferredFormats?: readonly TrainingFormat[];
  readonly ruleProfile?: ClubRuleProfileKey;
  readonly defaultOrganizationMode?: "solo" | "team";
  readonly defaultTeamSize?: number | null;
  readonly defaultGroupSplitCount?: number | null;
  readonly defaultStationGroupSize?: number | null;
}

export interface ClubGroup extends Omit<ClubGroupInput, "defaultLocation" | "defaultEquipment" | "skillDistribution" | "preferredFormats" | "ruleProfile"> {
  readonly id: string;
  readonly defaultLocation: TrainingLocation;
  readonly defaultEquipment: readonly ClubGroupEquipmentDefault[];
  readonly skillDistribution: ClubGroupSkillDistribution | null;
  readonly preferredFormats: readonly TrainingFormat[];
  readonly ruleProfile: ClubRuleProfileKey;
  readonly defaultOrganizationMode: "solo" | "team";
  readonly defaultTeamSize: number | null;
  readonly defaultGroupSplitCount: number | null;
  readonly defaultStationGroupSize: number | null;
  readonly archived: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly linkedTrainingCount: number;
}

function assertUuid(value: string): void {
  if (!UUID_PATTERN.test(value)) throw new Error("Gruppe ist ungültig.");
}

function rowToGroup(row: readonly unknown[]): Omit<ClubGroup, "defaultEquipment" | "preferredFormats"> {
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
    defaultLocation: String(row[9] ?? "mixed") as TrainingLocation,
    ruleProfile: String(row[10] ?? "standard") as ClubRuleProfileKey,
    skillDistribution: row[11] == null || row[12] == null || row[13] == null ? null : {
      beginnerPercent: Number(row[11]),
      intermediatePercent: Number(row[12]),
      advancedPercent: Number(row[13]),
    },
    defaultOrganizationMode: String(row[14] ?? "solo") as "solo" | "team",
    defaultTeamSize: row[15] == null ? null : Number(row[15]),
    defaultGroupSplitCount: row[16] == null ? null : Number(row[16]),
    defaultStationGroupSize: row[17] == null ? null : Number(row[17]),
    archived: Boolean(row[18]),
    createdAt: String(row[19]),
    updatedAt: String(row[20]),
    linkedTrainingCount: Number(row[21]),
  };
}

async function replaceGroupEquipmentDefaults(
  connection: DuckDBConnection,
  groupId: string,
  defaults: readonly ClubGroupEquipmentDefault[],
): Promise<void> {
  await connection.run(
    "DELETE FROM club_group_equipment_defaults WHERE group_id=$groupId::UUID",
    { groupId },
  );
  for (const item of defaults) {
    await connection.run(
      `INSERT INTO club_group_equipment_defaults (group_id,equipment_id,quantity_available)
       VALUES ($groupId::UUID,$equipmentId::UUID,$quantityAvailable)`,
      {
        groupId,
        equipmentId: item.equipmentId,
        quantityAvailable: item.quantityAvailable,
      },
    );
  }
}

async function replaceGroupPreferredFormats(
  connection: DuckDBConnection,
  groupId: string,
  formats: readonly TrainingFormat[],
): Promise<void> {
  await connection.run(
    "DELETE FROM club_group_preferred_formats WHERE group_id=$groupId::UUID",
    { groupId },
  );
  for (const [sortOrder, format] of formats.entries()) {
    await connection.run(
      `INSERT INTO club_group_preferred_formats (group_id,format,sort_order)
       VALUES ($groupId::UUID,$format,$sortOrder)`,
      { groupId, format, sortOrder },
    );
  }
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
        COALESCE(g.default_location,'mixed'),
        COALESCE(g.rule_profile,'standard'),
        g.skill_beginner_percent,
        g.skill_intermediate_percent,
        g.skill_advanced_percent,
        COALESCE(g.default_organization_mode,'solo'),
        g.default_team_size,
        g.default_group_split_count,
        g.default_station_group_size,
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
    const baseGroups = reader.getRows().map(rowToGroup);
    if (baseGroups.length === 0) return [];

    const equipmentReader = await connection.runAndReadAll(
      `
      SELECT group_id::VARCHAR,equipment_id::VARCHAR,quantity_available
      FROM club_group_equipment_defaults
      WHERE list_contains(string_split($groupIds, ','), group_id::VARCHAR)
      ORDER BY group_id::VARCHAR,equipment_id::VARCHAR
      `,
      { groupIds: baseGroups.map((group) => group.id).join(",") },
    );
    const equipmentByGroup = new Map<string, ClubGroupEquipmentDefault[]>();
    for (const row of equipmentReader.getRows()) {
      const groupId = String(row[0]);
      const items = equipmentByGroup.get(groupId) ?? [];
      items.push({ equipmentId: String(row[1]), quantityAvailable: Number(row[2]) });
      equipmentByGroup.set(groupId, items);
    }

    const formatReader = await connection.runAndReadAll(
      `
      SELECT group_id::VARCHAR,format
      FROM club_group_preferred_formats
      WHERE list_contains(string_split($groupIds, ','), group_id::VARCHAR)
      ORDER BY group_id::VARCHAR,sort_order,format
      `,
      { groupIds: baseGroups.map((group) => group.id).join(",") },
    );
    const formatsByGroup = new Map<string, TrainingFormat[]>();
    for (const row of formatReader.getRows()) {
      const groupId = String(row[0]);
      const items = formatsByGroup.get(groupId) ?? [];
      items.push(String(row[1]) as TrainingFormat);
      formatsByGroup.set(groupId, items);
    }

    return baseGroups.map((group) => ({
      ...group,
      defaultEquipment: equipmentByGroup.get(group.id) ?? [],
      preferredFormats: formatsByGroup.get(group.id) ?? [],
    }));
  });
}

export async function createClubGroup(input: ClubGroupInput): Promise<string> {
  await ensureDatabaseReady();
  const id = randomUUID();
  await withDuckDbConnection(async (connection) => {
    await connection.run("BEGIN TRANSACTION");
    try {
      await connection.run(
        `
        INSERT INTO club_groups (
          id, name, audience, min_age, max_age, default_participant_count,
          default_duration_minutes, default_locale, maximum_risk_level, default_location, rule_profile,
          skill_beginner_percent, skill_intermediate_percent, skill_advanced_percent,
          default_organization_mode,default_team_size,default_group_split_count,default_station_group_size
        ) VALUES (
          $id::UUID, $name, $audience, $minAge, $maxAge, $participants,
          $duration, $locale, $risk, $location, $ruleProfile,
          $skillBeginner, $skillIntermediate, $skillAdvanced,
          $organizationMode,$teamSize,$groupSplitCount,$stationGroupSize
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
          location: input.defaultLocation ?? "mixed",
          ruleProfile: input.ruleProfile ?? "standard",
          skillBeginner: input.skillDistribution?.beginnerPercent ?? null,
          skillIntermediate: input.skillDistribution?.intermediatePercent ?? null,
          skillAdvanced: input.skillDistribution?.advancedPercent ?? null,
          organizationMode: input.defaultOrganizationMode ?? "solo",
          teamSize: input.defaultOrganizationMode === "team" ? input.defaultTeamSize ?? 2 : null,
          groupSplitCount: input.defaultOrganizationMode === "team" ? null : input.defaultGroupSplitCount ?? null,
          stationGroupSize: input.defaultStationGroupSize ?? null,
        },
      );
      await replaceGroupEquipmentDefaults(connection, id, input.defaultEquipment ?? []);
      await replaceGroupPreferredFormats(connection, id, input.preferredFormats ?? []);
      await connection.run("COMMIT");
    } catch (error) {
      await connection.run("ROLLBACK");
      throw error;
    }
  });
  return id;
}

export async function updateClubGroup(id: string, input: ClubGroupInput): Promise<boolean> {
  assertUuid(id);
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    await connection.run("BEGIN TRANSACTION");
    try {
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
          default_location=COALESCE($location, default_location),
          rule_profile=COALESCE($ruleProfile, rule_profile),
          skill_beginner_percent=$skillBeginner,
          skill_intermediate_percent=$skillIntermediate,
          skill_advanced_percent=$skillAdvanced,
          default_organization_mode=COALESCE($organizationMode,default_organization_mode),
          default_team_size=$teamSize,
          default_group_split_count=$groupSplitCount,
          default_station_group_size=$stationGroupSize,
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
          location: input.defaultLocation ?? null,
          ruleProfile: input.ruleProfile ?? null,
          skillBeginner: input.skillDistribution?.beginnerPercent ?? null,
          skillIntermediate: input.skillDistribution?.intermediatePercent ?? null,
          skillAdvanced: input.skillDistribution?.advancedPercent ?? null,
          organizationMode: input.defaultOrganizationMode ?? null,
          teamSize: input.defaultOrganizationMode === "team" ? input.defaultTeamSize ?? 2 : null,
          groupSplitCount: input.defaultOrganizationMode === "team" ? null : input.defaultGroupSplitCount ?? null,
          stationGroupSize: input.defaultStationGroupSize ?? null,
        },
      );
      if (reader.getRows().length === 0) {
        await connection.run("ROLLBACK");
        return false;
      }
      if (input.defaultEquipment !== undefined) {
        await replaceGroupEquipmentDefaults(connection, id, input.defaultEquipment);
      }
      if (input.preferredFormats !== undefined) {
        await replaceGroupPreferredFormats(connection, id, input.preferredFormats);
      }
      await connection.run("COMMIT");
      return true;
    } catch (error) {
      await connection.run("ROLLBACK");
      throw error;
    }
  });
}

export interface ClubGroupRuleSettings {
  readonly ruleProfile: ClubRuleProfileKey;
  readonly maximumRiskLevel: ClubGroupRiskLevel | null;
}

export async function getClubGroupRuleSettings(id: string): Promise<ClubGroupRuleSettings | null> {
  if (!UUID_PATTERN.test(id)) return null;
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `
      SELECT COALESCE(rule_profile,'standard'),maximum_risk_level
      FROM club_groups
      WHERE id=$id::UUID AND archived=false
      `,
      { id },
    );
    const row = reader.getRows()[0];
    if (!row) return null;
    return {
      ruleProfile: String(row[0] ?? "standard") as ClubRuleProfileKey,
      maximumRiskLevel: row[1] == null ? null : String(row[1]) as ClubGroupRiskLevel,
    };
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
