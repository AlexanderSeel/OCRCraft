"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  approveAiExerciseDraft,
  rejectAiExerciseDraft,
} from "@/server/exercises/ai-exercise-draft-repository";
import { aiExerciseDraftRequestSchema } from "@/server/exercises/ai-exercise-draft-schema";
import { generateAiExerciseDraft } from "@/server/exercises/ai-exercise-draft-service";
import { requireTrainer } from "@/server/auth/identity-service";

const draftIdSchema = z.string().uuid();

export async function generateAiExerciseDraftAction(formData: FormData): Promise<void> {
  await requireTrainer();
  const parsed = aiExerciseDraftRequestSchema.safeParse({ brief: formData.get("brief") });
  if (!parsed.success) redirect("/exercises/ai-drafts?error=invalid-brief");

  try {
    await generateAiExerciseDraft(parsed.data);
  } catch (error) {
    const code = error instanceof Error && error.message.includes("nicht konfiguriert")
      ? "not-configured"
      : "generation";
    redirect(`/exercises/ai-drafts?error=${code}`);
  }

  revalidatePath("/exercises/ai-drafts");
  redirect("/exercises/ai-drafts?saved=generated");
}

export async function approveAiExerciseDraftAction(formData: FormData): Promise<void> {
  await requireTrainer();
  const parsed = draftIdSchema.safeParse(formData.get("id"));
  if (!parsed.success) redirect("/exercises/ai-drafts?error=invalid-id");

  let exerciseId: string | null = null;
  try {
    exerciseId = await approveAiExerciseDraft(parsed.data);
  } catch {
    redirect("/exercises/ai-drafts?error=approval");
  }
  if (!exerciseId) redirect("/exercises/ai-drafts?error=not-pending");

  revalidatePath("/exercises");
  revalidatePath("/exercises/ai-drafts");
  redirect(`/exercises/${exerciseId}/edit?created=ai-draft`);
}

export async function rejectAiExerciseDraftAction(formData: FormData): Promise<void> {
  await requireTrainer();
  const parsed = draftIdSchema.safeParse(formData.get("id"));
  if (!parsed.success) redirect("/exercises/ai-drafts?error=invalid-id");

  try {
    const rejected = await rejectAiExerciseDraft(parsed.data);
    if (!rejected) redirect("/exercises/ai-drafts?error=not-pending");
  } catch {
    redirect("/exercises/ai-drafts?error=rejection");
  }

  revalidatePath("/exercises/ai-drafts");
  redirect("/exercises/ai-drafts?saved=rejected");
}
