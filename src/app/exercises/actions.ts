"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createExercise,
  setExerciseArchived,
  updateExercise,
} from "@/server/exercises/exercise-repository";
import {
  exerciseFormSchema,
  toExerciseDraft,
} from "@/server/exercises/exercise-validation";

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
  const validation = validationState(formData);
  if (!validation.success) return validation.state;

  let id: string;
  try {
    id = await createExercise(validation.draft);
  } catch {
    return { message: "Die Übung konnte nicht gespeichert werden." };
  }

  revalidatePath("/exercises");
  redirect(`/exercises/${id}/edit?saved=1`);
}

export async function updateExerciseAction(
  id: string,
  _previousState: ExerciseFormState,
  formData: FormData,
): Promise<ExerciseFormState> {
  const validation = validationState(formData);
  if (!validation.success) return validation.state;

  try {
    await updateExercise(id, validation.draft);
  } catch {
    return { message: "Die Änderungen konnten nicht gespeichert werden." };
  }

  revalidatePath("/exercises");
  revalidatePath(`/exercises/${id}/edit`);
  redirect(`/exercises/${id}/edit?saved=1`);
}

export async function setExerciseArchivedAction(
  id: string,
  archived: boolean,
): Promise<void> {
  await setExerciseArchived(id, archived);
  revalidatePath("/exercises");
  revalidatePath(`/exercises/${id}/edit`);
  redirect(archived ? "/exercises" : `/exercises/${id}/edit?restored=1`);
}
