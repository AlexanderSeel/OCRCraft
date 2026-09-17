"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { combineTrainingSessions } from "@/server/training/training-session-combine-repository";

export async function combineTrainingSessionsAction(
  firstSessionId: string,
  formData: FormData,
): Promise<void> {
  const secondSessionId = String(formData.get("secondSessionId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();

  let combinedId: string;
  try {
    combinedId = await combineTrainingSessions({
      firstSessionId,
      secondSessionId,
      title: title || undefined,
    });
  } catch {
    redirect(`/training/${firstSessionId}/combine?error=combine`);
  }

  revalidatePath("/training");
  revalidatePath(`/training/${combinedId}`);
  redirect(`/training/${combinedId}?saved=combined`);
}
