import "server-only";

import { randomUUID } from "node:crypto";
import type { TrainingDraft } from "@/domain/training/draft";
import type { TrainingPhaseKind } from "@/domain/training/model";
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

export interface PersistedTrainingItem {
  readonly id: string;
  readonly exerciseId: string | null;
  readonly exerciseName: string;
  readonly format: string | null;
  readonly durationMinutes: number;
  readonly instructions: string | null;
  readonly levelLabel: string | null;
  readonly sortOrder: number;
}

export interface PersistedTrainingPhase {
  readonly id: string;
  readonly kind: TrainingPhaseKind;
  readonly title: string;
  readonly sortOrder: number;
  readonly items: readonly PersistedTrainingItem[];
}

export interface TrainingSessionDetail extends TrainingSessionListItem {
  readonly notes: string | null;
  readonly updatedAt: string;
  readonly phases: readonly PersistedTrainingPhase[];
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

export async function getTrainingSessionById(id: string): Promise<TrainingSessionDetail | null> {
  await ensureDatabaseReady();

  return withDuckDbConnection(async (connection) => {
    const sessionReader = await connection.runAndReadAll(
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
        s.created_at,
        s.notes,
        s.updated_at
      FROM training_sessions s
      WHERE s.id=$id::UUID
      `,
      { id },
    );
    const sessionRow = sessionReader.getRows()[0];
    if (!sessionRow) return null;

    const locale = String(sessionRow[5]) as TrainingSessionListItem["locale"];
    const phaseReader = await connection.runAndReadAll(
      `
      SELECT
        p.id::VARCHAR,
        p.kind,
        p.title,
        p.sort_order,
        i.id::VARCHAR,
        i.exercise_id::VARCHAR,
        COALESCE(t.name, i.title_override, 'Freier Trainingsblock') AS exercise_name,
        i.format,
        i.duration_minutes,
        i.instructions,
        i.level_label,
        i.sort_order
      FROM training_phases p
      LEFT JOIN training_items i ON i.training_phase_id=p.id
      LEFT JOIN exercise_translations t
        ON t.exercise_id=i.exercise_id AND t.locale=$locale
      WHERE p.training_session_id=$id::UUID
      ORDER BY p.sort_order, i.sort_order
      `,
      { id, locale },
    );

    const phases = new Map<string, {
      id: string;
      kind: TrainingPhaseKind;
      title: string;
      sortOrder: number;
      items: PersistedTrainingItem[];
    }>();

    for (const row of phaseReader.getRows()) {
      const phaseId = String(row[0]);
      let phase = phases.get(phaseId);
      if (!phase) {
        phase = {
          id: phaseId,
          kind: String(row[1]) as TrainingPhaseKind,
          title: String(row[2]),
          sortOrder: Number(row[3]),
          items: [],
        };
        phases.set(phaseId, phase);
      }

      if (row[4] != null) {
        phase.items.push({
          id: String(row[4]),
          exerciseId: row[5] == null ? null : String(row[5]),
          exerciseName: String(row[6]),
          format: row[7] == null ? null : String(row[7]),
          durationMinutes: Number(row[8]),
          instructions: row[9] == null ? null : String(row[9]),
          levelLabel: row[10] == null ? null : String(row[10]),
          sortOrder: Number(row[11]),
        });
      }
    }

    return {
      id: String(sessionRow[0]),
      title: String(sessionRow[1]),
      status: String(sessionRow[2]) as TrainingSessionListItem["status"],
      source: String(sessionRow[3]),
      totalDurationMinutes: Number(sessionRow[4]),
      locale,
      itemCount: Number(sessionRow[6]),
      createdAt: String(sessionRow[7]),
      notes: sessionRow[8] == null ? null : String(sessionRow[8]),
      updatedAt: String(sessionRow[9]),
      phases: [...phases.values()],
    };
  });
}
