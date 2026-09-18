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
}

export interface MediaGenerationCandidate {
  readonly exerciseId: string;
  readonly exerciseName: string;
  readonly seedKey: string | null;
  readonly category: string;
  readonly imageAssetCount: number;
  readonly failedImageCount: number;
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
        count(*) FILTER (WHERE generation_status='failed')
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
      LIMIT $limit
    `, {
      query: query.trim(),
      reviewStatus,
      generationStatus,
      sourceType,
      mediaType,
      limit: Math.max(1, Math.min(500, limit)),
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
      generatedAt: row[26] == null ? null : String(row[26]),
      createdAt: String(row[27]),
      errorMessage: row[28] == null ? null : String(row[28]),
    }));
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
      activeJobCount: Number(row[6] ?? 0),
    }));
  });
}

export async function setMediaReviewStatus(
  assetId: string,
  reviewStatus: "pending" | "approved" | "rejected",
): Promise<boolean> {
  if (!UUID_PATTERN.test(assetId)) return false;
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      UPDATE exercise_media_assets
      SET review_status=$reviewStatus, updated_at=current_timestamp
      WHERE id=$assetId::UUID
        AND (
          $reviewStatus<>'approved'
          OR source_type<>'external_reference'
          OR (
            COALESCE(rights_status,'unreviewed')='approved'
            AND COALESCE(trim(license_label),'')<>''
            AND COALESCE(trim(source_reference),'')<>''
            AND (COALESCE(consent_required,false)=false OR COALESCE(consent_confirmed,false)=true)
          )
        )
      RETURNING id::VARCHAR
    `, { assetId, reviewStatus });
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
