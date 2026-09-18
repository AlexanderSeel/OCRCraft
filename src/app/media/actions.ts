"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { deleteExternalMediaAsset, saveExternalMediaAsset, setMediaReviewStatus } from "@/server/media/media-catalog-repository";
import { requireAdmin } from "@/server/auth/identity-service";
import { recordAuditEvent } from "@/server/db/audit-service";
import { hasConfiguredExerciseImageProvider } from "@/server/images/configured-image-generator";
import { deleteOrphanedMediaObjects } from "@/server/media/media-maintenance-service";
import { normalizeMediaBatchExerciseIds } from "@/server/media/media-generation-job-core";
import { enqueueExerciseImageGenerationJobs } from "@/server/media/media-generation-job-repository";
import { runExerciseImageGenerationQueue } from "@/server/media/media-generation-worker";

const reviewSchema = z.object({
  assetId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  reviewStatus: z.enum(["pending", "approved", "rejected"]),
});

export async function updateMediaReviewStatusAction(formData: FormData): Promise<void> {
  const parsed = reviewSchema.safeParse({
    assetId: formData.get("assetId"),
    exerciseId: formData.get("exerciseId"),
    reviewStatus: formData.get("reviewStatus"),
  });
  if (!parsed.success) redirect("/media?reviewError=invalid");

  let updated = false;
  try {
    updated = await setMediaReviewStatus(parsed.data.assetId, parsed.data.reviewStatus);
  } catch {
    redirect("/media?reviewError=save");
  }
  if (!updated) redirect("/media?reviewError=missing");

  revalidatePath("/media");
  revalidatePath("/exercises");
  revalidatePath(`/exercises/${parsed.data.exerciseId}`);
  revalidatePath(`/exercises/${parsed.data.exerciseId}/edit`);
  redirect(`/media?reviewSaved=${parsed.data.reviewStatus}`);
}


const mediaBatchActionSchema = z.enum(["generate_ai_image"]);

export async function queueMediaBatchAction(formData: FormData): Promise<void> {
  const batchAction = mediaBatchActionSchema.safeParse(formData.get("batchAction"));
  if (!batchAction.success) redirect("/media?batchError=action");

  const exerciseIds = normalizeMediaBatchExerciseIds(
    formData.getAll("exerciseId").map((value) => String(value)),
  );
  if (exerciseIds.length === 0) redirect("/media?batchError=selection");
  if (!(await hasConfiguredExerciseImageProvider())) redirect("/media?batchError=config");

  let queued = 0;
  let skipped = 0;
  try {
    const result = await enqueueExerciseImageGenerationJobs(exerciseIds);
    queued = result.queued;
    skipped = result.skipped;
  } catch {
    redirect("/media?batchError=save");
  }

  if (queued > 0) {
    after(async () => {
      await runExerciseImageGenerationQueue();
    });
  }

  revalidatePath("/media");
  const query = new URLSearchParams({
    batchQueued: String(queued),
    batchSkipped: String(skipped),
  });
  redirect(`/media?${query.toString()}`);
}


export async function retryMediaGenerationJobAction(formData: FormData): Promise<void> {
  const exerciseId = z.string().uuid().safeParse(formData.get("exerciseId"));
  if (!exerciseId.success) redirect("/media?batchError=selection");
  if (!(await hasConfiguredExerciseImageProvider())) redirect("/media?batchError=config");

  let queued = 0;
  try {
    const result = await enqueueExerciseImageGenerationJobs([exerciseId.data]);
    queued = result.queued;
  } catch {
    redirect("/media?batchError=save");
  }

  if (queued > 0) {
    after(async () => {
      await runExerciseImageGenerationQueue();
    });
  }

  revalidatePath("/media");
  redirect(`/media?jobRetried=${queued > 0 ? "queued" : "active"}`);
}


export async function cleanupOrphanedMediaAction(): Promise<void> {
  let deleted = 0;
  try {
    const actor = await requireAdmin();
    const result = await deleteOrphanedMediaObjects();
    deleted = result.deleted;
    await recordAuditEvent({
      action: "media.orphan_cleanup",
      entityType: "media_storage",
      actorType: "user",
      actorId: actor.id,
      metadata: {
        storageProvider: result.storageProvider,
        deleted: result.deleted,
      },
    });
  } catch {
    redirect("/media?cleanupError=1");
  }

  revalidatePath("/media");
  redirect("/media?cleanupRemoved=" + String(deleted));
}


const externalMediaSchema = z.object({
  assetId: z.string().uuid().optional(),
  exerciseId: z.string().uuid(),
  mediaType: z.enum(["image", "video"]),
  mediaUrl: z.string().trim().url(),
  thumbnailUrl: z.string().trim().url().optional().or(z.literal("")),
  provider: z.string().trim().max(160).optional(),
  sourceReference: z.string().trim().url(),
  licenseLabel: z.string().trim().min(1).max(240),
  attributionText: z.string().trim().max(500).optional(),
  usageNote: z.string().trim().max(1000).optional(),
  rightsStatus: z.enum(["unreviewed", "approved", "restricted"]),
  consentRequired: z.boolean(),
  consentConfirmed: z.boolean(),
});

export async function saveExternalMediaAction(formData: FormData): Promise<void> {
  const actor = await requireAdmin();
  const parsed = externalMediaSchema.safeParse({
    assetId: String(formData.get("assetId") ?? "").trim() || undefined,
    exerciseId: formData.get("exerciseId"),
    mediaType: formData.get("mediaType"),
    mediaUrl: formData.get("mediaUrl"),
    thumbnailUrl: String(formData.get("thumbnailUrl") ?? "").trim(),
    provider: String(formData.get("provider") ?? "").trim(),
    sourceReference: formData.get("sourceReference"),
    licenseLabel: formData.get("licenseLabel"),
    attributionText: String(formData.get("attributionText") ?? "").trim(),
    usageNote: String(formData.get("usageNote") ?? "").trim(),
    rightsStatus: formData.get("rightsStatus"),
    consentRequired: formData.get("consentRequired") === "on",
    consentConfirmed: formData.get("consentConfirmed") === "on",
  });
  if (!parsed.success) redirect("/media?externalError=invalid");

  let assetId = parsed.data.assetId ?? "";
  try {
    assetId = await saveExternalMediaAsset({
      assetId: parsed.data.assetId,
      exerciseId: parsed.data.exerciseId,
      mediaType: parsed.data.mediaType,
      mediaUrl: parsed.data.mediaUrl,
      thumbnailUrl: parsed.data.thumbnailUrl || null,
      provider: parsed.data.provider || null,
      sourceReference: parsed.data.sourceReference,
      licenseLabel: parsed.data.licenseLabel,
      attributionText: parsed.data.attributionText || null,
      usageNote: parsed.data.usageNote || null,
      rightsStatus: parsed.data.rightsStatus,
      consentRequired: parsed.data.consentRequired,
      consentConfirmed: parsed.data.consentConfirmed,
    });
    await recordAuditEvent({
      action: parsed.data.assetId ? "media.external.update" : "media.external.create",
      entityType: "exercise_media_asset",
      entityId: assetId,
      actorType: "user",
      actorId: actor.id,
      metadata: {
        exerciseId: parsed.data.exerciseId,
        mediaType: parsed.data.mediaType,
        rightsStatus: parsed.data.rightsStatus,
      },
    });
  } catch {
    redirect("/media?externalError=save");
  }

  revalidatePath("/media");
  revalidatePath("/exercises");
  revalidatePath("/exercises/" + parsed.data.exerciseId);
  redirect("/media?externalSaved=" + encodeURIComponent(assetId));
}

export async function deleteExternalMediaAction(formData: FormData): Promise<void> {
  const actor = await requireAdmin();
  const assetId = z.string().uuid().safeParse(formData.get("assetId"));
  if (!assetId.success) redirect("/media?externalError=invalid");

  let deleted = false;
  try {
    deleted = await deleteExternalMediaAsset(assetId.data);
    if (deleted) await recordAuditEvent({
      action: "media.external.delete",
      entityType: "exercise_media_asset",
      entityId: assetId.data,
      actorType: "user",
      actorId: actor.id,
    });
  } catch {
    redirect("/media?externalError=save");
  }
  if (!deleted) redirect("/media?externalError=missing");

  revalidatePath("/media");
  revalidatePath("/exercises");
  redirect("/media?externalDeleted=1");
}
