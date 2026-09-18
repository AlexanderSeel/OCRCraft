import "server-only";

import { assessExerciseDuplicate, shouldReviewDuplicate, type DuplicateClassification, type DuplicateExerciseRecord } from "@/domain/exercise/duplicate-detection";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import { recordAuditEvent } from "@/server/db/audit-service";
import { safeExerciseImageUri } from "@/server/exercises/exercise-image-uri";
import type { DuckDBConnection } from "@duckdb/node-api";

export interface DuplicateReviewTask {
  readonly id: string;
  readonly leftExerciseId: string;
  readonly rightExerciseId: string;
  readonly leftName: string;
  readonly rightName: string;
  readonly score: number;
  readonly classification: DuplicateClassification;
  readonly reasons: readonly string[];
  readonly status: "open" | "merged" | "ignored";
}

export interface DuplicateComparisonRecord {
  readonly id: string;
  readonly name: string;
  readonly summary: string;
  readonly category: string;
  readonly phase: string;
  readonly riskLevel: string;
  readonly minAge: number | null;
  readonly equipment: readonly string[];
  readonly bodyRegions: readonly string[];
  readonly purpose: string;
  readonly setup: string;
  readonly safetyNotes: string;
  readonly imageUrl: string | null;
}

interface DuplicateRow extends DuplicateExerciseRecord { readonly name: string; }

async function loadRecords(connection: DuckDBConnection): Promise<DuplicateRow[]> {
  const reader = await connection.runAndReadAll(`
    SELECT e.id::VARCHAR,
      COALESCE(string_agg(DISTINCT t.name, ' | '), ''),
      COALESCE((SELECT string_agg(DISTINCT a.alias, ' | ') FROM exercise_aliases a WHERE a.exercise_id=e.id), ''),
      COALESCE(e.category, ''),
      COALESCE((SELECT string_agg(DISTINCT eq.name_en, ' | ') FROM exercise_equipment ee JOIN equipment eq ON eq.id=ee.equipment_id WHERE ee.exercise_id=e.id), ''),
      COALESCE((SELECT string_agg(DISTINCT ebr.body_region_id, ' | ') FROM exercise_body_regions ebr WHERE ebr.exercise_id=e.id), ''),
      COALESCE((SELECT string_agg(sr.notes, ' ') FROM exercise_source_references sr WHERE sr.exercise_id=e.id), '')
    FROM exercises e JOIN exercise_translations t ON t.exercise_id=e.id
    WHERE e.archived=false GROUP BY e.id, e.category ORDER BY e.id
  `);
  return reader.getRows().map((row) => ({
    id: String(row[0]), name: String(row[1]).split(" | ")[0] ?? "",
    names: String(row[1]).split(" | ").filter(Boolean), aliases: String(row[2]).split(" | ").filter(Boolean),
    category: String(row[3]), equipment: String(row[4]).split(" | ").filter(Boolean), bodyRegions: String(row[5]).split(" | ").filter(Boolean),
    sourceRecordId: (String(row[6]).match(/source_record_id=([^;\s]+)/)?.[1] ?? null),
  }));
}

export async function refreshDuplicateReviewTasks(): Promise<number> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const records = await loadRecords(connection);
    let created = 0;
    for (let leftIndex = 0; leftIndex < records.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < records.length; rightIndex += 1) {
        const left = records[leftIndex]; const right = records[rightIndex];
        const assessment = assessExerciseDuplicate(left, right);
        if (!shouldReviewDuplicate(assessment)) continue;
        const existing = await connection.runAndReadAll(`SELECT 1 FROM exercise_duplicate_tasks WHERE left_exercise_id=$left::UUID AND right_exercise_id=$right::UUID AND status='open' LIMIT 1`, { left: left.id, right: right.id });
        if (existing.getRows().length) continue;
        await connection.run(`INSERT INTO exercise_duplicate_tasks (left_exercise_id,right_exercise_id,similarity_score,classification,reasons) VALUES ($left::UUID,$right::UUID,$score,$classification,$reasons)`, { left: left.id, right: right.id, score: assessment.score, classification: assessment.classification, reasons: assessment.reasons.join("; ") });
        created += 1;
      }
    }
    return created;
  });
}

export async function listDuplicateReviewTasks(limit = 100): Promise<readonly DuplicateReviewTask[]> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      SELECT d.id::VARCHAR,d.left_exercise_id::VARCHAR,d.right_exercise_id::VARCHAR,
        COALESCE(lt.name,''),COALESCE(rt.name,''),d.similarity_score,COALESCE(d.classification,'probable_duplicate'),d.reasons,d.status
      FROM exercise_duplicate_tasks d
      JOIN exercise_translations lt ON lt.exercise_id=d.left_exercise_id AND lt.locale='de'
      JOIN exercise_translations rt ON rt.exercise_id=d.right_exercise_id AND rt.locale='de'
      WHERE d.status='open' ORDER BY d.similarity_score DESC LIMIT $limit
    `, { limit });
    return reader.getRows().map((row) => ({ id: String(row[0]), leftExerciseId: String(row[1]), rightExerciseId: String(row[2]), leftName: String(row[3]), rightName: String(row[4]), score: Number(row[5]), classification: String(row[6]) as DuplicateClassification, reasons: String(row[7]).split("; "), status: String(row[8]) as DuplicateReviewTask["status"] }));
  });
}

export async function getDuplicateComparisonRecords(
  exerciseIds: readonly string[],
): Promise<ReadonlyMap<string, DuplicateComparisonRecord>> {
  const ids = [...new Set(exerciseIds.map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) return new Map();
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      SELECT e.id::VARCHAR,
        COALESCE(t.name, ''), COALESCE(t.summary, ''), COALESCE(e.category, ''),
        COALESCE(e.default_phase, ''), COALESCE(e.risk_level, ''), e.min_age,
        COALESCE((SELECT string_agg(DISTINCT COALESCE(eq.name_de, eq.name_en), ' | ')
          FROM exercise_equipment ee JOIN equipment eq ON eq.id=ee.equipment_id WHERE ee.exercise_id=e.id), ''),
        COALESCE((SELECT string_agg(DISTINCT ebr.body_region_id, ' | ')
          FROM exercise_body_regions ebr WHERE ebr.exercise_id=e.id), ''),
        COALESCE(d.purpose, ''), COALESCE(d.setup, ''), COALESCE(d.safety_notes, ''),
        (SELECT m.storage_uri FROM exercise_media_assets m
          WHERE m.exercise_id=e.id AND m.generation_status='generated' AND (m.review_status IS NULL OR m.review_status<>'rejected')
          ORDER BY m.created_at DESC, m.id DESC LIMIT 1)
      FROM exercises e
      LEFT JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='de'
      LEFT JOIN exercise_details d ON d.exercise_id=e.id AND d.locale='de'
      WHERE list_contains(string_split($exerciseIds, ','), e.id::VARCHAR)
    `, { exerciseIds: ids.join(",") });
    const result = new Map<string, DuplicateComparisonRecord>();
    for (const row of reader.getRows()) {
      result.set(String(row[0]), {
        id: String(row[0]), name: String(row[1]), summary: String(row[2]), category: String(row[3]),
        phase: String(row[4]), riskLevel: String(row[5]), minAge: row[6] == null ? null : Number(row[6]),
        equipment: String(row[7]).split(" | ").filter(Boolean), bodyRegions: String(row[8]).split(" | ").filter(Boolean),
        purpose: String(row[9]), setup: String(row[10]), safetyNotes: String(row[11]), imageUrl: safeExerciseImageUri(row[12]),
      });
    }
    return result;
  });
}

export async function resolveDuplicateTask(taskId: string, keepExerciseId: string, status: "merged" | "ignored" = "merged", resolutionDecision: "keep_both" | "keep_one" | "not_duplicate" = status === "ignored" ? "not_duplicate" : "keep_one"): Promise<void> {
  await ensureDatabaseReady();
  await withDuckDbConnection(async (connection) => {
    await connection.run("BEGIN TRANSACTION");
    try {
      if (status === "merged") await connection.run("UPDATE exercises SET archived=true, updated_at=current_timestamp WHERE id=(SELECT CASE WHEN left_exercise_id=$keep::UUID THEN right_exercise_id ELSE left_exercise_id END FROM exercise_duplicate_tasks WHERE id=$task::UUID)", { task: taskId, keep: keepExerciseId });
      await connection.run("UPDATE exercise_duplicate_tasks SET status=$status,resolution_decision=$resolutionDecision,resolved_at=current_timestamp WHERE id=$task::UUID", { task: taskId, status, resolutionDecision });
      await connection.run("COMMIT");
    } catch (error) { await connection.run("ROLLBACK"); throw error; }
  });
  await recordAuditEvent({ action: `duplicate.${resolutionDecision}`, entityType: "exercise_duplicate_task", entityId: taskId, metadata: { keepExerciseId } });
}
