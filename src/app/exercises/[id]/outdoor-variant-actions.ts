"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateExerciseOutdoorVariant } from "@/server/exercises/exercise-outdoor-variant-repository";
import { requireTrainer } from "@/server/auth/identity-service";

export async function updateExerciseOutdoorVariantAction(
  exerciseId: string,
  formData: FormData,
): Promise<void> {
  await requireTrainer();
  const equipmentIds = [...new Set(formData.getAll("equipmentId").map(String).filter(Boolean))];
  const equipment = equipmentIds.map((id) => ({
    id,
    quantityRequired: Math.max(1, Math.min(99, Number.parseInt(String(formData.get(`quantity:${id}`) ?? "1"), 10) || 1)),
  }));

  try {
    await updateExerciseOutdoorVariant(exerciseId, {
      enabled: formData.get("enabled") === "on",
      textDe: String(formData.get("textDe") ?? "").slice(0, 4000),
      textEn: String(formData.get("textEn") ?? "").slice(0, 4000),
      equipment,
    });
  } catch {
    redirect(`/exercises/${exerciseId}/edit?outdoorError=save#outdoor-variant`);
  }

  revalidatePath("/exercises");
  revalidatePath(`/exercises/${exerciseId}`);
  revalidatePath(`/exercises/${exerciseId}/edit`);
  revalidatePath("/training/builder");
  redirect(`/exercises/${exerciseId}/edit?outdoorSaved=1#outdoor-variant`);
}
