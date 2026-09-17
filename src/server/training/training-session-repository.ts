import "server-only";

import { randomUUID } from "node:crypto";
import type { TrainingDraft } from "@/domain/training/draft";
import type { TrainingPhaseKind } from "@/domain/training/model";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type TrainingSessionStatus = "draft" | "ready" | "completed" | "archived";

export interface PersistTrainingDraftOptions {
  readonly title?: string;
  readonly locale?: "de" | "en";
  readonly groupId?: string | null;
}

export interface UpdateTrainingSessionMetadataInput {
  readonly title: string;
  readonly status: TrainingSessionStatus;
}

export interface TrainingSessionListItem {
  readonly id: string;
  readonly title: string;
  readonly status: TrainingSessionStatus;
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
  { title, locale = "de", groupId = null }: PersistTrainingDraftOptions = {},
): Promise<string> {
  await ensureDatabaseReady();

  const blockingIssues = draft.validationIssues.filter((issue) => issue.severity === "error");
  if (blockingIssues.length > 0) {
    throw new Error(`TrainingDraft ist nicht speicherbar: ${blockingIssues.map((issue) => issue.message).join(" ")}`);
  }
  if (groupId != null && !UUID_PATTERN.test(groupId)) {
    throw new Error("Trainingsgruppe ist ungültig.");
  }

  const sessionId = randomUUID();
  const sessionTitle = title?.trim() || draft.session.title;

  await withDuckDbConnection(async (connection) => {
    await connection.run("BEGIN TRANSACTION");
    try {
      if (groupId) {
        const groupReader = await connection.runAndReadAll(
          "SELECT id::VARCHAR FROM club_groups WHERE id=$groupId::UUID AND archived=false",
          { groupId },
        );
        if (groupReader.getRows().length === 0) {
          throw new Error("Die ausgewählte Trainingsgruppe ist nicht mehr aktiv.");
        }
      }

      await connection.run(
        `
        INSERT INTO training_sessions (
          id, title, group_id, status, source, total_duration_minutes, locale, notes
        ) VALUES (
          $id::UUID, $title, $groupId::UUID, 'draft', 'manual', $duration, $locale,
          'Quick Create · deterministic composer'
        )
        `,
        {
          id: sessionId,
          title: sessionTitle,
          groupId,
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
      status: String(row[2]) as TrainingSessionStatus,
      source: String(row[3]),
      totalDurationMinutes: Number(row[4]),
      locale: String(row[5]) as TrainingSessionListItem["locale"],
      itemCount: Number(row[6]),
      createdAt: String(row[7]),
    }));
  });
}

export async function updateTrainingSessionMetadata(
  id: string,
  input: UpdateTrainingSessionMetadataInput,
): Promise<boolean> {
  await ensureDatabaseReady();
  if (!UUID_PATTERN.test(id)) throw new Error("Training ist ungültig.");
  const title = input.title.trim();
  if (!title) throw new Error("Trainingstitel darf nicht leer sein.");
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `UPDATE training_sessions SET title=$title, status=$status, updated_at=current_timestamp
       WHERE id=$id::UUID AND status <> 'archived' RETURNING id`,
      { id, title, status: input.status },
    );
    return reader.getRows().length === 1;
  });
}

export async function getTrainingSessionById(id: string): Promise<TrainingSessionDetail | null> {
  if (!UUID_PATTERN.test(id)) return null;
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
      status: String(sessionRow[2]) as TrainingSessionStatus,
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

export async function updateTrainingSessionMetadata(
  id: string,
  input: UpdateTrainingSessionMetadataInput,
): Promise<boolean> {
  if (!UUID_PATTERN.test(id)) return false;
  const title = input.title.trim();
  if (!title) throw new Error("Trainingstitel darf nicht leer sein.");

  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `
      UPDATE training_sessions
      SET title=$title, status=$status, updated_at=current_timestamp
      WHERE id=$id::UUID
      RETURNING id::VARCHAR
      `,
      { id, title, status: input.status },
    );
    return reader.getRows().length > 0;
  });
}
