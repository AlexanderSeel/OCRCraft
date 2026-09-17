import "server-only";

import { randomUUID } from "node:crypto";
import type {
  ExerciseCategory,
  ExerciseDraft,
  ExercisePhase,
  ExerciseRiskLevel,
} from "@/domain/exercise/model";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import { safeExerciseImageUri } from "./exercise-image-uri";
import type { DuckDBConnection } from "@duckdb/node-api";

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

export async function createExercise(draft: ExerciseDraft): Promise<string> {
  await ensureDatabaseReady();
  const id = randomUUID();

  await withDuckDbConnection(async (connection) => {
    const duplicate = await connection.runAndReadAll(`SELECT e.id::VARCHAR FROM exercises e JOIN exercise_translations t ON t.exercise_id=e.id WHERE e.archived=false AND lower(t.name) IN (lower($nameDe), lower($nameEn)) LIMIT 1`, { nameDe: draft.nameDe, nameEn: draft.nameEn });
    if (duplicate.getRows().length) throw new Error("Eine aktive Übung mit diesem Namen existiert bereits.");
    await connection.run("BEGIN TRANSACTION");
    try {
      await connection.run(
        `INSERT INTO exercises
          (id, canonical_name, category, default_phase, risk_level, min_age, indoor, outdoor)
         VALUES ($id::UUID, $canonicalName, $category, $phase, $riskLevel, $minAge, true, true)`,
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
          WHERE m.exercise_id=e.id AND m.generation_status='generated'
          ORDER BY m.created_at DESC, m.id DESC LIMIT 1
        ) AS image_uri,
        (
          SELECT m.review_status FROM exercise_media_assets m
          WHERE m.exercise_id=e.id AND m.generation_status='generated'
          ORDER BY m.created_at DESC, m.id DESC LIMIT 1
        ),
        (
          SELECT m.illustration_format FROM exercise_media_assets m
          WHERE m.exercise_id=e.id AND m.generation_status='generated'
          ORDER BY m.created_at DESC, m.id DESC LIMIT 1
        ),
        (
          SELECT m.sequence_step_count FROM exercise_media_assets m
          WHERE m.exercise_id=e.id AND m.generation_status='generated'
          ORDER BY m.created_at DESC, m.id DESC LIMIT 1
        ) AS image_review_status
        ,(
          SELECT m.license_label FROM exercise_media_assets m
          WHERE m.exercise_id=e.id AND m.generation_status='generated'
          ORDER BY m.created_at DESC, m.id DESC LIMIT 1
        ) AS image_license_label
      FROM exercises e
      JOIN exercise_translations t ON t.exercise_id = e.id AND t.locale = $locale
      WHERE e.archived = $archived
        AND ($category = '' OR e.category = $category)
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
      { locale, category: category ?? "", query: query.trim(), archived, limit, offset },
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

export async function countExercises(options: Pick<ListExercisesOptions, "query" | "category" | "archived" | "locale"> = {}): Promise<number> {
  await ensureDatabaseReady();
  const { query = "", category, archived = false, locale = "de" } = options;
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      SELECT count(*) FROM exercises e
      JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale=$locale
      WHERE e.archived=$archived AND ($category='' OR e.category=$category)
        AND ($query='' OR t.name ILIKE '%' || $query || '%' OR COALESCE(t.summary,'') ILIKE '%' || $query || '%'
          OR EXISTS (SELECT 1 FROM exercise_aliases a WHERE a.exercise_id=e.id AND a.locale=$locale AND a.alias ILIKE '%' || $query || '%'))
    `, { locale, category: category ?? "", archived, query: query.trim() });
    return Number(reader.getRows()[0]?.[0] ?? 0);
  });
}
