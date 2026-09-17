"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { reseedAllDatabaseData } from "@/server/db/reseed-service";
import { refreshDuplicateReviewTasks, resolveDuplicateTask } from "@/server/exercises/duplicate-review-service";
import { enrichImportedGymExercisesForOutdoor } from "@/server/exercises/outdoor-variant-enrichment-service";

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

export async function runOutdoorVariantEnrichmentAction(): Promise<void> {
  try {
    const report = await enrichImportedGymExercisesForOutdoor();
    revalidatePath("/admin");
    revalidatePath("/admin/outdoor-variants");
    revalidatePath("/exercises");
    revalidatePath("/training/builder");
    const params = new URLSearchParams({
      scanned: String(report.scanned),
      enriched: String(report.enriched),
      existing: String(report.alreadyEnriched),
      unmappable: String(report.unmappable),
      missingDetails: String(report.missingDetails),
    });
    redirect(`/admin/outdoor-variants?${params.toString()}`);
  } catch {
    redirect("/admin/outdoor-variants?error=1");
  }
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

export async function resolveDuplicateExercisesBulkAction(formData: FormData): Promise<void> {
  const decision = String(formData.get("decision") ?? "left");
  const selections = formData.getAll("selection").map(String);

  for (const selection of selections) {
    const [taskId, leftExerciseId, rightExerciseId] = selection.split(":");
    if (!taskId || !leftExerciseId || !rightExerciseId) continue;
    if (decision === "ignored") {
      await resolveDuplicateTask(taskId, leftExerciseId, "ignored");
      continue;
    }
    await resolveDuplicateTask(taskId, decision === "right" ? rightExerciseId : leftExerciseId, "merged");
  }

  revalidatePath("/admin");
  revalidatePath("/exercises");
}
