import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import { safeExerciseImageUri } from "@/server/exercises/exercise-image-uri";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface MediaCatalogFilters {
  readonly query?: string;
  readonly reviewStatus?: string;
  readonly generationStatus?: string;
  readonly sourceType?: string;
  readonly mediaType?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface MediaCatalogItem {
  readonly id: string;
  readonly exerciseId: string;
  readonly exerciseName: string;
  readonly seedKey: string | null;
  readonly mediaType: string;
  readonly sourceType: string;
  readonly provider: string | null;
  readonly model: string | null;
  readonly styleProfile: string | null;
  readonly illustrationFormat: string | null;
  readonly figurePresentation: string | null;
  readonly sequenceStepCount: number | null;
  readonly reviewStatus: string;
  readonly generationStatus: string;
  readonly imageUrl: string | null;
  readonly contentType: string | null;
  readonly width: number | null;
  readonly height: number | null;
  readonly licenseLabel: string | null;
  readonly sourceReference: string | null;
  readonly usageNote: string | null;
  readonly thumbnailUrl: string | null;
  readonly attributionText: string | null;
  readonly rightsStatus: string;
  readonly consentRequired: boolean;
  readonly consentConfirmed: boolean;
  readonly biomechanicsReview: "unreviewed" | "pass" | "needs_changes";
  readonly textMatchReview: "unreviewed" | "pass" | "needs_changes";
  readonly reviewNotes: string | null;
  readonly reviewedBy: string | null;
  readonly reviewerName: string | null;
  readonly reviewedAt: string | null;
  readonly generatedAt: string | null;
  readonly createdAt: string;
  readonly errorMessage: string | null;
}

export interface MediaCatalogSummary {
  readonly total: number;
  readonly generated: number;
  readonly pendingReview: number;
  readonly approved: number;
  readonly rejected: number;
  readonly failed: number;
  readonly rightsBlocked: number;
}

export interface MediaGenerationCandidate {
  readonly exerciseId: string;
  readonly exerciseName: string;
  readonly seedKey: string | null;
  readonly category: string;
  readonly imageAssetCount: number;
  readonly failedImageCount: number;
  readonly rightsBlockedImageCount: number;
  readonly activeJobCount: number;
}

export async function getMediaCatalogSummary(): Promise<MediaCatalogSummary> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      SELECT
        count(*),
        count(*) FILTER (WHERE generation_status='generated'),
        count(*) FILTER (WHERE review_status='pending'),
        count(*) FILTER (WHERE review_status='approved'),
        count(*) FILTER (WHERE review_status='rejected'),
        count(*) FILTER (WHERE generation_status='failed'),
        count(*) FILTER (
          WHERE source_type='external_reference'
            AND media_type IN ('image','illustration')
            AND generation_status='generated'
            AND review_status<>'rejected'
            AND NOT (
              COALESCE(rights_status,'unreviewed')='approved'
              AND COALESCE(trim(license_label),'')<>''
              AND COALESCE(trim(source_reference),'')<>''
              AND (COALESCE(consent_required,false)=false OR COALESCE(consent_confirmed,false)=true)
            )
        )
      FROM exercise_media_assets
    `);
    const row = reader.getRows()[0] ?? [];
    return {
      total: Number(row[0] ?? 0),
      generated: Number(row[1] ?? 0),
      pendingReview: Number(row[2] ?? 0),
      approved: Number(row[3] ?? 0),
      rejected: Number(row[4] ?? 0),
      failed: Number(row[5] ?? 0),
      rightsBlocked: Number(row[6] ?? 0),
    };
  });
}

export async function listMediaCatalog({
  query = "",
  reviewStatus = "",
  generationStatus = "",
  sourceType = "",
  mediaType = "",
  limit = 120,
  offset = 0,
}: MediaCatalogFilters = {}): Promise<readonly MediaCatalogItem[]> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      SELECT
        m.id::VARCHAR,
        m.exercise_id::VARCHAR,
        COALESCE(t.name,e.canonical_name),
        e.seed_key,
        m.media_type,
        m.source_type,
        m.provider,
        m.model,
        m.style_profile,
        m.illustration_format,
        m.figure_presentation,
        m.sequence_step_count,
        m.review_status,
        m.generation_status,
        m.storage_uri,
        m.content_type,
        m.width,
        m.height,
        m.license_label,
        m.source_reference,
        m.usage_note,
        m.thumbnail_uri,
        m.attribution_text,
        COALESCE(m.rights_status,'unreviewed'),
        COALESCE(m.consent_required,false),
        COALESCE(m.consent_confirmed,false),
        COALESCE(m.biomechanics_review,'unreviewed'),
        COALESCE(m.text_match_review,'unreviewed'),
        m.review_notes,
        m.reviewed_by::VARCHAR,
        (
          SELECT u.display_name
          FROM app_users u
          WHERE u.id=m.reviewed_by
          LIMIT 1
        ),
        m.reviewed_at::VARCHAR,
        m.generated_at,
        m.created_at,
        m.error_message
      FROM exercise_media_assets m
      JOIN exercises e ON e.id=m.exercise_id
      LEFT JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='de'
      WHERE
        ($query='' OR COALESCE(t.name,e.canonical_name) ILIKE '%' || $query || '%'
          OR COALESCE(e.seed_key,'') ILIKE '%' || $query || '%')
        AND ($reviewStatus='' OR m.review_status=$reviewStatus)
        AND ($generationStatus='' OR m.generation_status=$generationStatus)
        AND ($sourceType='' OR m.source_type=$sourceType)
        AND ($mediaType='' OR m.media_type=$mediaType)
      ORDER BY
        CASE m.generation_status WHEN 'failed' THEN 0 WHEN 'generating' THEN 1 ELSE 2 END,
        CASE m.review_status WHEN 'pending' THEN 0 WHEN 'rejected' THEN 1 ELSE 2 END,
        m.created_at DESC,
        m.id DESC
      LIMIT $limit OFFSET $offset
    `, {
      query: query.trim(),
      reviewStatus,
      generationStatus,
      sourceType,
      mediaType,
      limit: Math.max(1, Math.min(500, limit)),
      offset: Math.max(0, Math.trunc(offset)),
    });

    return reader.getRows().map((row) => ({
      id: String(row[0]),
      exerciseId: String(row[1]),
      exerciseName: String(row[2]),
      seedKey: row[3] == null ? null : String(row[3]),
      mediaType: String(row[4]),
      sourceType: String(row[5]),
      provider: row[6] == null ? null : String(row[6]),
      model: row[7] == null ? null : String(row[7]),
      styleProfile: row[8] == null ? null : String(row[8]),
      illustrationFormat: row[9] == null ? null : String(row[9]),
      figurePresentation: row[10] == null ? null : String(row[10]),
      sequenceStepCount: row[11] == null ? null : Number(row[11]),
      reviewStatus: String(row[12]),
      generationStatus: String(row[13]),
      imageUrl: safeExerciseImageUri(row[14]),
      contentType: row[15] == null ? null : String(row[15]),
      width: row[16] == null ? null : Number(row[16]),
      height: row[17] == null ? null : Number(row[17]),
      licenseLabel: row[18] == null ? null : String(row[18]),
      sourceReference: row[19] == null ? null : String(row[19]),
      usageNote: row[20] == null ? null : String(row[20]),
      thumbnailUrl: safeExerciseImageUri(row[21]),
      attributionText: row[22] == null ? null : String(row[22]),
      rightsStatus: String(row[23] ?? "unreviewed"),
      consentRequired: Boolean(row[24]),
      consentConfirmed: Boolean(row[25]),
      biomechanicsReview: String(row[26] ?? "unreviewed") as "unreviewed" | "pass" | "needs_changes",
      textMatchReview: String(row[27] ?? "unreviewed") as "unreviewed" | "pass" | "needs_changes",
      reviewNotes: row[28] == null ? null : String(row[28]),
      reviewedBy: row[29] == null ? null : String(row[29]),
      reviewerName: row[30] == null ? null : String(row[30]),
      reviewedAt: row[31] == null ? null : String(row[31]),
      generatedAt: row[32] == null ? null : String(row[32]),
      createdAt: String(row[33]),
      errorMessage: row[34] == null ? null : String(row[34]),
    }));
  });
}

export async function countMediaCatalog(filters: Omit<MediaCatalogFilters, "limit" | "offset"> = {}): Promise<number> {
  await ensureDatabaseReady();
  const query = filters.query?.trim() ?? "";
  const reviewStatus = filters.reviewStatus ?? "";
  const generationStatus = filters.generationStatus ?? "";
  const sourceType = filters.sourceType ?? "";
  const mediaType = filters.mediaType ?? "";
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`SELECT count(*) FROM exercise_media_assets m JOIN exercises e ON e.id=m.exercise_id LEFT JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='de' WHERE ($query='' OR COALESCE(t.name,e.canonical_name) ILIKE '%' || $query || '%' OR COALESCE(e.seed_key,'') ILIKE '%' || $query || '%') AND ($reviewStatus='' OR m.review_status=$reviewStatus) AND ($generationStatus='' OR m.generation_status=$generationStatus) AND ($sourceType='' OR m.source_type=$sourceType) AND ($mediaType='' OR m.media_type=$mediaType)`, { query, reviewStatus, generationStatus, sourceType, mediaType });
    return Number(reader.getRows()[0]?.[0] ?? 0);
  });
}


export async function listMediaGenerationCandidates(
  query = "",
  limit = 24,
): Promise<readonly MediaGenerationCandidate[]> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      SELECT
        e.id::VARCHAR,
        COALESCE(t.name,e.canonical_name),
        e.seed_key,
        COALESCE(e.category,'general'),
        (
          SELECT count(*)
          FROM exercise_media_assets m
          WHERE m.exercise_id=e.id
            AND m.media_type IN ('image','illustration')
        ),
        (
          SELECT count(*)
          FROM exercise_media_assets m
          WHERE m.exercise_id=e.id
            AND m.media_type IN ('image','illustration')
            AND m.generation_status='failed'
        ),
        (
          SELECT count(*)
          FROM exercise_media_assets m
          WHERE m.exercise_id=e.id
            AND m.media_type IN ('image','illustration')
            AND m.source_type='external_reference'
            AND m.generation_status='generated'
            AND m.review_status<>'rejected'
            AND NOT (
              COALESCE(m.rights_status,'unreviewed')='approved'
              AND COALESCE(trim(m.license_label),'')<>''
              AND COALESCE(trim(m.source_reference),'')<>''
              AND (COALESCE(m.consent_required,false)=false OR COALESCE(m.consent_confirmed,false)=true)
            )
        ),
        (
          SELECT count(*)
          FROM exercise_image_generation_jobs j
          WHERE j.exercise_id=e.id
            AND j.status IN ('queued','running')
        )
      FROM exercises e
      LEFT JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='de'
      WHERE e.archived=false
        AND NOT EXISTS (
          SELECT 1
          FROM exercise_media_assets m
          WHERE m.exercise_id=e.id
            AND m.media_type IN ('image','illustration')
            AND m.generation_status='generated'
            AND m.review_status<>'rejected'
            AND (
              m.source_type<>'external_reference'
              OR (
                COALESCE(m.rights_status,'unreviewed')='approved'
                AND COALESCE(trim(m.license_label),'')<>''
                AND COALESCE(trim(m.source_reference),'')<>''
                AND (COALESCE(m.consent_required,false)=false OR COALESCE(m.consent_confirmed,false)=true)
              )
            )
        )
        AND (
          $query=''
          OR COALESCE(t.name,e.canonical_name) ILIKE '%' || $query || '%'
          OR COALESCE(t.summary,'') ILIKE '%' || $query || '%'
          OR COALESCE(e.seed_key,'') ILIKE '%' || $query || '%'
          OR COALESCE(e.category,'') ILIKE '%' || $query || '%'
        )
      ORDER BY
        CASE WHEN (
          SELECT count(*)
          FROM exercise_image_generation_jobs j
          WHERE j.exercise_id=e.id AND j.status IN ('queued','running')
        ) > 0 THEN 1 ELSE 0 END,
        COALESCE(t.name,e.canonical_name),
        e.id
      LIMIT $limit
    `, {
      query: query.trim(),
      limit: Math.max(1, Math.min(100, limit)),
    });

    return reader.getRows().map((row) => ({
      exerciseId: String(row[0]),
      exerciseName: String(row[1]),
      seedKey: row[2] == null ? null : String(row[2]),
      category: String(row[3]),
      imageAssetCount: Number(row[4] ?? 0),
      failedImageCount: Number(row[5] ?? 0),
      rightsBlockedImageCount: Number(row[6] ?? 0),
      activeJobCount: Number(row[7] ?? 0),
    }));
  });
}

export async function setMediaReviewStatus(
  assetId: string,
  reviewStatus: "pending" | "approved" | "rejected",
  reviewerId: string,
): Promise<boolean> {
  if (!UUID_PATTERN.test(assetId) || !UUID_PATTERN.test(reviewerId)) return false;
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      UPDATE exercise_media_assets
      SET
        review_status=$reviewStatus,
        reviewed_by=CASE WHEN $reviewStatus='pending' THEN NULL ELSE $reviewerId::UUID END,
        reviewed_at=CASE WHEN $reviewStatus='pending' THEN NULL ELSE current_timestamp END,
        updated_at=current_timestamp
      WHERE id=$assetId::UUID
        AND (
          $reviewStatus<>'approved'
          OR (
            (
              source_type<>'external_reference'
              OR (
                COALESCE(rights_status,'unreviewed')='approved'
                AND COALESCE(trim(license_label),'')<>''
                AND COALESCE(trim(source_reference),'')<>''
                AND (COALESCE(consent_required,false)=false OR COALESCE(consent_confirmed,false)=true)
              )
            )
            AND (
              NOT (source_type='ai_generated' AND illustration_format='exercise_sequence')
              OR (
                COALESCE(biomechanics_review,'unreviewed')='pass'
                AND COALESCE(text_match_review,'unreviewed')='pass'
              )
            )
          )
        )
      RETURNING id::VARCHAR
    `, { assetId, reviewStatus, reviewerId });
    return reader.getRows().length === 1;
  });
}

export async function approveMediaBatch(input: {
  readonly exerciseIds?: readonly string[];
  readonly filters?: MediaCatalogFilters;
  readonly reviewerId: string;
}): Promise<{ readonly approved: number }> {
  if (!UUID_PATTERN.test(input.reviewerId)) return { approved: 0 };
  const exerciseIds = [...new Set((input.exerciseIds ?? []).filter((id) => UUID_PATTERN.test(id)))];
  const filters = input.filters ?? {};
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const parameters: Record<string, string | null> = {
      reviewerId: input.reviewerId,
      query: filters.query?.trim() ?? "",
      reviewStatus: filters.reviewStatus ?? "",
      generationStatus: filters.generationStatus ?? "",
      sourceType: filters.sourceType ?? "",
      mediaType: filters.mediaType ?? "",
    };
    const idClause = exerciseIds.length
      ? `AND m.exercise_id IN (${exerciseIds.map((id, index) => {
        const key = `exerciseId${index}`;
        parameters[key] = id;
        return `$${key}::UUID`;
      }).join(",")})`
      : "";
    const reader = await connection.runAndReadAll(`
      UPDATE exercise_media_assets m
      SET review_status='approved', reviewed_by=$reviewerId::UUID,
          reviewed_at=current_timestamp, updated_at=current_timestamp
      FROM exercises e
      LEFT JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='de'
      WHERE m.exercise_id=e.id
        ${idClause}
        AND e.archived=false
        AND ($query='' OR COALESCE(t.name,e.canonical_name) ILIKE '%' || $query || '%' OR COALESCE(e.seed_key,'') ILIKE '%' || $query || '%')
        AND ($reviewStatus='' OR m.review_status=$reviewStatus)
        AND ($generationStatus='' OR m.generation_status=$generationStatus)
        AND ($sourceType='' OR m.source_type=$sourceType)
        AND ($mediaType='' OR m.media_type=$mediaType)
        AND m.generation_status='generated'
        AND (
          m.source_type<>'external_reference'
          OR (COALESCE(m.rights_status,'unreviewed')='approved' AND COALESCE(trim(m.license_label),'')<>'' AND COALESCE(trim(m.source_reference),'')<>'' AND (COALESCE(m.consent_required,false)=false OR COALESCE(m.consent_confirmed,false)=true))
        )
        AND (
          NOT (m.source_type='ai_generated' AND m.illustration_format='exercise_sequence')
          OR (COALESCE(m.biomechanics_review,'unreviewed')='pass' AND COALESCE(m.text_match_review,'unreviewed')='pass')
        )
      RETURNING m.id
    `, parameters);
    return { approved: reader.getRows().length };
  });
}

export async function saveMediaSequenceAssessment(input: {
  readonly assetId: string;
  readonly biomechanicsReview: "unreviewed" | "pass" | "needs_changes";
  readonly textMatchReview: "unreviewed" | "pass" | "needs_changes";
  readonly reviewNotes: string;
  readonly reviewerId: string;
}): Promise<boolean> {
  if (!UUID_PATTERN.test(input.assetId) || !UUID_PATTERN.test(input.reviewerId)) return false;
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      UPDATE exercise_media_assets
      SET
        biomechanics_review=$biomechanicsReview,
        text_match_review=$textMatchReview,
        review_notes=$reviewNotes,
        reviewed_by=$reviewerId::UUID,
        reviewed_at=current_timestamp,
        review_status=CASE
          WHEN $biomechanicsReview='pass' AND $textMatchReview='pass' THEN review_status
          ELSE 'pending'
        END,
        updated_at=current_timestamp
      WHERE id=$assetId::UUID
        AND source_type='ai_generated'
        AND illustration_format='exercise_sequence'
        AND generation_status='generated'
      RETURNING id::VARCHAR
    `, {
      assetId: input.assetId,
      biomechanicsReview: input.biomechanicsReview,
      textMatchReview: input.textMatchReview,
      reviewNotes: input.reviewNotes.trim().slice(0, 2000) || null,
      reviewerId: input.reviewerId,
    });
    return reader.getRows().length === 1;
  });
}


export interface SaveExternalMediaAssetInput {
  readonly assetId?: string | null;
  readonly exerciseId: string;
  readonly mediaType: "image" | "video";
  readonly mediaUrl: string;
  readonly thumbnailUrl?: string | null;
  readonly provider?: string | null;
  readonly sourceReference: string;
  readonly licenseLabel: string;
  readonly attributionText?: string | null;
  readonly usageNote?: string | null;
  readonly rightsStatus: "unreviewed" | "approved" | "restricted";
  readonly consentRequired: boolean;
  readonly consentConfirmed: boolean;
}

function requireHttpsUrl(value: string, label: string): string {
  const trimmed = value.trim();
  let url: URL;
  try { url = new URL(trimmed); } catch { throw new Error(label + " ist keine gültige URL."); }
  if (url.protocol !== "https:") throw new Error(label + " muss HTTPS verwenden.");
  return url.toString();
}

export async function saveExternalMediaAsset(input: SaveExternalMediaAssetInput): Promise<string> {
  if (!UUID_PATTERN.test(input.exerciseId)) throw new Error("Ungültige Übungs-ID.");
  if (input.assetId && !UUID_PATTERN.test(input.assetId)) throw new Error("Ungültige Medien-ID.");
  if (input.rightsStatus === "approved" && input.consentRequired && !input.consentConfirmed) {
    throw new Error("Für eine Rechtefreigabe muss die erforderliche Einwilligung bestätigt sein.");
  }
  const mediaUrl = requireHttpsUrl(input.mediaUrl, "Medien-URL");
  const thumbnailUrl = input.thumbnailUrl?.trim()
    ? requireHttpsUrl(input.thumbnailUrl, "Thumbnail-URL")
    : null;
  const sourceReference = requireHttpsUrl(input.sourceReference, "Quellen-URL");
  const licenseLabel = input.licenseLabel.trim();
  if (!licenseLabel) throw new Error("Lizenz/Verwendungsrecht ist erforderlich.");

  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    if (input.assetId) {
      const updated = await connection.runAndReadAll(`
        UPDATE exercise_media_assets
        SET media_type=$mediaType,
            storage_uri=$mediaUrl,
            content_type=$contentType,
            sha256=$sha,
            thumbnail_uri=$thumbnailUrl,
            provider=$provider,
            source_reference=$sourceReference,
            license_label=$licenseLabel,
            attribution_text=$attributionText,
            usage_note=$usageNote,
            rights_status=$rightsStatus,
            consent_required=$consentRequired,
            consent_confirmed=$consentConfirmed,
            review_status=CASE
              WHEN $rightsStatus='approved' AND ($consentRequired=false OR $consentConfirmed=true)
                THEN review_status
              ELSE 'pending'
            END,
            reviewed_by=CASE
              WHEN $rightsStatus='approved' AND ($consentRequired=false OR $consentConfirmed=true)
                THEN reviewed_by
              ELSE NULL
            END,
            reviewed_at=CASE
              WHEN $rightsStatus='approved' AND ($consentRequired=false OR $consentConfirmed=true)
                THEN reviewed_at
              ELSE NULL
            END,
            updated_at=current_timestamp
        WHERE id=$assetId::UUID AND source_type='external_reference'
        RETURNING id::VARCHAR
      `, {
        assetId: input.assetId,
        mediaType: input.mediaType,
        mediaUrl,
        contentType: input.mediaType === "video" ? "video/external" : "image/external",
        sha: createHash("sha256").update(mediaUrl).digest("hex"),
        thumbnailUrl,
        provider: input.provider?.trim() || null,
        sourceReference,
        licenseLabel,
        attributionText: input.attributionText?.trim() || null,
        usageNote: input.usageNote?.trim() || null,
        rightsStatus: input.rightsStatus,
        consentRequired: input.consentRequired,
        consentConfirmed: input.consentConfirmed,
      });
      const id = updated.getRows()[0]?.[0];
      if (id == null) throw new Error("Externes Medium wurde nicht gefunden.");
      return String(id);
    }

    const created = await connection.runAndReadAll(`
      INSERT INTO exercise_media_assets (
        exercise_id,media_type,source_type,provider,
        review_status,generation_status,storage_provider,storage_key,storage_uri,
        content_type,sha256,generated_at,license_label,source_reference,usage_note,
        thumbnail_uri,attribution_text,rights_status,consent_required,consent_confirmed
      ) VALUES (
        $exerciseId,$mediaType,'external_reference',$provider,
        'pending','generated','filesystem',$storageKey,$mediaUrl,
        $contentType,$sha,current_timestamp,$licenseLabel,$sourceReference,$usageNote,
        $thumbnailUrl,$attributionText,$rightsStatus,$consentRequired,$consentConfirmed
      )
      RETURNING id::VARCHAR
    `, {
      exerciseId: input.exerciseId,
      mediaType: input.mediaType,
      provider: input.provider?.trim() || null,
      storageKey: "external-reference/" + randomUUID(),
      mediaUrl,
      contentType: input.mediaType === "video" ? "video/external" : "image/external",
      sha: createHash("sha256").update(mediaUrl).digest("hex"),
      licenseLabel,
      sourceReference,
      usageNote: input.usageNote?.trim() || null,
      thumbnailUrl,
      attributionText: input.attributionText?.trim() || null,
      rightsStatus: input.rightsStatus,
      consentRequired: input.consentRequired,
      consentConfirmed: input.consentConfirmed,
    });
    return String(created.getRows()[0]?.[0]);
  });
}

export async function deleteExternalMediaAsset(assetId: string): Promise<boolean> {
  if (!UUID_PATTERN.test(assetId)) return false;
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const result = await connection.runAndReadAll(`
      DELETE FROM exercise_media_assets
      WHERE id=$assetId::UUID AND source_type='external_reference'
      RETURNING id::VARCHAR
    `, { assetId });
    return result.getRows().length === 1;
  });
}


export interface LegacyTriptychMigrationCandidate {
  readonly exerciseId: string;
  readonly exerciseName: string;
  readonly seedKey: string | null;
  readonly legacyAssetCount: number;
  readonly pendingSequenceCount: number;
  readonly approvedSequenceCount: number;
  readonly activeJobCount: number;
}

export async function listLegacyTriptychMigrationCandidates(
  limit = 40,
): Promise<readonly LegacyTriptychMigrationCandidate[]> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      SELECT
        e.id::VARCHAR,
        COALESCE(t.name,e.canonical_name),
        e.seed_key,
        count(*) FILTER (
          WHERE m.source_type='ai_generated'
            AND m.illustration_format='legacy_triptych'
            AND m.generation_status='generated'
            AND m.review_status<>'rejected'
        ) AS legacy_count,
        (
          SELECT count(*)
          FROM exercise_media_assets s
          WHERE s.exercise_id=e.id
            AND s.source_type='ai_generated'
            AND s.illustration_format='exercise_sequence'
            AND s.generation_status='generated'
            AND s.review_status='pending'
        ) AS pending_sequences,
        (
          SELECT count(*)
          FROM exercise_media_assets s
          WHERE s.exercise_id=e.id
            AND s.source_type='ai_generated'
            AND s.illustration_format='exercise_sequence'
            AND s.generation_status='generated'
            AND s.review_status='approved'
        ) AS approved_sequences,
        (
          SELECT count(*)
          FROM exercise_image_generation_jobs j
          WHERE j.exercise_id=e.id
            AND j.status IN ('queued','running')
        ) AS active_jobs
      FROM exercises e
      JOIN exercise_media_assets m ON m.exercise_id=e.id
      LEFT JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='de'
      WHERE e.archived=false
      GROUP BY e.id,t.name,e.canonical_name,e.seed_key
      HAVING count(*) FILTER (
        WHERE m.source_type='ai_generated'
          AND m.illustration_format='legacy_triptych'
          AND m.generation_status='generated'
          AND m.review_status<>'rejected'
      ) > 0
      ORDER BY
        CASE WHEN (
          SELECT count(*)
          FROM exercise_media_assets s
          WHERE s.exercise_id=e.id
            AND s.source_type='ai_generated'
            AND s.illustration_format='exercise_sequence'
            AND s.generation_status='generated'
            AND s.review_status='approved'
        ) > 0 THEN 0 ELSE 1 END,
        COALESCE(t.name,e.canonical_name)
      LIMIT $limit
    `, { limit: Math.max(1, Math.min(200, limit)) });

    return reader.getRows().map((row) => ({
      exerciseId: String(row[0]),
      exerciseName: String(row[1]),
      seedKey: row[2] == null ? null : String(row[2]),
      legacyAssetCount: Number(row[3] ?? 0),
      pendingSequenceCount: Number(row[4] ?? 0),
      approvedSequenceCount: Number(row[5] ?? 0),
      activeJobCount: Number(row[6] ?? 0),
    }));
  });
}

export async function retireLegacyTriptychsAfterApprovedSequence(
  exerciseId: string,
): Promise<number> {
  if (!UUID_PATTERN.test(exerciseId)) return 0;
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      UPDATE exercise_media_assets
      SET
        review_status='rejected',
        usage_note=CASE
          WHEN COALESCE(trim(usage_note),'')=''
            THEN 'Durch fachlich freigegebene exercise_sequence ersetzt.'
          ELSE usage_note || ' · Durch fachlich freigegebene exercise_sequence ersetzt.'
        END,
        updated_at=current_timestamp
      WHERE exercise_id=$exerciseId::UUID
        AND source_type='ai_generated'
        AND illustration_format='legacy_triptych'
        AND generation_status='generated'
        AND review_status<>'rejected'
        AND EXISTS (
          SELECT 1
          FROM exercise_media_assets replacement
          WHERE replacement.exercise_id=$exerciseId::UUID
            AND replacement.source_type='ai_generated'
            AND replacement.illustration_format='exercise_sequence'
            AND replacement.generation_status='generated'
            AND replacement.review_status='approved'
        )
      RETURNING id::VARCHAR
    `, { exerciseId });
    return reader.getRows().length;
  });
}
export interface ExerciseMediaChoice { readonly id:string; readonly url:string|null; readonly mediaType:string; readonly sourceType:string; readonly reviewStatus:string; readonly generationStatus:string; readonly isPrimary:boolean; }
export async function listExerciseMediaChoices(exerciseId:string):Promise<readonly ExerciseMediaChoice[]>{ await ensureDatabaseReady(); return withDuckDbConnection(async c=>{const r=await c.runAndReadAll("SELECT id::VARCHAR,storage_uri,media_type,source_type,review_status,generation_status,COALESCE(is_primary,false) FROM exercise_media_assets WHERE exercise_id=$exerciseId::UUID ORDER BY is_primary DESC,created_at DESC",{exerciseId}); return r.getRows().map(x=>({id:String(x[0]),url:safeExerciseImageUri(x[1]),mediaType:String(x[2]),sourceType:String(x[3]),reviewStatus:String(x[4]),generationStatus:String(x[5]),isPrimary:Boolean(x[6])}));}); }
export async function setPrimaryExerciseMedia(exerciseId: string, assetId: string): Promise<boolean> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const valid = await connection.runAndReadAll(`
      SELECT 1
      FROM exercise_media_assets
      WHERE id=$assetId::UUID
        AND exercise_id=$exerciseId::UUID
        AND generation_status='generated'
      LIMIT 1
    `, { assetId, exerciseId });
    if (!valid.getRows().length) return false;

    await connection.run("BEGIN TRANSACTION");
    try {
      // DuckDB checks parent FKs during updates. Release only job references
      // that block a real primary-status transition; untouched assets remain
      // fully linked to their generation history.
      await connection.run(`
        UPDATE exercise_image_generation_jobs
        SET asset_id=NULL
        WHERE asset_id IN (
          SELECT id
          FROM exercise_media_assets
          WHERE exercise_id=$exerciseId::UUID
            AND ((COALESCE(is_primary,false)=true AND id<>$assetId::UUID)
              OR (id=$assetId::UUID AND COALESCE(is_primary,false)=false))
        )
      `, { assetId, exerciseId });
      await connection.run(`
        UPDATE exercise_media_assets
        SET is_primary=false, updated_at=current_timestamp
        WHERE exercise_id=$exerciseId::UUID
          AND id<>$assetId::UUID
          AND COALESCE(is_primary,false)=true
      `, { assetId, exerciseId });
      await connection.run(`
        UPDATE exercise_media_assets
        SET is_primary=true, updated_at=current_timestamp
        WHERE id=$assetId::UUID
          AND exercise_id=$exerciseId::UUID
      `, { assetId, exerciseId });
      await connection.run("COMMIT");
      return true;
    } catch (error) {
      await connection.run("ROLLBACK");
      throw error;
    }
  });
}
export async function deleteExerciseMediaAsset(exerciseId: string, assetId: string): Promise<boolean> {
  if (!UUID_PATTERN.test(exerciseId) || !UUID_PATTERN.test(assetId)) return false;
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const referenced = await connection.runAndReadAll(`
      SELECT 1
      FROM exercise_media_assets
      WHERE id=$assetId::UUID
        AND exercise_id=$exerciseId::UUID
        AND COALESCE(is_primary,false)=false
      LIMIT 1
    `, { exerciseId, assetId });
    if (!referenced.getRows().length) return false;
    await connection.run("UPDATE exercise_image_generation_jobs SET asset_id=NULL WHERE asset_id=$assetId::UUID", { assetId });
    const reader = await connection.runAndReadAll(`
      DELETE FROM exercise_media_assets
      WHERE id=$assetId::UUID
        AND exercise_id=$exerciseId::UUID
        AND COALESCE(is_primary,false)=false
      RETURNING id::VARCHAR
    `, { exerciseId, assetId });
    return reader.getRows().length === 1;
  });
}
