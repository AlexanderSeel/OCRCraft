"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createTrainingSnapshot, restoreTrainingVersion } from "@/server/training/training-version-service";

export async function createTrainingVersionAction(sessionId: string): Promise<void> {
  try { await createTrainingSnapshot(sessionId); revalidatePath(`/training/${sessionId}`); redirect(`/training/${sessionId}?saved=version`); }
  catch { redirect(`/training/${sessionId}?error=version`); }
}

export async function restoreTrainingVersionAction(formData: FormData): Promise<void> {
  const sessionId = String(formData.get("sessionId") ?? "");
  const versionId = String(formData.get("versionId") ?? "");
  try { await restoreTrainingVersion(versionId); revalidatePath(`/training/${sessionId}`); redirect(`/training/${sessionId}?saved=restore`); }
  catch { redirect(`/training/${sessionId}?error=restore`); }
}
