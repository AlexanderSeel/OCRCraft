"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createExercise,
  hardDeleteExercise,
  setExerciseArchived,
  updateExercise,
} from "@/server/exercises/exercise-repository";
import {
  exerciseFormSchema,
  toExerciseDraft,
} from "@/server/exercises/exercise-validation";
import { requireTrainer } from "@/server/auth/identity-service";
import { enqueueExerciseImageGenerationJobs } from "@/server/media/media-generation-job-repository";
import { runExerciseImageGenerationQueue } from "@/server/media/media-generation-worker";
import { deleteExerciseMediaAsset, setPrimaryExerciseMedia } from "@/server/media/media-catalog-repository";
import { recordAuditEvent } from "@/server/db/audit-service";
import { setExerciseFavorite } from "@/server/exercises/exercise-personalization-repository";

export interface ExerciseFormState {
  readonly message?: string;
  readonly errors?: Record<string, readonly string[]>;
}

function rawFields(formData: FormData) {
  return {
    nameDe: String(formData.get("nameDe") ?? ""),
    nameEn: String(formData.get("nameEn") ?? ""),
    summaryDe: String(formData.get("summaryDe") ?? ""),
    summaryEn: String(formData.get("summaryEn") ?? ""),
    aliasesDe: String(formData.get("aliasesDe") ?? ""),
    aliasesEn: String(formData.get("aliasesEn") ?? ""),
    category: String(formData.get("category") ?? "general"),
    phase: String(formData.get("phase") ?? "main"),
    riskLevel: String(formData.get("riskLevel") ?? "low"),
    minAge: String(formData.get("minAge") ?? ""),
  };
}

function validationState(formData: FormData) {
  const parsed = exerciseFormSchema.safeParse(rawFields(formData));
  if (!parsed.success) {
    return {
      success: false as const,
      state: {
        message: "Bitte prüfe die markierten Angaben.",
        errors: parsed.error.flatten().fieldErrors,
      } satisfies ExerciseFormState,
    };
  }
  return { success: true as const, draft: toExerciseDraft(parsed.data) };
}

export async function createExerciseAction(
  _previousState: ExerciseFormState,
  formData: FormData,
): Promise<ExerciseFormState> {
  await requireTrainer();
  const validation = validationState(formData);
  if (!validation.success) return validation.state;

  let id: string;
  try {
    const initialExerciseType = formData.get("initialExerciseType") === "game" ? "game" : "drill";
    id = await createExercise(validation.draft, initialExerciseType);
  } catch {
    return { message: "Die Übung konnte nicht gespeichert werden." };
  }

  revalidatePath("/exercises");
  revalidatePath("/games");
  redirect(`/exercises/${id}/edit?created=1`);
}

export async function updateExerciseAction(
  id: string,
  _previousState: ExerciseFormState,
  formData: FormData,
): Promise<ExerciseFormState> {
  await requireTrainer();
  const validation = validationState(formData);
  if (!validation.success) return validation.state;

  try {
    await updateExercise(id, validation.draft);
  } catch {
    return { message: "Die Änderungen konnten nicht gespeichert werden." };
  }

  revalidatePath("/exercises");
  revalidatePath("/games");
  revalidatePath(`/exercises/${id}/edit`);
  redirect(`/exercises/${id}/edit?saved=1`);
}

export async function setExerciseArchivedAction(
  id: string,
  archived: boolean,
): Promise<void> {
  await requireTrainer();
  await setExerciseArchived(id, archived);
  revalidatePath("/exercises");
  revalidatePath("/games");
  revalidatePath(`/exercises/${id}/edit`);
  redirect(archived ? "/exercises" : `/exercises/${id}/edit?restored=1`);
}

export async function selectExerciseImageAction(id: string, formData: FormData): Promise<void> {
  await requireTrainer();
  const assetId = String(formData.get("assetId") ?? "");
  if (assetId) await setPrimaryExerciseMedia(id, assetId);
  revalidatePath(`/exercises/${id}/edit`);
  revalidatePath(`/exercises/${id}`);
  redirect(`/exercises/${id}/edit?mediaSaved=1`);
}

export async function deleteExerciseMediaAction(id: string, formData: FormData): Promise<void> {
  const actor = await requireTrainer();
  const assetId = z.string().uuid().safeParse(formData.get("assetId"));
  if (!assetId.success) redirect(`/exercises/${id}/edit?mediaError=invalid`);
  const deleted = await deleteExerciseMediaAsset(id, assetId.data);
  if (!deleted) redirect(`/exercises/${id}/edit?mediaError=primary`);
  await recordAuditEvent({
    action: "media.exercise_asset.delete",
    entityType: "exercise_media_asset",
    entityId: assetId.data,
    actorType: "user",
    actorId: actor.id,
    metadata: { exerciseId: id },
  });
  revalidatePath(`/exercises/${id}`);
  revalidatePath(`/exercises/${id}/edit`);
  revalidatePath("/media");
  redirect(`/exercises/${id}/edit?mediaDeleted=1`);
}

export async function generateExerciseImageAction(id: string): Promise<void> {
  await requireTrainer();
  await enqueueExerciseImageGenerationJobs([id]);
  void runExerciseImageGenerationQueue();
  revalidatePath(`/exercises/${id}/edit`);
  redirect(`/exercises/${id}/edit?mediaQueued=1`);
}

export async function hardDeleteExerciseAction(id: string, formData: FormData): Promise<void> {
  if (String(formData.get("confirmation") ?? "") !== "ENDGÜLTIG LÖSCHEN") {
    redirect(`/exercises/${id}/edit?hardDeleteError=confirmation`);
  }
  await hardDeleteExercise(id);
  revalidatePath("/exercises");
  redirect("/exercises");
}


const EXERCISE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function setExerciseFavoriteAction(formData: FormData): Promise<void> {
  const actor = await requireTrainer();
  const exerciseId = String(formData.get("exerciseId") ?? "");
  if (!EXERCISE_ID_PATTERN.test(exerciseId)) return;
  const favorite = formData.get("favorite") === "1";
  await setExerciseFavorite(actor.id,exerciseId,favorite);
  revalidatePath("/exercises");
}
