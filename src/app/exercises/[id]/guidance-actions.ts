"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { updateExerciseGuidanceLists } from "@/server/exercises/exercise-guidance-list-repository";
import { requireTrainer } from "@/server/auth/identity-service";

const textItemSchema = z.string().trim().min(1).max(1000);

const guidanceListsSchema = z.object({
  locale: z.enum(["de", "en"]),
  executionSteps: z.array(textItemSchema).max(20),
  coachingCues: z.array(textItemSchema).max(20),
  commonMistakes: z.array(z.object({
    mistake: textItemSchema,
    correction: textItemSchema,
  })).max(20),
});

function parseJsonField(formData: FormData, name: string): unknown {
  const raw = String(formData.get(name) ?? "");
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function updateExerciseGuidanceListsAction(
  exerciseId: string,
  formData: FormData,
): Promise<void> {
  await requireTrainer();
  const parsed = guidanceListsSchema.safeParse({
    locale: String(formData.get("locale") ?? ""),
    executionSteps: parseJsonField(formData, "executionStepsJson"),
    coachingCues: parseJsonField(formData, "coachingCuesJson"),
    commonMistakes: parseJsonField(formData, "commonMistakesJson"),
  });

  if (!parsed.success) {
    redirect(`/exercises/${exerciseId}/edit?guidanceError=invalid`);
  }

  let saved = false;
  try {
    saved = await updateExerciseGuidanceLists(exerciseId, parsed.data.locale, parsed.data);
  } catch {
    redirect(`/exercises/${exerciseId}/edit?guidanceError=save`);
  }

  if (!saved) redirect("/exercises");

  revalidatePath("/exercises");
  revalidatePath(`/exercises/${exerciseId}`);
  revalidatePath(`/exercises/${exerciseId}/edit`);
  redirect(`/exercises/${exerciseId}/edit?guidanceSaved=${parsed.data.locale}`);
}
