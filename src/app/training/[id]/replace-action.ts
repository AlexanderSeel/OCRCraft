"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { replaceTrainingItemExercise } from "@/server/training/training-session-mutation-repository";

const replaceSchema = z.object({
  sessionId: z.string().uuid(),
  itemId: z.string().uuid(),
  exerciseId: z.string().uuid(),
});

export async function replaceTrainingItemExerciseAction(formData: FormData): Promise<void> {
  const parsed = replaceSchema.safeParse({
    sessionId: formData.get("sessionId"),
    itemId: formData.get("itemId"),
    exerciseId: formData.get("exerciseId"),
  });
  const fallbackId = String(formData.get("sessionId") ?? "");
  if (!parsed.success) redirect(`/training/${fallbackId}?error=invalid-replacement`);

  try {
    await replaceTrainingItemExercise(
      parsed.data.sessionId,
      parsed.data.itemId,
      parsed.data.exerciseId,
    );
  } catch {
    redirect(`/training/${parsed.data.sessionId}?error=replace-item`);
  }

  revalidatePath("/training");
  revalidatePath(`/training/${parsed.data.sessionId}`);
  redirect(`/training/${parsed.data.sessionId}?saved=item`);
}
