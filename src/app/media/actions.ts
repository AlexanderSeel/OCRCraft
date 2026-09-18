"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { setMediaReviewStatus } from "@/server/media/media-catalog-repository";
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
