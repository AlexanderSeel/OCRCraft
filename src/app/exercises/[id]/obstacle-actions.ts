"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { updateObstacleGuidance } from "@/server/obstacles/obstacle-editor-repository";
import { requireTrainer } from "@/server/auth/identity-service";

const textField = z.string().trim().min(1).max(4000);

const obstacleGuidanceSchema = z.object({
  stationCapacity: z.coerce.number().int().min(1).max(100),
  clearZoneMetres: z.coerce.number().positive().max(50),
  deEquipmentConfiguration: textField,
  dePrerequisites: textField,
  deApproach: textField,
  deExecution: textField,
  deExitReset: textField,
  deFallbackExercise: textField,
  enEquipmentConfiguration: textField,
  enPrerequisites: textField,
  enApproach: textField,
  enExecution: textField,
  enExitReset: textField,
  enFallbackExercise: textField,
});

function stringField(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "");
}

export async function updateExerciseObstacleGuidanceAction(
  exerciseId: string,
  formData: FormData,
): Promise<void> {
  await requireTrainer();
  const parsed = obstacleGuidanceSchema.safeParse({
    stationCapacity: stringField(formData, "stationCapacity"),
    clearZoneMetres: stringField(formData, "clearZoneMetres"),
    deEquipmentConfiguration: stringField(formData, "deEquipmentConfiguration"),
    dePrerequisites: stringField(formData, "dePrerequisites"),
    deApproach: stringField(formData, "deApproach"),
    deExecution: stringField(formData, "deExecution"),
    deExitReset: stringField(formData, "deExitReset"),
    deFallbackExercise: stringField(formData, "deFallbackExercise"),
    enEquipmentConfiguration: stringField(formData, "enEquipmentConfiguration"),
    enPrerequisites: stringField(formData, "enPrerequisites"),
    enApproach: stringField(formData, "enApproach"),
    enExecution: stringField(formData, "enExecution"),
    enExitReset: stringField(formData, "enExitReset"),
    enFallbackExercise: stringField(formData, "enFallbackExercise"),
  });
  if (!parsed.success) {
    redirect(`/exercises/${exerciseId}/edit?obstacleError=invalid#obstacle-guidance`);
  }

  const value = parsed.data;
  let saved = false;
  try {
    saved = await updateObstacleGuidance(exerciseId, {
      stationCapacity: value.stationCapacity,
      clearZoneMetres: value.clearZoneMetres,
      de: {
        equipmentConfiguration: value.deEquipmentConfiguration,
        prerequisites: value.dePrerequisites,
        approach: value.deApproach,
        execution: value.deExecution,
        exitReset: value.deExitReset,
        fallbackExercise: value.deFallbackExercise,
      },
      en: {
        equipmentConfiguration: value.enEquipmentConfiguration,
        prerequisites: value.enPrerequisites,
        approach: value.enApproach,
        execution: value.enExecution,
        exitReset: value.enExitReset,
        fallbackExercise: value.enFallbackExercise,
      },
    });
  } catch {
    redirect(`/exercises/${exerciseId}/edit?obstacleError=save#obstacle-guidance`);
  }
  if (!saved) redirect("/exercises");

  revalidatePath("/exercises");
  revalidatePath("/obstacles");
  revalidatePath(`/exercises/${exerciseId}`);
  revalidatePath(`/exercises/${exerciseId}/edit`);
  redirect(`/exercises/${exerciseId}/edit?obstacleSaved=1#obstacle-guidance`);
}
