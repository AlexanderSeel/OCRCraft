"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { addExerciseProgressionRelation, deleteExerciseProgressionRelation } from "@/server/exercises/exercise-repository";

const relationSchema = z.object({
  relatedExerciseId: z.string().uuid(),
  type: z.enum(["regression", "progression", "alternative"]),
  notesDe: z.string().trim().max(500),
  notesEn: z.string().trim().max(500),
});

export async function addExerciseProgressionRelationAction(exerciseId: string, formData: FormData): Promise<void> {
  const parsed = relationSchema.safeParse({
    relatedExerciseId: formData.get("relatedExerciseId"),
    type: formData.get("type"),
    notesDe: formData.get("notesDe") ?? "",
    notesEn: formData.get("notesEn") ?? "",
  });
  if (!parsed.success || !(await addExerciseProgressionRelation({ exerciseId, ...parsed.data }))) {
    redirect(`/exercises/${exerciseId}/edit?progressionError=1`);
  }
  revalidatePath(`/exercises/${exerciseId}`);
  revalidatePath(`/exercises/${exerciseId}/edit`);
  redirect(`/exercises/${exerciseId}/edit?progressionSaved=1`);
}

export async function deleteExerciseProgressionRelationAction(exerciseId: string, formData: FormData): Promise<void> {
  const relationId = String(formData.get("relationId") ?? "");
  await deleteExerciseProgressionRelation(relationId, exerciseId);
  revalidatePath(`/exercises/${exerciseId}`);
  revalidatePath(`/exercises/${exerciseId}/edit`);
  redirect(`/exercises/${exerciseId}/edit?progressionSaved=1`);
}
