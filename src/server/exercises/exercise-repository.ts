import "server-only";

import { randomUUID } from "node:crypto";
import type { ExerciseType } from "@/domain/exercise/classification";
import type {
  ExerciseCategory,
  ExerciseDraft,
  ExercisePhase,
  ExerciseRiskLevel,
} from "@/domain/exercise/model";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import { requireSuperAdmin } from "@/server/auth/identity-service";
import { safeExerciseImageUri } from "./exercise-image-uri";
import type { DuckDBConnection } from "@duckdb/node-api";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface ExerciseListItem {
  readonly id: string;
  readonly seedKey: string | null;
  readonly name: string;
  readonly summary: string;
  readonly category: string;
  readonly phase: string | null;
  readonly riskLevel: ExerciseRiskLevel;
  readonly minAge: number | null;
  readonly archived: boolean;
  readonly equipment: readonly string[];
  readonly imageUrl: string | null;
  readonly imageReviewStatus: string | null;
  /** Attribution/license label for externally sourced preview media. */
  readonly imageLicenseLabel: string | null;
  readonly imageFormat: "exercise_sequence" | "legacy_triptych" | null;
  readonly sequenceStepCount: number | null;
}

export interface ExerciseEditorRecord {
  readonly id: string;
  readonly seedKey: string | null;
  readonly nameDe: string;
  readonly nameEn: string;
  readonly summaryDe: string;
  readonly summaryEn: string;
  readonly aliasesDe: readonly string[];
  readonly aliasesEn: readonly string[];
  readonly category: ExerciseCategory;
  readonly phase: ExercisePhase;
  readonly riskLevel: ExerciseRiskLevel;
  readonly minAge: number | null;
  readonly archived: boolean;
  readonly sourceProvider: string | null;
  readonly sourceUrl: string | null;
  readonly sourceLicenseLabel: string | null;
}

export interface ExerciseCategoryCount {
  readonly category: string;
  readonly count: number;
}

interface ListExercisesOptions {
  readonly query?: string;
  readonly category?: string;
  readonly exerciseType?: ExerciseType;
  readonly locale?: "de" | "en";
  readonly archived?: boolean;
  readonly limit?: number;
  readonly offset?: number;
}

async function refreshSearchDocument(
  connection: DuckDBConnection,
  exerciseId: string,
  locale: "de" | "en",
): Promise<void> {
  const table = locale === "de" ? "search_documents_de" : "search_documents_en";
  const equipmentName = locale === "de" ? "eq.name_de" : "COALESCE(eq.name_en, eq.name_de)";

  await connection.run(`DELETE FROM ${table} WHERE document_id = $documentId`, {
    documentId: `exercise:${exerciseId}`,
  });

  await connection.run(
    `
    INSERT INTO ${table} (
      document_id, entity_type, entity_id, title, aliases, summary,
      tags, body_regions, equipment, instructions
    )
    SELECT
      'exercise:' || e.id::VARCHAR,
      'exercise',
      e.id::VARCHAR,
      t.name,
      COALESCE((
        SELECT string_agg(a.alias, ' ')
        FROM exercise_aliases a
        WHERE a.exercise_id = e.id AND a.locale = $locale
      ), ''),
      COALESCE(t.summary, ''),
      COALESCE(e.category, 'general') || ' ' || COALESCE((
        SELECT string_agg(et.tag_id, ' ')
        FROM exercise_tags et
        WHERE et.exercise_id = e.id
      ), ''),
      COALESCE((
        SELECT string_agg(ebr.body_region_id, ' ')
        FROM exercise_body_regions ebr
        WHERE ebr.exercise_id = e.id
      ), ''),
      COALESCE((
        SELECT string_agg(${equipmentName}, ' ')
        FROM exercise_equipment ee
        JOIN equipment eq ON eq.id = ee.equipment_id
        WHERE ee.exercise_id = e.id
      ), ''),
      COALESCE(t.instructions, '')
    FROM exercises e
    JOIN exercise_translations t ON t.exercise_id = e.id AND t.locale = $locale
    WHERE e.id = $exerciseId::UUID AND e.archived = false
    `,
    { locale, exerciseId },
  );
}

async function markSearchDirty(connection: DuckDBConnection): Promise<void> {
  await connection.run(
    "UPDATE search_index_state SET status='dirty', last_error=NULL WHERE locale IN ('de','en')",
  );
}

async function writeAliases(
  connection: DuckDBConnection,
  exerciseId: string,
  locale: "de" | "en",
  aliases: readonly string[],
): Promise<void> {
  await connection.run(
    "DELETE FROM exercise_aliases WHERE exercise_id=$exerciseId::UUID AND locale=$locale",
    { exerciseId, locale },
  );

  for (const alias of aliases) {
    await connection.run(
      "INSERT OR IGNORE INTO exercise_aliases (exercise_id, locale, alias) VALUES ($exerciseId::UUID, $locale, $alias)",
      { exerciseId, locale, alias },
    );
  }
}

async function writeTranslations(
  connection: DuckDBConnection,
  exerciseId: string,
  draft: ExerciseDraft,
): Promise<void> {
  await connection.run(
    `INSERT OR REPLACE INTO exercise_translations
      (exercise_id, locale, name, summary)
     VALUES ($exerciseId::UUID, 'de', $name, $summary)`,
    { exerciseId, name: draft.nameDe, summary: draft.summaryDe },
  );
  await connection.run(
    `INSERT OR REPLACE INTO exercise_translations
      (exercise_id, locale, name, summary)
     VALUES ($exerciseId::UUID, 'en', $name, $summary)`,
    { exerciseId, name: draft.nameEn, summary: draft.summaryEn },
  );
}

async function updateSearchDocuments(
  connection: DuckDBConnection,
  exerciseId: string,
): Promise<void> {
  await refreshSearchDocument(connection, exerciseId, "de");
  await refreshSearchDocument(connection, exerciseId, "en");
  await markSearchDirty(connection);
}

export async function createExercise(draft: ExerciseDraft, initialExerciseType: ExerciseType = "drill"): Promise<string> {
  await ensureDatabaseReady();
  const id = randomUUID();

  await withDuckDbConnection(async (connection) => {
    const duplicate = await connection.runAndReadAll(`SELECT e.id::VARCHAR FROM exercises e JOIN exercise_translations t ON t.exercise_id=e.id WHERE e.archived=false AND lower(t.name) IN (lower($nameDe), lower($nameEn)) LIMIT 1`, { nameDe: draft.nameDe, nameEn: draft.nameEn });
    if (duplicate.getRows().length) throw new Error("Eine aktive Übung mit diesem Namen existiert bereits.");
    await connection.run("BEGIN TRANSACTION");
    try {
      await connection.run(
        `INSERT INTO exercises
          (id, canonical_name, category, default_phase, risk_level, min_age, indoor, outdoor, exercise_type)
         VALUES ($id::UUID, $canonicalName, $category, $phase, $riskLevel, $minAge, true, true, $exerciseType)`,
        {
          id,
          canonicalName: draft.nameEn || draft.nameDe,
          category: draft.category,
          phase: draft.phase,
          riskLevel: draft.riskLevel,
          minAge: draft.minAge,
          exerciseType: initialExerciseType,
        },
      );
      await writeTranslations(connection, id, draft);
      await writeAliases(connection, id, "de", draft.aliasesDe);
      await writeAliases(connection, id, "en", draft.aliasesEn);
      await updateSearchDocuments(connection, id);
      await connection.run("COMMIT");
    } catch (error) {
      await connection.run("ROLLBACK");
      throw error;
    }
  });

  return id;
}

export async function updateExercise(id: string, draft: ExerciseDraft): Promise<void> {
  await ensureDatabaseReady();
  await withDuckDbConnection(async (connection) => {
    await connection.run("BEGIN TRANSACTION");
    try {
      await connection.run(
        `UPDATE exercises SET
          canonical_name=$canonicalName,
          category=$category,
          default_phase=$phase,
          risk_level=$riskLevel,
          min_age=$minAge,
          updated_at=current_timestamp
         WHERE id=$id::UUID`,
        {
          id,
          canonicalName: draft.nameEn || draft.nameDe,
          category: draft.category,
          phase: draft.phase,
          riskLevel: draft.riskLevel,
          minAge: draft.minAge,
        },
      );
      await writeTranslations(connection, id, draft);
      await writeAliases(connection, id, "de", draft.aliasesDe);
      await writeAliases(connection, id, "en", draft.aliasesEn);
      await updateSearchDocuments(connection, id);
      await connection.run("COMMIT");
    } catch (error) {
      await connection.run("ROLLBACK");
      throw error;
    }
  });
}

export async function setExerciseArchived(id: string, archived: boolean): Promise<void> {
  await ensureDatabaseReady();
  await withDuckDbConnection(async (connection) => {
    await connection.run("BEGIN TRANSACTION");
    try {
      await connection.run(
        "UPDATE exercises SET archived=$archived, updated_at=current_timestamp WHERE id=$id::UUID",
        { id, archived },
      );
      await updateSearchDocuments(connection, id);
      await connection.run("COMMIT");
    } catch (error) {
      await connection.run("ROLLBACK");
      throw error;
    }
  });
}

/** Permanently removes only an archived, non-seed exercise with no operational references. */
export async function hardDeleteExercise(id: string): Promise<void> {
  await requireSuperAdmin();
  await ensureDatabaseReady();
  await withDuckDbConnection(async (connection) => {
    await connection.run("BEGIN TRANSACTION");
    try {
      const exerciseReader = await connection.runAndReadAll(
        "SELECT archived, seed_key FROM exercises WHERE id=$id::UUID",
        { id },
      );
      const exercise = exerciseReader.getRows()[0];
      if (!exercise) throw new Error("exercise-not-found");
      if (!Boolean(exercise[0])) throw new Error("hard-delete-requires-archive");
      if (exercise[1] != null && String(exercise[1]).trim() !== "") throw new Error("seed-exercise-cannot-be-deleted");

      const references = await connection.runAndReadAll(`
        SELECT 'training' AS source FROM training_items WHERE exercise_id=$id::UUID
        UNION ALL SELECT 'media' FROM exercise_media_assets WHERE exercise_id=$id::UUID
        UNION ALL SELECT 'source' FROM exercise_source_references WHERE exercise_id=$id::UUID
        UNION ALL SELECT 'ai-draft' FROM ai_exercise_drafts WHERE approved_exercise_id=$id::UUID
      `, { id });
      if (references.getRows().length > 0) throw new Error(`hard-delete-has-references:${String(references.getRows()[0]?.[0] ?? "unknown")}`);

      await connection.run("DELETE FROM exercise_progression_relations WHERE exercise_id=$id::UUID OR related_exercise_id=$id::UUID", { id });
      for (const table of [
        "exercise_duplicate_tasks", "exercise_muscle_oppositions",
        "exercise_body_regions", "exercise_equipment", "exercise_movement_patterns", "exercise_tags",
        "exercise_training_goals", "exercise_aliases", "exercise_execution_steps", "exercise_coaching_cues",
        "exercise_common_mistakes", "exercise_details", "exercise_training_phases", "exercise_image_generation_jobs", "exercise_obstacle_guidance",
        "exercise_outdoor_variant_equipment", "exercise_running_guidance", "exercise_obstacle_guidance",
        "exercise_carry_guidance",
      ]) {
        await connection.run(`DELETE FROM ${table} WHERE exercise_id=$id::UUID`, { id });
      }
      await connection.run("DELETE FROM exercises WHERE id=$id::UUID", { id });
      await connection.run("COMMIT");
    } catch (error) {
      await connection.run("ROLLBACK");
      throw error;
    }
  });
}

export async function getExerciseById(id: string): Promise<ExerciseEditorRecord | null> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `
      SELECT
        e.id::VARCHAR, e.seed_key, e.category, e.default_phase, e.risk_level, e.min_age, e.archived,
        de.name, COALESCE(de.summary, ''), en.name, COALESCE(en.summary, ''),
        COALESCE((SELECT string_agg(a.alias, ' | ') FROM exercise_aliases a WHERE a.exercise_id=e.id AND a.locale='de'), ''),
        COALESCE((SELECT string_agg(a.alias, ' | ') FROM exercise_aliases a WHERE a.exercise_id=e.id AND a.locale='en'), ''),
        (SELECT sr.provider FROM exercise_source_references sr WHERE sr.exercise_id=e.id ORDER BY sr.created_at DESC LIMIT 1),
        (SELECT sr.source_url FROM exercise_source_references sr WHERE sr.exercise_id=e.id ORDER BY sr.created_at DESC LIMIT 1),
        (SELECT sr.license_label FROM exercise_source_references sr WHERE sr.exercise_id=e.id ORDER BY sr.created_at DESC LIMIT 1)
      FROM exercises e
      JOIN exercise_translations de ON de.exercise_id=e.id AND de.locale='de'
      JOIN exercise_translations en ON en.exercise_id=e.id AND en.locale='en'
      WHERE e.id=$id::UUID
      `,
      { id },
    );
    const row = reader.getRows()[0];
    if (!row) return null;

    return {
      id: String(row[0]),
      seedKey: row[1] == null ? null : String(row[1]),
      category: String(row[2] ?? "general") as ExerciseCategory,
      phase: String(row[3] ?? "main") as ExercisePhase,
      riskLevel: String(row[4]) as ExerciseRiskLevel,
      minAge: row[5] == null ? null : Number(row[5]),
      archived: Boolean(row[6]),
      nameDe: String(row[7]),
      summaryDe: String(row[8]),
      nameEn: String(row[9]),
      summaryEn: String(row[10]),
      aliasesDe: String(row[11] ?? "").split(" | ").filter(Boolean),
      aliasesEn: String(row[12] ?? "").split(" | ").filter(Boolean),
      sourceProvider: row[13] == null ? null : String(row[13]),
      sourceUrl: row[14] == null ? null : String(row[14]),
      sourceLicenseLabel: row[15] == null ? null : String(row[15]),
    };
  });
}

export async function listExercises({
  query = "",
  category,
  exerciseType,
  locale = "de",
  archived = false,
  limit = 80,
  offset = 0,
}: ListExercisesOptions = {}): Promise<readonly ExerciseListItem[]> {
  await ensureDatabaseReady();

  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `
      SELECT
        e.id::VARCHAR,
        e.seed_key,
        t.name,
        COALESCE(t.summary, ''),
        COALESCE(e.category, 'general'),
        e.default_phase,
        e.risk_level,
        e.min_age,
        e.archived,
        COALESCE((
          SELECT string_agg(CASE WHEN $locale = 'de' THEN eq.name_de ELSE COALESCE(eq.name_en, eq.name_de) END, ' | ')
          FROM exercise_equipment ee
          JOIN equipment eq ON eq.id = ee.equipment_id
          WHERE ee.exercise_id = e.id
        ), '') AS equipment_names,
        (
          SELECT m.storage_uri FROM exercise_media_assets m
          WHERE m.exercise_id=e.id AND m.generation_status='generated' AND m.review_status<>'rejected'
          ORDER BY COALESCE(m.is_primary,false) DESC, m.created_at DESC, m.id DESC LIMIT 1
        ) AS image_uri,
        (
          SELECT m.review_status FROM exercise_media_assets m
          WHERE m.exercise_id=e.id AND m.generation_status='generated' AND m.review_status<>'rejected'
          ORDER BY COALESCE(m.is_primary,false) DESC, m.created_at DESC, m.id DESC LIMIT 1
        ),
        (
          SELECT m.illustration_format FROM exercise_media_assets m
          WHERE m.exercise_id=e.id AND m.generation_status='generated' AND m.review_status<>'rejected'
          ORDER BY COALESCE(m.is_primary,false) DESC, m.created_at DESC, m.id DESC LIMIT 1
        ),
        (
          SELECT m.sequence_step_count FROM exercise_media_assets m
          WHERE m.exercise_id=e.id AND m.generation_status='generated' AND m.review_status<>'rejected'
          ORDER BY COALESCE(m.is_primary,false) DESC, m.created_at DESC, m.id DESC LIMIT 1
        ) AS image_review_status
        ,(
          SELECT m.license_label FROM exercise_media_assets m
          WHERE m.exercise_id=e.id AND m.generation_status='generated' AND m.review_status<>'rejected'
          ORDER BY COALESCE(m.is_primary,false) DESC, m.created_at DESC, m.id DESC LIMIT 1
        ) AS image_license_label
      FROM exercises e
      JOIN exercise_translations t ON t.exercise_id = e.id AND t.locale = $locale
      WHERE e.archived = $archived
        AND ($category = '' OR e.category = $category)
        AND ($exerciseType = '' OR COALESCE(e.exercise_type,'drill') = $exerciseType)
        AND (
          $query = ''
          OR t.name ILIKE '%' || $query || '%'
          OR COALESCE(t.summary, '') ILIKE '%' || $query || '%'
          OR COALESCE(e.category, 'general') ILIKE '%' || $query || '%'
          OR EXISTS (
            SELECT 1 FROM exercise_aliases a
            WHERE a.exercise_id = e.id AND a.locale = $locale AND a.alias ILIKE '%' || $query || '%'
          )
        )
      ORDER BY
        CASE WHEN lower(t.name) = lower($query) THEN 0 WHEN t.name ILIKE $query || '%' THEN 1 ELSE 2 END,
        t.name
      LIMIT $limit OFFSET $offset
      `,
      { locale, category: category ?? "", exerciseType: exerciseType ?? "", query: query.trim(), archived, limit, offset },
    );

    return reader.getRows().map((row) => ({
      id: String(row[0]),
      seedKey: row[1] == null ? null : String(row[1]),
      name: String(row[2]),
      summary: String(row[3]),
      category: String(row[4]),
      phase: row[5] == null ? null : String(row[5]),
      riskLevel: String(row[6]) as ExerciseRiskLevel,
      minAge: row[7] == null ? null : Number(row[7]),
      archived: Boolean(row[8]),
      equipment: String(row[9] ?? "").split(" | ").filter(Boolean),
      imageUrl: safeExerciseImageUri(row[10]),
      imageReviewStatus: row[11] == null ? null : String(row[11]),
      imageFormat: row[12] == null ? null : String(row[12]) as "exercise_sequence" | "legacy_triptych",
      sequenceStepCount: row[13] == null ? null : Number(row[13]),
      imageLicenseLabel: row[14] == null ? null : String(row[14]),
    }));
  });
}

export async function getExerciseCategoryCounts(): Promise<readonly ExerciseCategoryCount[]> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      SELECT COALESCE(category, 'general'), count(*)
      FROM exercises
      WHERE archived = false
      GROUP BY category
      ORDER BY category
    `);
    return reader.getRows().map(([category, count]) => ({
      category: String(category),
      count: Number(count),
    }));
  });
}

export type ExerciseProgressionRelationType = "regression" | "progression" | "alternative";

export interface ExerciseProgressionRelation {
  readonly id: string;
  readonly type: ExerciseProgressionRelationType;
  readonly exerciseId: string;
  readonly exerciseName: string;
  readonly notesDe: string;
  readonly notesEn: string;
}

export interface ExerciseRelationOption {
  readonly id: string;
  readonly name: string;
}

export async function listExerciseRelationOptions(exerciseId: string): Promise<readonly ExerciseRelationOption[]> {
  if (!UUID_PATTERN.test(exerciseId)) return [];
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `SELECT e.id::VARCHAR, COALESCE(t.name, e.canonical_name)
       FROM exercises e
       LEFT JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='de'
       WHERE e.id<>$exerciseId::UUID AND e.archived=false
       ORDER BY COALESCE(t.name,e.canonical_name), e.id`,
      { exerciseId },
    );
    return reader.getRows().map((row) => ({ id: String(row[0]), name: String(row[1]) }));
  });
}

export async function addExerciseProgressionRelation(input: {
  readonly exerciseId: string;
  readonly relatedExerciseId: string;
  readonly type: ExerciseProgressionRelationType;
  readonly notesDe: string;
  readonly notesEn?: string;
}): Promise<boolean> {
  if (!UUID_PATTERN.test(input.exerciseId) || !UUID_PATTERN.test(input.relatedExerciseId) || input.exerciseId === input.relatedExerciseId) return false;
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `INSERT INTO exercise_progression_relations (exercise_id,related_exercise_id,relation_type,notes_de,notes_en)
       VALUES ($exerciseId::UUID,$relatedExerciseId::UUID,$type,$notesDe,$notesEn)
       ON CONFLICT (exercise_id,related_exercise_id,relation_type) DO UPDATE SET notes_de=excluded.notes_de, notes_en=excluded.notes_en
       RETURNING id`,
      { ...input, notesEn: input.notesEn ?? "" },
    );
    return reader.getRows().length > 0;
  });
}

export async function deleteExerciseProgressionRelation(id: string, exerciseId: string): Promise<boolean> {
  if (!UUID_PATTERN.test(id) || !UUID_PATTERN.test(exerciseId)) return false;
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      "DELETE FROM exercise_progression_relations WHERE id=$id::UUID AND exercise_id=$exerciseId::UUID RETURNING id",
      { id, exerciseId },
    );
    return reader.getRows().length > 0;
  });
}

export async function getExerciseProgressionRelations(
  exerciseId: string,
  locale: "de" | "en" = "de",
): Promise<readonly ExerciseProgressionRelation[]> {
  if (!UUID_PATTERN.test(exerciseId)) return [];
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `
      SELECT r.id::VARCHAR, r.relation_type, r.related_exercise_id::VARCHAR,
        COALESCE(t.name, 'Unbenannte Übung'), r.notes_de, r.notes_en
      FROM exercise_progression_relations r
      LEFT JOIN exercise_translations t
        ON t.exercise_id=r.related_exercise_id AND t.locale=$locale
      WHERE r.exercise_id=$exerciseId::UUID
      ORDER BY r.relation_type, r.sort_order, r.id
      `,
      { exerciseId, locale },
    );
    return reader.getRows().map((row) => ({
      id: String(row[0]),
      type: String(row[1]) as ExerciseProgressionRelationType,
      exerciseId: String(row[2]),
      exerciseName: String(row[3]),
      notesDe: String(row[4] ?? ""),
      notesEn: String(row[5] ?? ""),
    }));
  });
}

export async function countExercises(options: Pick<ListExercisesOptions, "query" | "category" | "exerciseType" | "archived" | "locale"> = {}): Promise<number> {
  await ensureDatabaseReady();
  const { query = "", category, exerciseType, archived = false, locale = "de" } = options;
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      SELECT count(*) FROM exercises e
      JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale=$locale
      WHERE e.archived=$archived
        AND ($category='' OR e.category=$category)
        AND ($exerciseType='' OR COALESCE(e.exercise_type,'drill')=$exerciseType)
        AND ($query='' OR t.name ILIKE '%' || $query || '%' OR COALESCE(t.summary,'') ILIKE '%' || $query || '%'
          OR EXISTS (SELECT 1 FROM exercise_aliases a WHERE a.exercise_id=e.id AND a.locale=$locale AND a.alias ILIKE '%' || $query || '%'))
    `, { locale, category: category ?? "", exerciseType: exerciseType ?? "", archived, query: query.trim() });
    return Number(reader.getRows()[0]?.[0] ?? 0);
  });
}

