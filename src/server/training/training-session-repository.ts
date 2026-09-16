import "server-only";

import { randomUUID } from "node:crypto";
import type { TrainingDraft } from "@/domain/training/draft";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";

export interface PersistTrainingDraftOptions {
  readonly title?: string;
  readonly locale?: "de" | "en";
}

export interface TrainingSessionListItem {
  readonly id: string;
  readonly title: string;
  readonly status: "draft" | "ready" | "completed" | "archived";
  readonly source: string;
  readonly totalDurationMinutes: number;
  readonly locale: "de" | "en";
  readonly itemCount: number;
  readonly createdAt: string;
}

export async function persistTrainingDraft(
  draft: TrainingDraft,
  { title, locale = "de" }: PersistTrainingDraftOptions = {},
): Promise<string> {
  await ensureDatabaseReady();

  const blockingIssues = draft.validationIssues.filter((issue) => issue.severity === "error");
  if (blockingIssues.length > 0) {
    throw new Error(`TrainingDraft ist nicht speicherbar: ${blockingIssues.map((issue) => issue.message).join(" ")}`);
  }

  const sessionId = randomUUID();
  const sessionTitle = title?.trim() || draft.session.title;

  await withDuckDbConnection(async (connection) => {
    await connection.run("BEGIN TRANSACTION");
    try {
      await connection.run(
        `
        INSERT INTO training_sessions (
          id, title, group_id, status, source, total_duration_minutes, locale, notes
        ) VALUES (
          $id::UUID, $title, NULL, 'draft', 'manual', $duration, $locale,
          'Quick Create · deterministic composer'
        )
        `,
        {
          id: sessionId,
          title: sessionTitle,
          duration: draft.session.totalDurationMinutes,
          locale,
        },
      );

      for (const [phaseIndex, phase] of draft.session.phases.entries()) {
        const phaseId = randomUUID();
        await connection.run(
          `
          INSERT INTO training_phases (
            id, training_session_id, kind, title, sort_order
          ) VALUES ($id::UUID, $sessionId::UUID, $kind, $title, $sortOrder)
          `,
          {
            id: phaseId,
            sessionId,
            kind: phase.kind,
            title: phase.title,
            sortOrder: phaseIndex,
          },
        );

        for (const [itemIndex, item] of phase.items.entries()) {
          await connection.run(
            `
            INSERT INTO training_items (
              id, training_phase_id, exercise_id, title_override, format,
              duration_minutes, instructions, level_label, sort_order
            ) VALUES (
              $id::UUID, $phaseId::UUID, $exerciseId::UUID, NULL, $format,
              $duration, $instructions, $levelLabel, $sortOrder
            )
            `,
            {
              id: randomUUID(),
              phaseId,
              exerciseId: item.exercise.id,
              format: item.format ?? null,
              duration: item.durationMinutes,
              instructions: item.instructions ?? null,
              levelLabel: item.levelLabel ?? null,
              sortOrder: itemIndex,
            },
          );
        }
      }

      await connection.run("COMMIT");
    } catch (error) {
      await connection.run("ROLLBACK");
      throw error;
    }
  });

  return sessionId;
}

export async function listTrainingSessions(
  includeArchived = false,
  limit = 100,
): Promise<readonly TrainingSessionListItem[]> {
  await ensureDatabaseReady();

  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `
      SELECT
        s.id::VARCHAR,
        s.title,
        s.status,
        s.source,
        s.total_duration_minutes,
        s.locale,
        (
          SELECT count(*)
          FROM training_phases p
          JOIN training_items i ON i.training_phase_id=p.id
          WHERE p.training_session_id=s.id
        ) AS item_count,
        s.created_at
      FROM training_sessions s
      WHERE $includeArchived OR s.status <> 'archived'
      ORDER BY s.created_at DESC, s.title
      LIMIT $limit
      `,
      {
        includeArchived,
        limit: Math.max(1, Math.min(limit, 500)),
      },
    );

    return reader.getRows().map((row) => ({
      id: String(row[0]),
      title: String(row[1]),
      status: String(row[2]) as TrainingSessionListItem["status"],
      source: String(row[3]),
      totalDurationMinutes: Number(row[4]),
      locale: String(row[5]) as TrainingSessionListItem["locale"],
      itemCount: Number(row[6]),
      createdAt: String(row[7]),
    }));
  });
}
