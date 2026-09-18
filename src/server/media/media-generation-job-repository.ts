import "server-only";

import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";

export interface MediaGenerationQueueSummary {
  readonly queued: number;
  readonly running: number;
  readonly succeededRecent: number;
  readonly failedRecent: number;
}

export interface EnqueueMediaGenerationJobsResult {
  readonly queued: number;
  readonly skipped: number;
}

export interface ClaimedMediaGenerationJob {
  readonly id: string;
  readonly exerciseId: string;
}

export interface RecentMediaGenerationJob {
  readonly id: string;
  readonly exerciseId: string;
  readonly exerciseName: string;
  readonly status: "queued" | "running" | "succeeded" | "failed";
  readonly assetId: string | null;
  readonly errorMessage: string | null;
  readonly createdAt: string;
  readonly startedAt: string | null;
  readonly finishedAt: string | null;
}

export async function getMediaGenerationQueueSummary(): Promise<MediaGenerationQueueSummary> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      SELECT
        count(*) FILTER (WHERE status='queued'),
        count(*) FILTER (WHERE status='running'),
        count(*) FILTER (WHERE status='succeeded' AND created_at >= current_timestamp - INTERVAL '24 hours'),
        count(*) FILTER (WHERE status='failed' AND created_at >= current_timestamp - INTERVAL '24 hours')
      FROM exercise_image_generation_jobs
    `);
    const row = reader.getRows()[0] ?? [];
    return {
      queued: Number(row[0] ?? 0),
      running: Number(row[1] ?? 0),
      succeededRecent: Number(row[2] ?? 0),
      failedRecent: Number(row[3] ?? 0),
    };
  });
}

export async function listRecentMediaGenerationJobs(
  limit = 12,
): Promise<readonly RecentMediaGenerationJob[]> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      SELECT
        j.id::VARCHAR,
        j.exercise_id::VARCHAR,
        COALESCE(t.name,e.canonical_name),
        j.status,
        j.asset_id::VARCHAR,
        j.error_message,
        j.created_at,
        j.started_at,
        j.finished_at
      FROM exercise_image_generation_jobs j
      JOIN exercises e ON e.id=j.exercise_id
      LEFT JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='de'
      ORDER BY j.created_at DESC,j.id DESC
      LIMIT $limit
    `, { limit: Math.max(1, Math.min(50, limit)) });

    return reader.getRows().map((row) => ({
      id: String(row[0]),
      exerciseId: String(row[1]),
      exerciseName: String(row[2]),
      status: String(row[3]) as RecentMediaGenerationJob["status"],
      assetId: row[4] == null ? null : String(row[4]),
      errorMessage: row[5] == null ? null : String(row[5]),
      createdAt: String(row[6]),
      startedAt: row[7] == null ? null : String(row[7]),
      finishedAt: row[8] == null ? null : String(row[8]),
    }));
  });
}

export async function enqueueExerciseImageGenerationJobs(
  exerciseIds: readonly string[],
): Promise<EnqueueMediaGenerationJobsResult> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    await connection.run("BEGIN TRANSACTION");
    let queued = 0;
    let skipped = 0;
    try {
      for (const exerciseId of exerciseIds) {
        const eligibleReader = await connection.runAndReadAll(`
          SELECT count(*)
          FROM exercises
          WHERE id=$exerciseId::UUID AND archived=false
        `, { exerciseId });
        if (Number(eligibleReader.getRows()[0]?.[0] ?? 0) !== 1) {
          skipped += 1;
          continue;
        }

        const activeReader = await connection.runAndReadAll(`
          SELECT count(*)
          FROM exercise_image_generation_jobs
          WHERE exercise_id=$exerciseId::UUID AND status IN ('queued','running')
        `, { exerciseId });
        if (Number(activeReader.getRows()[0]?.[0] ?? 0) > 0) {
          skipped += 1;
          continue;
        }

        await connection.run(`
          INSERT INTO exercise_image_generation_jobs (exercise_id, action, status)
          VALUES ($exerciseId::UUID, 'generate_ai_image', 'queued')
        `, { exerciseId });
        queued += 1;
      }

      await connection.run("COMMIT");
      return { queued, skipped };
    } catch (error) {
      await connection.run("ROLLBACK");
      throw error;
    }
  });
}

export async function requeueStaleMediaGenerationJobs(): Promise<number> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      UPDATE exercise_image_generation_jobs
      SET status='queued', started_at=NULL,
        error_message='Previous worker stopped before completion; job was queued again.',
        updated_at=current_timestamp
      WHERE status='running'
        AND started_at < current_timestamp - INTERVAL '20 minutes'
      RETURNING id
    `);
    return reader.getRows().length;
  });
}

export async function claimNextMediaGenerationJob(): Promise<ClaimedMediaGenerationJob | null> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      UPDATE exercise_image_generation_jobs
      SET status='running', started_at=current_timestamp, error_message=NULL, updated_at=current_timestamp
      WHERE id=(
        SELECT id
        FROM exercise_image_generation_jobs
        WHERE status='queued'
        ORDER BY created_at,id
        LIMIT 1
      )
        AND status='queued'
      RETURNING id::VARCHAR,exercise_id::VARCHAR
    `);
    const row = reader.getRows()[0];
    return row ? { id: String(row[0]), exerciseId: String(row[1]) } : null;
  });
}

export async function markMediaGenerationJobSucceeded(jobId: string, assetId: string): Promise<void> {
  await ensureDatabaseReady();
  await withDuckDbConnection(async (connection) => {
    await connection.run(`
      UPDATE exercise_image_generation_jobs
      SET status='succeeded', asset_id=$assetId::UUID, finished_at=current_timestamp,
        error_message=NULL, updated_at=current_timestamp
      WHERE id=$jobId::UUID
    `, { jobId, assetId });
  });
}

export async function markMediaGenerationJobFailed(jobId: string, errorMessage: string): Promise<void> {
  await ensureDatabaseReady();
  await withDuckDbConnection(async (connection) => {
    await connection.run(`
      UPDATE exercise_image_generation_jobs
      SET status='failed', error_message=$errorMessage, finished_at=current_timestamp,
        updated_at=current_timestamp
      WHERE id=$jobId::UUID
    `, { jobId, errorMessage: errorMessage.slice(0, 1000) });
  });
}

export async function failQueuedMediaGenerationJobs(errorMessage: string): Promise<number> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      UPDATE exercise_image_generation_jobs
      SET status='failed', error_message=$errorMessage, finished_at=current_timestamp,
        updated_at=current_timestamp
      WHERE status='queued'
      RETURNING id
    `, { errorMessage: errorMessage.slice(0, 1000) });
    return reader.getRows().length;
  });
}
export async function deleteFailedMediaGenerationJob(jobId:string):Promise<boolean>{ await ensureDatabaseReady(); return withDuckDbConnection(async c=>{const r=await c.runAndReadAll("DELETE FROM exercise_image_generation_jobs WHERE id=$jobId::UUID AND status='failed' RETURNING id",{jobId});return r.getRows().length===1;}); }
