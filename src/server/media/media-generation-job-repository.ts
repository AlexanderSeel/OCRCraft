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
    await connection.run("BEGIN TRANSACTION");
    try {
      const reader = await connection.runAndReadAll(`
        SELECT id::VARCHAR, exercise_id::VARCHAR
        FROM exercise_image_generation_jobs
        WHERE status='queued'
        ORDER BY created_at, id
        LIMIT 1
      `);
      const row = reader.getRows()[0];
      if (!row) {
        await connection.run("COMMIT");
        return null;
      }

      const id = String(row[0]);
      const exerciseId = String(row[1]);
      await connection.run(`
        UPDATE exercise_image_generation_jobs
        SET status='running', started_at=current_timestamp, error_message=NULL, updated_at=current_timestamp
        WHERE id=$id::UUID AND status='queued'
      `, { id });
      await connection.run("COMMIT");
      return { id, exerciseId };
    } catch (error) {
      await connection.run("ROLLBACK");
      throw error;
    }
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
