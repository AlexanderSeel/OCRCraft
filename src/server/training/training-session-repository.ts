import "server-only";

import { randomUUID } from "node:crypto";
import type { TrainingDraft } from "@/domain/training/draft";
import type { MainPartProgramming, TrainingOrganizationMode, TrainingPhaseKind } from "@/domain/training/model";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import { mainPartProgrammingSchema } from "./training-draft-schema";
import { getOptionalCurrentActor } from "@/server/auth/identity-service";

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
  readonly routeName: string | null;
  readonly routeDistanceMetres: number | null;
  readonly routeSurface: string | null;
  readonly routeGpsReference: string | null;
  readonly routeNotes: string | null;
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
  readonly trainerProfile: TrainerProfile | null;
}

export interface TrainerProfile {
  readonly name: string;
  readonly education: string | null;
  readonly bio: string | null;
  readonly specialties: string | null;
  readonly imageUri: string | null;
  readonly imageDataUrl: string | null;
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
  readonly programming: MainPartProgramming | null;
}

export interface PersistedTrainingPhase {
  readonly id: string;
  readonly kind: TrainingPhaseKind;
  readonly title: string;
  readonly sortOrder: number;
  readonly items: readonly PersistedTrainingItem[];
}

export interface TrainingSessionDetail extends TrainingSessionListItem {
  readonly groupId: string | null;
  readonly notes: string | null;
  readonly routeName: string | null;
  readonly routeDistanceMetres: number | null;
  readonly routeSurface: string | null;
  readonly routeGpsReference: string | null;
  readonly routeNotes: string | null;
  readonly updatedAt: string;
  readonly organizationMode: TrainingOrganizationMode;
  readonly teamSize: number | null;
  readonly groupSplitCount: number | null;
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
  const creator = await getOptionalCurrentActor();
  const sessionTitle = title?.trim() || draft.session.title;
  const organizationMode = draft.session.group.organizationMode ?? "solo";
  const teamSize = organizationMode === "team" ? draft.session.group.teamSize ?? null : null;
  const groupSplitCount = organizationMode === "solo" ? draft.session.group.groupSplitCount ?? null : null;

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
          organization_mode, team_size, group_split_count, created_by
        ) VALUES (
          $id::UUID, $title, $groupId::UUID, 'draft', $source, $duration, $locale, $notes,
          $organizationMode, $teamSize, $groupSplitCount, $createdBy::UUID
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
          groupSplitCount,
          createdBy: creator?.id ?? null,
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
            ? item.mainPartTitle?.trim() || ((mainPartIndex ?? 1) > 1 ? `Hauptteil ${mainPartIndex ?? 1}` : "Hauptteil")
            : null;
          const programmingJson = phase.kind === "main" && item.programming
            ? JSON.stringify(item.programming)
            : null;
          await connection.run(
            `
            INSERT INTO training_items (
              id, training_phase_id, exercise_id, title_override, format,
              duration_minutes, instructions, level_label, sort_order,
              main_part_index, main_part_title, programming_json
            ) VALUES (
              $id::UUID, $phaseId::UUID, $exerciseId::UUID, NULL, $format,
              $duration, $instructions, $levelLabel, $sortOrder,
              $mainPartIndex, $mainPartTitle, $programmingJson
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
              programmingJson,
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
        s.created_at,
        u.display_name,u.education,u.bio,u.specialties,u.profile_image_uri,u.profile_image_data,u.profile_image_content_type
      FROM training_sessions s
      LEFT JOIN app_users u ON u.id=s.created_by
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
      trainerProfile: row[8] == null ? null : { name: String(row[8]), education: row[9] == null ? null : String(row[9]), bio: row[10] == null ? null : String(row[10]), specialties: row[11] == null ? null : String(row[11]), imageUri: row[12] == null ? null : String(row[12]), imageDataUrl: row[13] == null || row[14] == null ? null : `data:${String(row[14])};base64,${String(row[13])}` },
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
        s.created_at,s.notes,s.updated_at,
        s.route_name,s.route_distance_metres,s.route_surface,s.route_gps_reference,s.route_notes,
        COALESCE(s.organization_mode,'solo'),s.team_size,s.group_split_count,s.group_id::VARCHAR,
        u.display_name,u.education,u.bio,u.specialties,u.profile_image_uri,u.profile_image_data,u.profile_image_content_type
      FROM training_sessions s
      LEFT JOIN app_users u ON u.id=s.created_by
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
          i.main_part_title,
          i.programming_json
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
          programming: parsePersistedProgramming(row[10]),
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
      groupId: sessionRow[18] == null ? null : String(sessionRow[18]),
      notes: sessionRow[8] == null ? null : String(sessionRow[8]),
      updatedAt: String(sessionRow[9]),
      routeName: sessionRow[10] == null ? null : String(sessionRow[10]),
      routeDistanceMetres: sessionRow[11] == null ? null : Number(sessionRow[11]),
      routeSurface: sessionRow[12] == null ? null : String(sessionRow[12]),
      routeGpsReference: sessionRow[13] == null ? null : String(sessionRow[13]),
      routeNotes: sessionRow[14] == null ? null : String(sessionRow[14]),
      organizationMode: String(sessionRow[15] ?? "solo") as TrainingOrganizationMode,
      teamSize: sessionRow[16] == null ? null : Number(sessionRow[16]),
      groupSplitCount: sessionRow[17] == null ? null : Number(sessionRow[17]),
      trainerProfile: sessionRow[19] == null ? null : { name: String(sessionRow[19]), education: sessionRow[20] == null ? null : String(sessionRow[20]), bio: sessionRow[21] == null ? null : String(sessionRow[21]), specialties: sessionRow[22] == null ? null : String(sessionRow[22]), imageUri: sessionRow[23] == null ? null : String(sessionRow[23]), imageDataUrl: sessionRow[24] == null || sessionRow[25] == null ? null : `data:${String(sessionRow[25])};base64,${String(sessionRow[24])}` },
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
      SET title=$title,status=$status,route_name=$routeName,route_distance_metres=$routeDistanceMetres,
          route_surface=$routeSurface,route_gps_reference=$routeGpsReference,route_notes=$routeNotes,
          updated_at=current_timestamp
      WHERE id=$id::UUID
      RETURNING id::VARCHAR
      `,
      {
        id,
        title: input.title.trim(),
        status: input.status,
        routeName: input.routeName,
        routeDistanceMetres: input.routeDistanceMetres,
        routeSurface: input.routeSurface,
        routeGpsReference: input.routeGpsReference,
        routeNotes: input.routeNotes,
      },
    );
    return reader.getRows().length > 0;
  });
}

function parsePersistedProgramming(value: unknown): MainPartProgramming | null {
  if (value == null) return null;
  try {
    const parsed = mainPartProgrammingSchema.safeParse(JSON.parse(String(value)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
