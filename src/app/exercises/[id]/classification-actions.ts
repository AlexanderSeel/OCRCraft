"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  exerciseCoordinationComplexities,
  exerciseDifficulties,
  exerciseImpactLevels,
  exerciseLateralities,
  exerciseMovementPlanes,
  exerciseTrainingGoals,
  exerciseTypes,
} from "@/domain/exercise/classification";
import { updateExerciseClassification } from "@/server/exercises/exercise-classification-repository";
import { requireTrainer } from "@/server/auth/identity-service";

const schema = z.object({
  exerciseType: z.enum(exerciseTypes),
  difficulty: z.enum(exerciseDifficulties),
  impactLevel: z.enum(exerciseImpactLevels),
  coordinationComplexity: z.enum(exerciseCoordinationComplexities),
  progressionRequired: z.boolean(),
  laterality: z.enum(exerciseLateralities),
  movementPlane: z.enum(exerciseMovementPlanes),
  suitableForKids: z.boolean(),
  suitableForYouth: z.boolean(),
  suitableForAdults: z.boolean(),
  indoorSuitable: z.boolean(),
  outdoorSuitable: z.boolean(),
  supportsReps: z.boolean(),
  supportsSeconds: z.boolean(),
  supportsMinutes: z.boolean(),
  supportsMetres: z.boolean(),
  supportsRounds: z.boolean(),
  supportsAttempts: z.boolean(),
  trainingGoals: z.array(z.enum(exerciseTrainingGoals)).min(1).max(exerciseTrainingGoals.length),
});

function checked(formData: FormData, name: string): boolean {
  return formData.get(name) === "on";
}

export async function updateExerciseClassificationAction(
  exerciseId: string,
  formData: FormData,
): Promise<void> {
  await requireTrainer();
  const parsed = schema.safeParse({
    exerciseType: String(formData.get("exerciseType") ?? ""),
    difficulty: String(formData.get("difficulty") ?? ""),
    impactLevel: String(formData.get("impactLevel") ?? ""),
    coordinationComplexity: String(formData.get("coordinationComplexity") ?? ""),
    progressionRequired: checked(formData, "progressionRequired"),
    laterality: String(formData.get("laterality") ?? ""),
    movementPlane: String(formData.get("movementPlane") ?? ""),
    suitableForKids: checked(formData, "suitableForKids"),
    suitableForYouth: checked(formData, "suitableForYouth"),
    suitableForAdults: checked(formData, "suitableForAdults"),
    indoorSuitable: checked(formData, "indoorSuitable"),
    outdoorSuitable: checked(formData, "outdoorSuitable"),
    supportsReps: checked(formData, "supportsReps"),
    supportsSeconds: checked(formData, "supportsSeconds"),
    supportsMinutes: checked(formData, "supportsMinutes"),
    supportsMetres: checked(formData, "supportsMetres"),
    supportsRounds: checked(formData, "supportsRounds"),
    supportsAttempts: checked(formData, "supportsAttempts"),
    trainingGoals: [...new Set(formData.getAll("trainingGoals").map(String))],
  });

  if (!parsed.success) redirect(`/exercises/${exerciseId}/edit?classificationError=invalid`);

  let saved = false;
  try {
    saved = await updateExerciseClassification(exerciseId, parsed.data);
  } catch {
    redirect(`/exercises/${exerciseId}/edit?classificationError=save`);
  }
  if (!saved) redirect("/exercises");

  revalidatePath("/exercises");
  revalidatePath(`/exercises/${exerciseId}`);
  revalidatePath(`/exercises/${exerciseId}/edit`);
  redirect(`/exercises/${exerciseId}/edit?classificationSaved=1`);
}
