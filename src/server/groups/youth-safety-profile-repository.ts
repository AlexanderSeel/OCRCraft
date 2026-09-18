import "server-only";

import { randomUUID } from "node:crypto";
import type { DuckDBConnection } from "@duckdb/node-api";
import type { YouthSafetyRuleOverlay } from "@/domain/training/club-rules";
import { assessYouthSafetyProfileCompatibility } from "@/domain/training/youth-safety-profile";
import type { TrainerQualificationLevel } from "@/domain/training/trainer-qualification";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface YouthSafetyProfileRestriction {
  readonly exerciseId: string;
  readonly exerciseName: string;
  readonly reason: string | null;
}

export interface YouthSafetyProfile {
  readonly id: string;
  readonly name: string;
  readonly audience: "kids" | "youth";
  readonly minAge: number;
  readonly maxAge: number;
  readonly maximumRiskLevel: "low" | "medium" | "high";
  readonly maximumImpactLevel: "low" | "moderate" | "high";
  readonly supervisionRequirement: "normal" | "increased" | "direct";
  readonly minimumTrainerQualification: TrainerQualificationLevel;
  readonly notes: string | null;
  readonly archived: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly restrictions: readonly YouthSafetyProfileRestriction[];
}

export interface YouthSafetyProfileInput {
  readonly name: string;
  readonly audience: "kids" | "youth";
  readonly minAge: number;
  readonly maxAge: number;
  readonly maximumRiskLevel: "low" | "medium" | "high";
  readonly maximumImpactLevel: "low" | "moderate" | "high";
  readonly supervisionRequirement: "normal" | "increased" | "direct";
  readonly minimumTrainerQualification: TrainerQualificationLevel;
  readonly notes?: string | null;
  readonly restrictedExerciseIds: readonly string[];
}

function assertUuid(value: string): void {
  if (!UUID_PATTERN.test(value)) throw new Error("Schutzprofil ist ungültig.");
}

async function loadRestrictions(
  connection: DuckDBConnection,
  profileIds: readonly string[],
): Promise<Map<string, YouthSafetyProfileRestriction[]>> {
  const result = new Map<string, YouthSafetyProfileRestriction[]>();
  if (profileIds.length === 0) return result;
  const reader = await connection.runAndReadAll(`
    SELECT
      r.profile_id::VARCHAR,
      r.exercise_id::VARCHAR,
      COALESCE(t.name,e.canonical_name),
      r.reason
    FROM club_youth_safety_profile_restrictions r
    JOIN exercises e ON e.id=r.exercise_id
    LEFT JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='de'
    WHERE list_contains(string_split($profileIds,','),r.profile_id::VARCHAR)
    ORDER BY r.profile_id::VARCHAR,COALESCE(t.name,e.canonical_name)
  `, { profileIds: profileIds.join(",") });
  for (const row of reader.getRows()) {
    const profileId = String(row[0]);
    const items = result.get(profileId) ?? [];
    items.push({
      exerciseId: String(row[1]),
      exerciseName: String(row[2]),
      reason: row[3] == null ? null : String(row[3]),
    });
    result.set(profileId, items);
  }
  return result;
}

export async function listYouthSafetyProfiles(
  includeArchived = false,
): Promise<readonly YouthSafetyProfile[]> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      SELECT id::VARCHAR,name,audience,min_age,max_age,maximum_risk_level,
        maximum_impact_level,supervision_requirement,notes,archived,created_at,updated_at,
        COALESCE(minimum_trainer_qualification,'assistant')
      FROM club_youth_safety_profiles
      WHERE $includeArchived OR archived=false
      ORDER BY archived,audience,min_age,name
    `, { includeArchived });
    const rows = reader.getRows();
    const restrictions = await loadRestrictions(connection, rows.map((row) => String(row[0])));
    return rows.map((row) => ({
      id: String(row[0]),
      name: String(row[1]),
      audience: String(row[2]) as "kids" | "youth",
      minAge: Number(row[3]),
      maxAge: Number(row[4]),
      maximumRiskLevel: String(row[5]) as "low" | "medium" | "high",
      maximumImpactLevel: String(row[6]) as "low" | "moderate" | "high",
      supervisionRequirement: String(row[7]) as "normal" | "increased" | "direct",
      notes: row[8] == null ? null : String(row[8]),
      archived: Boolean(row[9]),
      createdAt: String(row[10]),
      updatedAt: String(row[11]),
      minimumTrainerQualification: String(row[12] ?? "assistant") as TrainerQualificationLevel,
      restrictions: restrictions.get(String(row[0])) ?? [],
    }));
  });
}

async function replaceRestrictions(
  connection: DuckDBConnection,
  profileId: string,
  exerciseIds: readonly string[],
): Promise<void> {
  await connection.run(
    "DELETE FROM club_youth_safety_profile_restrictions WHERE profile_id=$profileId::UUID",
    { profileId },
  );
  for (const exerciseId of [...new Set(exerciseIds)]) {
    if (!UUID_PATTERN.test(exerciseId)) throw new Error("Gesperrte Übung ist ungültig.");
    const exists = await connection.runAndReadAll(
      `SELECT 1 FROM exercise_obstacle_guidance g
       JOIN exercises e ON e.id=g.exercise_id
       WHERE g.exercise_id=$exerciseId::UUID AND e.archived=false LIMIT 1`,
      { exerciseId },
    );
    if (exists.getRows().length === 0) {
      throw new Error("Gesperrtes Hindernis ist nicht mehr aktiv.");
    }
    await connection.run(
      `INSERT INTO club_youth_safety_profile_restrictions (profile_id,exercise_id,reason)
       VALUES ($profileId::UUID,$exerciseId::UUID,'Durch Schutzprofil explizit gesperrt.')`,
      { profileId, exerciseId },
    );
  }
}

export async function createYouthSafetyProfile(input: YouthSafetyProfileInput): Promise<string> {
  await ensureDatabaseReady();
  const id = randomUUID();
  await withDuckDbConnection(async (connection) => {
    await connection.run("BEGIN TRANSACTION");
    try {
      await connection.run(`
        INSERT INTO club_youth_safety_profiles (
          id,name,audience,min_age,max_age,maximum_risk_level,maximum_impact_level,
          supervision_requirement,notes,minimum_trainer_qualification
        ) VALUES (
          $id::UUID,$name,$audience,$minAge,$maxAge,$maximumRisk,$maximumImpact,
          $supervision,$notes,$minimumTrainerQualification
        )
      `, {
        id,
        name: input.name.trim(),
        audience: input.audience,
        minAge: input.minAge,
        maxAge: input.maxAge,
        maximumRisk: input.maximumRiskLevel,
        maximumImpact: input.maximumImpactLevel,
        supervision: input.supervisionRequirement,
        notes: input.notes?.trim() || null,
        minimumTrainerQualification: input.minimumTrainerQualification,
      });
      await replaceRestrictions(connection, id, input.restrictedExerciseIds);
      await connection.run("COMMIT");
    } catch (error) {
      await connection.run("ROLLBACK");
      throw error;
    }
  });
  return id;
}

export async function updateYouthSafetyProfile(
  id: string,
  input: YouthSafetyProfileInput,
): Promise<boolean> {
  assertUuid(id);
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    await connection.run("BEGIN TRANSACTION");
    try {
      const linkedGroups = await connection.runAndReadAll(`
        SELECT audience,min_age,max_age
        FROM club_groups
        WHERE youth_safety_profile_id=$id::UUID AND archived=false
      `, { id });
      for (const row of linkedGroups.getRows()) {
        const compatibility = assessYouthSafetyProfileCompatibility(
          {
            audience: String(row[0]) as "kids" | "youth" | "adults" | "mixed",
            minAge: row[1] == null ? null : Number(row[1]),
            maxAge: row[2] == null ? null : Number(row[2]),
          },
          { audience: input.audience, minAge: input.minAge, maxAge: input.maxAge },
        );
        if (!compatibility.compatible) {
          throw new Error("Profiländerung wäre mit einer verknüpften aktiven Gruppe nicht kompatibel.");
        }
      }
      const reader = await connection.runAndReadAll(`
        UPDATE club_youth_safety_profiles
        SET name=$name,audience=$audience,min_age=$minAge,max_age=$maxAge,
          maximum_risk_level=$maximumRisk,maximum_impact_level=$maximumImpact,
          supervision_requirement=$supervision,notes=$notes,
          minimum_trainer_qualification=$minimumTrainerQualification,updated_at=current_timestamp
        WHERE id=$id::UUID
        RETURNING id::VARCHAR
      `, {
        id,
        name: input.name.trim(),
        audience: input.audience,
        minAge: input.minAge,
        maxAge: input.maxAge,
        maximumRisk: input.maximumRiskLevel,
        maximumImpact: input.maximumImpactLevel,
        supervision: input.supervisionRequirement,
        notes: input.notes?.trim() || null,
        minimumTrainerQualification: input.minimumTrainerQualification,
      });
      if (reader.getRows().length === 0) {
        await connection.run("ROLLBACK");
        return false;
      }
      await replaceRestrictions(connection, id, input.restrictedExerciseIds);
      await connection.run("COMMIT");
      return true;
    } catch (error) {
      await connection.run("ROLLBACK");
      throw error;
    }
  });
}

export async function setYouthSafetyProfileArchived(id: string, archived: boolean): Promise<boolean> {
  assertUuid(id);
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    if (archived) {
      const linked = await connection.runAndReadAll(
        "SELECT count(*) FROM club_groups WHERE youth_safety_profile_id=$id::UUID AND archived=false",
        { id },
      );
      if (Number(linked.getRows()[0]?.[0] ?? 0) > 0) {
        throw new Error("Schutzprofil wird noch von aktiven Gruppen verwendet.");
      }
    }
    const reader = await connection.runAndReadAll(`
      UPDATE club_youth_safety_profiles
      SET archived=$archived,updated_at=current_timestamp
      WHERE id=$id::UUID
      RETURNING id::VARCHAR
    `, { id, archived });
    return reader.getRows().length === 1;
  });
}

export async function getYouthSafetyProfileForGroup(
  groupId: string,
): Promise<YouthSafetyRuleOverlay | null> {
  if (!UUID_PATTERN.test(groupId)) return null;
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      SELECT p.id::VARCHAR,p.name,p.audience,p.maximum_risk_level,
        p.maximum_impact_level,p.supervision_requirement,g.min_age,g.max_age,
        COALESCE(p.minimum_trainer_qualification,'assistant')
      FROM club_groups g
      JOIN club_youth_safety_profiles p ON p.id=g.youth_safety_profile_id
      WHERE g.id=$groupId::UUID AND g.archived=false AND p.archived=false
    `, { groupId });
    const row = reader.getRows()[0];
    if (!row) return null;
    const restrictionReader = await connection.runAndReadAll(
      "SELECT exercise_id::VARCHAR FROM club_youth_safety_profile_restrictions WHERE profile_id=$profileId::UUID",
      { profileId: String(row[0]) },
    );
    return {
      name: String(row[1]),
      audience: String(row[2]) as "kids" | "youth",
      maximumRiskLevel: String(row[3]) as "low" | "medium" | "high",
      maximumImpactLevel: String(row[4]) as "low" | "moderate" | "high",
      supervisionRequirement: String(row[5]) as "normal" | "increased" | "direct",
      restrictedExerciseIds: restrictionReader.getRows().map((item) => String(item[0])),
      minimumParticipantAge: Number(row[6]),
      maximumParticipantAge: Number(row[7]),
      minimumTrainerQualification: String(row[8] ?? "assistant") as TrainerQualificationLevel,
    };
  });
}
