import "server-only";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  collectSavedTemplateExerciseIds,
  savedTemplateItemCount,
  savedTrainingTemplateSnapshotSchema,
  type SavedTrainingTemplateSnapshot,
} from "@/domain/training/saved-training-template-core";
import { requireTrainer } from "@/server/auth/identity-service";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const createTemplateInputSchema = z.object({
  sessionId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).default(""),
});

const updateTemplateMetadataSchema = z.object({
  templateId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).default(""),
});

export interface ClubTrainingTemplateSummary {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly sourceTrainingId: string | null;
  readonly sourceTrainingTitle: string | null;
  readonly totalDurationMinutes: number;
  readonly itemCount: number;
  readonly organizationMode: "solo" | "team";
  readonly teamSize: number | null;
  readonly createdAt: string;
  readonly createdBy: string | null;
  readonly archived: boolean;
}

export async function createClubTrainingTemplateFromSession(input: {
  readonly sessionId: string;
  readonly name: string;
  readonly description: string;
}): Promise<string> {
  const actor = await requireTrainer();
  const parsed = createTemplateInputSchema.parse(input);
  await ensureDatabaseReady();

  return withDuckDbConnection(async (connection) => {
    const snapshot = await readSessionSnapshot(connection, parsed.sessionId);
    const id = randomUUID();
    await connection.run(
      `INSERT INTO training_saved_templates
        (id,name,description,source_training_session_id,snapshot_json,created_by)
       VALUES ($id::UUID,$name,$description,$sessionId::UUID,$snapshot,$createdBy::UUID)`,
      {
        id,
        name: parsed.name,
        description: parsed.description || null,
        sessionId: parsed.sessionId,
        snapshot: JSON.stringify(snapshot),
        createdBy: actor.id,
      },
    );
    return id;
  });
}

export async function listClubTrainingTemplates(
  includeArchived = false,
  limit = 100,
): Promise<readonly ClubTrainingTemplateSummary[]> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `SELECT
        t.id::VARCHAR,t.name,t.description,t.source_training_session_id::VARCHAR,
        s.title,t.snapshot_json,t.created_at::VARCHAR,COALESCE(u.display_name,u.email),t.archived
       FROM training_saved_templates t
       LEFT JOIN training_sessions s ON s.id=t.source_training_session_id
       LEFT JOIN app_users u ON u.id=t.created_by
       WHERE $includeArchived OR t.archived=false
       ORDER BY t.archived,t.updated_at DESC,t.created_at DESC
       LIMIT $limit`,
      { includeArchived, limit: Math.max(1, Math.min(500, limit)) },
    );

    return reader.getRows().flatMap((row) => {
      const parsed = savedTrainingTemplateSnapshotSchema.safeParse(parseJson(row[5]));
      if (!parsed.success) return [];
      return [{
        id: String(row[0]),
        name: String(row[1]),
        description: row[2] == null ? null : String(row[2]),
        sourceTrainingId: row[3] == null ? null : String(row[3]),
        sourceTrainingTitle: row[4] == null ? null : String(row[4]),
        totalDurationMinutes: parsed.data.session.totalDurationMinutes,
        itemCount: savedTemplateItemCount(parsed.data),
        organizationMode: parsed.data.session.organizationMode,
        teamSize: parsed.data.session.teamSize,
        createdAt: String(row[6]),
        createdBy: row[7] == null ? null : String(row[7]),
        archived: Boolean(row[8]),
      }];
    });
  });
}

export async function instantiateClubTrainingTemplate(templateId: string): Promise<string> {
  const actor = await requireTrainer();
  if (!UUID_PATTERN.test(templateId)) throw new Error("Vereinsvorlage ist ungültig.");
  await ensureDatabaseReady();

  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `SELECT name,snapshot_json FROM training_saved_templates
       WHERE id=$id::UUID AND archived=false LIMIT 1`,
      { id: templateId },
    );
    const row = reader.getRows()[0];
    if (!row) throw new Error("Vereinsvorlage wurde nicht gefunden oder ist archiviert.");

    const parsed = savedTrainingTemplateSnapshotSchema.safeParse(parseJson(row[1]));
    if (!parsed.success) throw new Error("Vereinsvorlage enthält keinen gültigen OCRCraft-Snapshot.");
    const snapshot = parsed.data;
    await assertExerciseReferencesAreActive(connection, snapshot);

    const sessionId = randomUUID();
    await connection.run("BEGIN TRANSACTION");
    try {
      await connection.run(
        `INSERT INTO training_sessions (
          id,title,group_id,status,source,total_duration_minutes,locale,notes,
          organization_mode,team_size,group_split_count,created_by
        ) VALUES (
          $id::UUID,$title,NULL,'draft','template',$duration,$locale,$notes,
          $organizationMode,$teamSize,$groupSplitCount,$createdBy::UUID
        )`,
        {
          id: sessionId,
          title: `${String(row[0])} – Training`,
          duration: snapshot.session.totalDurationMinutes,
          locale: snapshot.session.locale,
          notes: [`Vereinsvorlage · ${String(row[0])}`, snapshot.session.notes].filter(Boolean).join(" · "),
          organizationMode: snapshot.session.organizationMode,
          teamSize: snapshot.session.organizationMode === "team" ? snapshot.session.teamSize : null,
          groupSplitCount: snapshot.session.organizationMode === "solo" ? snapshot.session.groupSplitCount : null,
          createdBy: actor.id,
        },
      );

      for (const phase of [...snapshot.phases].sort((a, b) => a.sortOrder - b.sortOrder)) {
        const phaseId = randomUUID();
        await connection.run(
          `INSERT INTO training_phases (id,training_session_id,kind,title,sort_order)
           VALUES ($id::UUID,$sessionId::UUID,$kind,$title,$sortOrder)`,
          { id: phaseId, sessionId, kind: phase.kind, title: phase.title, sortOrder: phase.sortOrder },
        );

        for (const item of [...phase.items].sort((a, b) => a.sortOrder - b.sortOrder)) {
          await connection.run(
            `INSERT INTO training_items (
              id,training_phase_id,exercise_id,title_override,format,duration_minutes,
              instructions,level_label,sort_order,main_part_index,main_part_title,programming_json
            ) VALUES (
              $id::UUID,$phaseId::UUID,$exerciseId::UUID,$titleOverride,$format,$duration,
              $instructions,$levelLabel,$sortOrder,$mainPartIndex,$mainPartTitle,$programmingJson
            )`,
            {
              id: randomUUID(),
              phaseId,
              exerciseId: item.exerciseId,
              titleOverride: item.titleOverride,
              format: item.format,
              duration: item.durationMinutes,
              instructions: item.instructions,
              levelLabel: item.levelLabel,
              sortOrder: item.sortOrder,
              mainPartIndex: item.mainPartIndex,
              mainPartTitle: item.mainPartTitle,
              programmingJson: item.programming == null ? null : JSON.stringify(item.programming),
            },
          );
        }
      }

      await connection.run("COMMIT");
      return sessionId;
    } catch (error) {
      await connection.run("ROLLBACK");
      throw error;
    }
  });
}

export async function archiveClubTrainingTemplate(templateId: string): Promise<boolean> {
  await requireTrainer();
  if (!UUID_PATTERN.test(templateId)) return false;
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `UPDATE training_saved_templates
       SET archived=true,updated_at=current_timestamp
       WHERE id=$id::UUID AND archived=false
       RETURNING id::VARCHAR`,
      { id: templateId },
    );
    return reader.getRows().length === 1;
  });
}

export async function updateClubTrainingTemplateMetadata(input: {
  readonly templateId: string;
  readonly name: string;
  readonly description: string;
}): Promise<boolean> {
  await requireTrainer();
  const parsed = updateTemplateMetadataSchema.parse(input);
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `UPDATE training_saved_templates
       SET name=$name,description=$description,updated_at=current_timestamp
       WHERE id=$id::UUID AND archived=false
       RETURNING id::VARCHAR`,
      {
        id: parsed.templateId,
        name: parsed.name,
        description: parsed.description || null,
      },
    );
    return reader.getRows().length === 1;
  });
}

async function readSessionSnapshot(
  connection: import("@duckdb/node-api").DuckDBConnection,
  sessionId: string,
): Promise<SavedTrainingTemplateSnapshot> {
  const sessionReader = await connection.runAndReadAll(
    `SELECT title,total_duration_minutes,locale,notes,
      COALESCE(organization_mode,'solo'),team_size,group_split_count
     FROM training_sessions WHERE id=$id::UUID LIMIT 1`,
    { id: sessionId },
  );
  const session = sessionReader.getRows()[0];
  if (!session) throw new Error("Training wurde nicht gefunden.");

  const phaseReader = await connection.runAndReadAll(
    `SELECT id::VARCHAR,kind,title,sort_order
     FROM training_phases WHERE training_session_id=$id::UUID ORDER BY sort_order,id`,
    { id: sessionId },
  );

  const phases = [];
  for (const phase of phaseReader.getRows()) {
    const phaseId = String(phase[0]);
    const itemReader = await connection.runAndReadAll(
      `SELECT exercise_id::VARCHAR,title_override,format,duration_minutes,instructions,level_label,
        sort_order,main_part_index,main_part_title,programming_json
       FROM training_items WHERE training_phase_id=$phaseId::UUID ORDER BY sort_order,id`,
      { phaseId },
    );
    phases.push({
      kind: String(phase[1]),
      title: String(phase[2]),
      sortOrder: Number(phase[3]),
      items: itemReader.getRows().map((item) => ({
        exerciseId: item[0] == null ? null : String(item[0]),
        titleOverride: item[1] == null ? null : String(item[1]),
        format: item[2] == null ? null : String(item[2]),
        durationMinutes: Number(item[3]),
        instructions: item[4] == null ? null : String(item[4]),
        levelLabel: item[5] == null ? null : String(item[5]),
        sortOrder: Number(item[6]),
        mainPartIndex: item[7] == null ? null : Number(item[7]),
        mainPartTitle: item[8] == null ? null : String(item[8]),
        programming: parseJson(item[9]),
      })),
    });
  }

  return savedTrainingTemplateSnapshotSchema.parse({
    version: 1,
    session: {
      title: String(session[0]),
      totalDurationMinutes: Number(session[1]),
      locale: String(session[2]),
      notes: session[3] == null ? null : String(session[3]),
      organizationMode: String(session[4]),
      teamSize: session[5] == null ? null : Number(session[5]),
      groupSplitCount: session[6] == null ? null : Number(session[6]),
    },
    phases,
  });
}

async function assertExerciseReferencesAreActive(
  connection: import("@duckdb/node-api").DuckDBConnection,
  snapshot: SavedTrainingTemplateSnapshot,
): Promise<void> {
  const ids = collectSavedTemplateExerciseIds(snapshot);
  const unavailable: string[] = [];
  for (const id of ids) {
    const reader = await connection.runAndReadAll(
      "SELECT archived FROM exercises WHERE id=$id::UUID LIMIT 1",
      { id },
    );
    const row = reader.getRows()[0];
    if (!row || Boolean(row[0])) unavailable.push(id);
  }
  if (unavailable.length > 0) {
    throw new Error(
      `Vereinsvorlage kann nicht verwendet werden: ${unavailable.length} referenzierte Übung(en) fehlen oder sind archiviert.`,
    );
  }
}

function parseJson(value: unknown): unknown {
  if (value == null) return null;
  try { return JSON.parse(String(value)); } catch { return null; }
}
