import "server-only";

import { randomUUID } from "node:crypto";
import type { TrainingDraft } from "@/domain/training/draft";
import type { TrainingOrganizationMode, TrainingPhaseKind } from "@/domain/training/model";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type TrainingSessionStatus = "draft" | "ready" | "completed" | "archived";
export type PersistedTrainingSource = "manual" | "ai";

export interface TrainingGenerationContext {
  readonly builderMode: "local" | "ai";
  readonly providerId?: string | null;
  readonly providerModel?: string | null;
  readonly request: unknown;
  readonly trainerReviewed: boolean;
}

export interface PersistTrainingDraftOptions {
  readonly title?: string;
  readonly locale?: "de" | "en";
  readonly groupId?: string | null;
  readonly source?: PersistedTrainingSource;
  readonly notes?: string | null;
  readonly generation?: TrainingGenerationContext | null;
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
  readonly mainPartIndex: number | null;
  readonly mainPartTitle: string | null;
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
  readonly organizationMode: TrainingOrganizationMode;
  readonly teamSize: number | null;
  readonly phases: readonly PersistedTrainingPhase[];
}

export async function persistTrainingDraft(
  draft: TrainingDraft,
  {
    title,
    locale = "de",
    groupId = null,
    source = draft.source === "ai" ? "ai" : "manual",
    notes = draft.source === "ai"
      ? "Quick Create · AI proposal · deterministic OCRCraft validation"
      : "Quick Create · local deterministic sports composer",
    generation = null,
  }: PersistTrainingDraftOptions = {},
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
  const organizationMode = draft.session.group.organizationMode ?? "solo";
  const teamSize = organizationMode === "team" ? draft.session.group.teamSize ?? null : null;

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
          id, title, group_id, status, source, total_duration_minutes, locale, notes,
          organization_mode, team_size
        ) VALUES (
          $id::UUID, $title, $groupId::UUID, 'draft', $source, $duration, $locale, $notes,
          $organizationMode, $teamSize
        )
        `,
        {
          id: sessionId,
          title: sessionTitle,
          groupId,
          source,
          duration: draft.session.totalDurationMinutes,
          locale,
          notes,
          organizationMode,
          teamSize,
        },
      );

      if (generation) {
        await connection.run(
          `
          INSERT INTO training_generation_history (
            id, training_session_id, builder_mode, provider_id, provider_model,
            request_json, trainer_reviewed
          ) VALUES (
            $id::UUID, $sessionId::UUID, $builderMode, $providerId, $providerModel,
            $requestJson, $trainerReviewed
          )
          `,
          {
            id: randomUUID(),
            sessionId,
            builderMode: generation.builderMode,
            providerId: generation.providerId ?? null,
            providerModel: generation.providerModel ?? null,
            requestJson: JSON.stringify(generation.request),
            trainerReviewed: generation.trainerReviewed,
          },
        );
      }

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
          const mainPartIndex = phase.kind === "main" ? item.mainPartIndex ?? 1 : null;
          const mainPartTitle = phase.kind === "main"
            ? item.mainPartTitle?.trim() || (mainPartIndex > 1 ? `Hauptteil ${mainPartIndex}` : "Hauptteil")
            : null;
          await connection.run(
            `
            INSERT INTO training_items (
              id, training_phase_id, exercise_id, title_override, format,
              duration_minutes, instructions, level_label, sort_order,
              main_part_index, main_part_title
            ) VALUES (
              $id::UUID, $phaseId::UUID, $exerciseId::UUID, NULL, $format,
              $duration, $instructions, $levelLabel, $sortOrder,
              $mainPartIndex, $mainPartTitle
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
              mainPartIndex,
              mainPartTitle,
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
        ),
        s.created_at
      FROM training_sessions s
      WHERE $includeArchived OR s.status <> 'archived'
      ORDER BY s.created_at DESC
      LIMIT $limit
      `,
      { includeArchived, limit },
    );

    return reader.getRows().map((row) => ({
      id: String(row[0]),
      title: String(row[1]),
      status: String(row[2]) as TrainingSessionStatus,
      source: String(row[3]),
      totalDurationMinutes: Number(row[4]),
      locale: String(row[5]) as "de" | "en",
      itemCount: Number(row[6]),
      createdAt: String(row[7]),
    }));
  });
}

export async function getTrainingSessionById(id: string): Promise<TrainingSessionDetail | null> {
  if (!UUID_PATTERN.test(id)) return null;
  await ensureDatabaseReady();

  return withDuckDbConnection(async (connection) => {
    const sessionReader = await connection.runAndReadAll(
      `
      SELECT
        s.id::VARCHAR,s.title,s.status,s.source,s.total_duration_minutes,s.locale,
        (SELECT count(*) FROM training_phases p JOIN training_items i ON i.training_phase_id=p.id WHERE p.training_session_id=s.id),
        s.created_at,s.notes,s.updated_at,COALESCE(s.organization_mode,'solo'),s.team_size
      FROM training_sessions s
      WHERE s.id=$id::UUID
      `,
      { id },
    );
    const sessionRow = sessionReader.getRows()[0];
    if (!sessionRow) return null;

    const phaseReader = await connection.runAndReadAll(
      `
      SELECT id::VARCHAR,kind,title,sort_order
      FROM training_phases
      WHERE training_session_id=$id::UUID
      ORDER BY sort_order,id
      `,
      { id },
    );
    const phases: PersistedTrainingPhase[] = [];
    for (const phaseRow of phaseReader.getRows()) {
      const phaseId = String(phaseRow[0]);
      const itemReader = await connection.runAndReadAll(
        `
        SELECT
          i.id::VARCHAR,
          i.exercise_id::VARCHAR,
          COALESCE(t.name,i.title_override,'Unbenannte Übung'),
          i.format,
          i.duration_minutes,
          i.instructions,
          i.level_label,
          i.sort_order,
          i.main_part_index,
          i.main_part_title
        FROM training_items i
        LEFT JOIN exercise_translations t ON t.exercise_id=i.exercise_id AND t.locale=$locale
        WHERE i.training_phase_id=$phaseId::UUID
        ORDER BY i.sort_order,i.id
        `,
        { phaseId, locale: String(sessionRow[5]) },
      );
      phases.push({
        id: phaseId,
        kind: String(phaseRow[1]) as TrainingPhaseKind,
        title: String(phaseRow[2]),
        sortOrder: Number(phaseRow[3]),
        items: itemReader.getRows().map((row) => ({
          id: String(row[0]),
          exerciseId: row[1] == null ? null : String(row[1]),
          exerciseName: String(row[2]),
          format: row[3] == null ? null : String(row[3]),
          durationMinutes: Number(row[4]),
          instructions: row[5] == null ? null : String(row[5]),
          levelLabel: row[6] == null ? null : String(row[6]),
          sortOrder: Number(row[7]),
          mainPartIndex: row[8] == null ? null : Number(row[8]),
          mainPartTitle: row[9] == null ? null : String(row[9]),
        })),
      });
    }

    return {
      id: String(sessionRow[0]),
      title: String(sessionRow[1]),
      status: String(sessionRow[2]) as TrainingSessionStatus,
      source: String(sessionRow[3]),
      totalDurationMinutes: Number(sessionRow[4]),
      locale: String(sessionRow[5]) as "de" | "en",
      itemCount: Number(sessionRow[6]),
      createdAt: String(sessionRow[7]),
      notes: sessionRow[8] == null ? null : String(sessionRow[8]),
      updatedAt: String(sessionRow[9]),
      organizationMode: String(sessionRow[10] ?? "solo") as TrainingOrganizationMode,
      teamSize: sessionRow[11] == null ? null : Number(sessionRow[11]),
      phases,
    };
  });
}

export async function updateTrainingSessionMetadata(
  id: string,
  input: UpdateTrainingSessionMetadataInput,
): Promise<boolean> {
  if (!UUID_PATTERN.test(id)) return false;
  await ensureDatabaseReady();

  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `
      UPDATE training_sessions
      SET title=$title,status=$status,updated_at=current_timestamp
      WHERE id=$id::UUID
      RETURNING id::VARCHAR
      `,
      { id, title: input.title.trim(), status: input.status },
    );
    return reader.getRows().length > 0;
  });
}
