"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { reseedAllDatabaseData } from "@/server/db/reseed-service";
import { refreshDuplicateReviewTasks, resolveDuplicateTask } from "@/server/exercises/duplicate-review-service";

const reseedConfirmationSchema = z.literal("OCRCRAFT ZURÜCKSETZEN");

export async function reseedDatabaseAction(formData: FormData): Promise<void> {
  const confirmation = reseedConfirmationSchema.safeParse(
    String(formData.get("confirmation") ?? ""),
  );

  if (!confirmation.success) {
    redirect("/admin?reseedError=confirmation#database-settings");
  }

  try {
    await ensureDatabaseReady();
    await reseedAllDatabaseData();
  } catch {
    redirect("/admin?reseedError=failed#database-settings");
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/exercises");
  redirect("/admin?reseeded=1#database-settings");
}

export async function scanDuplicateExercisesAction(): Promise<void> {
  await refreshDuplicateReviewTasks();
  revalidatePath("/admin");
}

export async function resolveDuplicateExerciseAction(formData: FormData): Promise<void> {
  const taskId = String(formData.get("taskId") ?? "");
  const keepExerciseId = String(formData.get("keepExerciseId") ?? "");
  const status = String(formData.get("status") ?? "merged") === "ignored" ? "ignored" : "merged";
  if (!taskId || !keepExerciseId) return;
  await resolveDuplicateTask(taskId, keepExerciseId, status);
  revalidatePath("/admin");
  revalidatePath("/exercises");
}
