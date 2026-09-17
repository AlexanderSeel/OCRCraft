"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { setTrainingItemLevel } from "@/server/training/training-item-level-repository";

export async function setTrainingItemLevelAction(
  sessionId: string,
  itemId: string,
  formData: FormData,
): Promise<void> {
  const level = String(formData.get("level") ?? "").trim();

  try {
    const updated = await setTrainingItemLevel(sessionId, itemId, level);
    if (!updated) throw new Error("Trainingseintrag wurde nicht gefunden.");
  } catch {
    redirect(`/training/${sessionId}?error=item-level`);
  }

  revalidatePath(`/training/${sessionId}`);
  revalidatePath(`/training/${sessionId}/trainer`);
  revalidatePath(`/training/${sessionId}/print`);
  redirect(`/training/${sessionId}?saved=item-level`);
}
