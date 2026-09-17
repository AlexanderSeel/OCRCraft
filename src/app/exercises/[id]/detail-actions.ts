"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  updateExerciseLogistics,
  updateLocalizedExerciseDetails,
} from "@/server/exercises/exercise-detail-editor-repository";

const optionalText = z.string().trim().max(4000);

const localizedDetailsSchema = z.object({
  locale: z.enum(["de", "en"]),
  purpose: optionalText,
  setup: optionalText,
  startPosition: optionalText,
  finishReset: optionalText,
  breathingCue: optionalText,
  tempoCue: optionalText,
  safetyNotes: optionalText,
  qualityCriteria: optionalText,
  beginnerPrescription: optionalText,
  standardPrescription: optionalText,
  advancedPrescription: optionalText,
  workRestGuidance: optionalText,
  level1: optionalText,
  level2: optionalText,
  level3: optionalText,
  childYouthVariant: optionalText,
  prerequisites: optionalText,
  fallbackExercise: optionalText,
});

const logisticsSchema = z.object({
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  supervision: z.enum(["normal", "increased", "direct"]),
  spaceRequirement: z.string().trim().min(1).max(120),
  setupSeconds: z.coerce.number().int().min(0).max(3600),
  transitionSeconds: z.coerce.number().int().min(0).max(1800),
  stationCapacity: z.coerce.number().int().min(1).max(100),
});

function stringField(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "");
}

export async function updateLocalizedExerciseDetailsAction(
  exerciseId: string,
  formData: FormData,
): Promise<void> {
  const parsed = localizedDetailsSchema.safeParse({
    locale: stringField(formData, "locale"),
    purpose: stringField(formData, "purpose"),
    setup: stringField(formData, "setup"),
    startPosition: stringField(formData, "startPosition"),
    finishReset: stringField(formData, "finishReset"),
    breathingCue: stringField(formData, "breathingCue"),
    tempoCue: stringField(formData, "tempoCue"),
    safetyNotes: stringField(formData, "safetyNotes"),
    qualityCriteria: stringField(formData, "qualityCriteria"),
    beginnerPrescription: stringField(formData, "beginnerPrescription"),
    standardPrescription: stringField(formData, "standardPrescription"),
    advancedPrescription: stringField(formData, "advancedPrescription"),
    workRestGuidance: stringField(formData, "workRestGuidance"),
    level1: stringField(formData, "level1"),
    level2: stringField(formData, "level2"),
    level3: stringField(formData, "level3"),
    childYouthVariant: stringField(formData, "childYouthVariant"),
    prerequisites: stringField(formData, "prerequisites"),
    fallbackExercise: stringField(formData, "fallbackExercise"),
  });

  if (!parsed.success) {
    redirect(`/exercises/${exerciseId}/edit?detailError=invalid`);
  }

  let saved = false;
  try {
    saved = await updateLocalizedExerciseDetails(exerciseId, parsed.data.locale, parsed.data);
  } catch {
    redirect(`/exercises/${exerciseId}/edit?detailError=save`);
  }
  if (!saved) redirect("/exercises");

  revalidatePath("/exercises");
  revalidatePath(`/exercises/${exerciseId}`);
  revalidatePath(`/exercises/${exerciseId}/edit`);
  redirect(`/exercises/${exerciseId}/edit?detailSaved=${parsed.data.locale}`);
}

export async function updateExerciseLogisticsAction(
  exerciseId: string,
  formData: FormData,
): Promise<void> {
  const parsed = logisticsSchema.safeParse({
    difficulty: stringField(formData, "difficulty"),
    supervision: stringField(formData, "supervision"),
    spaceRequirement: stringField(formData, "spaceRequirement"),
    setupSeconds: stringField(formData, "setupSeconds"),
    transitionSeconds: stringField(formData, "transitionSeconds"),
    stationCapacity: stringField(formData, "stationCapacity"),
  });

  if (!parsed.success) {
    redirect(`/exercises/${exerciseId}/edit?logisticsError=invalid`);
  }

  let saved = false;
  try {
    saved = await updateExerciseLogistics(exerciseId, parsed.data);
  } catch {
    redirect(`/exercises/${exerciseId}/edit?logisticsError=save`);
  }
  if (!saved) redirect("/exercises");

  revalidatePath("/exercises");
  revalidatePath(`/exercises/${exerciseId}`);
  revalidatePath(`/exercises/${exerciseId}/edit`);
  redirect(`/exercises/${exerciseId}/edit?logisticsSaved=1`);
}
