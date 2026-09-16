"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { duplicateTrainingSession } from "@/server/training/training-session-duplicate-repository";

export async function duplicateTrainingSessionAction(sessionId: string): Promise<void> {
  let duplicatedId: string;
  try {
    duplicatedId = await duplicateTrainingSession(sessionId);
  } catch {
    redirect(`/training/${sessionId}?error=duplicate`);
  }

  revalidatePath("/training");
  revalidatePath(`/training/${duplicatedId}`);
  redirect(`/training/${duplicatedId}?saved=duplicated`);
}
