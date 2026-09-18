"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { createDatabaseBackup } from "@/server/db/backup-service";
import { recordAuditEvent } from "@/server/db/audit-service";
import { rebuildSearchIndex } from "@/server/search/search-index-service";
import { reseedAllDatabaseData } from "@/server/db/reseed-service";
import { refreshDuplicateReviewTasks, resolveDuplicateTask } from "@/server/exercises/duplicate-review-service";
import {
  enrichImportedGymExerciseForOutdoor,
  enrichImportedGymExercisesForOutdoor,
} from "@/server/exercises/outdoor-variant-enrichment-service";
import { requireAdmin, requireSuperAdmin } from "@/server/auth/identity-service";
import { restoreDatabaseBackup } from "@/server/db/restore-service";

const reseedConfirmationSchema = z.literal("OCRCRAFT ZURÜCKSETZEN");

export async function reseedDatabaseAction(formData: FormData): Promise<void> {
  const confirmation = reseedConfirmationSchema.safeParse(
    String(formData.get("confirmation") ?? ""),
  );

  if (!confirmation.success) {
    redirect("/admin?tab=database&reseedError=confirmation#database-settings");
  }

  try {
    const actor = await requireSuperAdmin();
    await ensureDatabaseReady();
    await reseedAllDatabaseData();
    await recordAuditEvent({ action: "database.reseed", entityType: "database", actorType: "user", actorId: actor.id, metadata: { source: "admin" } });
  } catch {
    redirect("/admin?tab=database&reseedError=failed#database-settings");
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/exercises");
  redirect("/admin?tab=database&reseeded=1#database-settings");
}

export async function createDatabaseBackupAction(): Promise<void> {
  try {
    const actor = await requireAdmin();
    const backup = await createDatabaseBackup();
    await recordAuditEvent({ action: "database.backup", entityType: "database", actorType: "user", actorId: actor.id, metadata: { fileName: backup.fileName, bytes: backup.bytes } });
    redirect(`/admin?tab=database&backup=${encodeURIComponent(backup.fileName)}`);
  } catch {
    redirect("/admin?tab=database&backupError=1");
  }
}

export async function rebuildSearchIndexesAction(): Promise<void> {
  try {
    const actor = await requireAdmin();
    await rebuildSearchIndex("de");
    await rebuildSearchIndex("en");
    await recordAuditEvent({ action: "search.rebuild", entityType: "search_index", actorType: "user", actorId: actor.id, metadata: { locales: ["de", "en"] } });
    redirect("/admin?tab=database&rebuild=1");
  } catch {
    redirect("/admin?tab=database&rebuildError=1");
  }
}

export async function restoreDatabaseBackupAction(formData: FormData): Promise<void> {
  const fileName = String(formData.get("fileName") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (!fileName || confirmation !== fileName) redirect("/admin?tab=database&restoreError=confirmation");
  try {
    const actor = await requireSuperAdmin();
    const result = await restoreDatabaseBackup(fileName);
    await recordAuditEvent({ action: "database.restore", entityType: "database", actorType: "user", actorId: actor.id, metadata: { fileName, safetyBackup: result.safetyBackup } });
    revalidatePath("/admin");
    redirect(`/admin?tab=database&restored=${encodeURIComponent(fileName)}`);
  } catch {
    redirect("/admin?tab=database&restoreError=1");
  }
}

export async function runOutdoorVariantEnrichmentAction(): Promise<void> {
  try {
    await requireAdmin();
    const report = await enrichImportedGymExercisesForOutdoor();
    revalidateOutdoorVariantPaths();
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

export async function approveOutdoorVariantCandidateAction(formData: FormData): Promise<void> {
  const exerciseId = String(formData.get("exerciseId") ?? "");
  if (!exerciseId) redirect("/admin/outdoor-variants?candidate=not-found");

  try {
    await requireAdmin();
    const status = await enrichImportedGymExerciseForOutdoor(exerciseId);
    revalidateOutdoorVariantPaths();
    revalidatePath(`/exercises/${exerciseId}`);
    revalidatePath(`/exercises/${exerciseId}/edit`);
    redirect(`/admin/outdoor-variants?candidate=${encodeURIComponent(status)}`);
  } catch {
    redirect("/admin/outdoor-variants?candidate=error");
  }
}

function revalidateOutdoorVariantPaths(): void {
  revalidatePath("/admin");
  revalidatePath("/admin/outdoor-variants");
  revalidatePath("/exercises");
  revalidatePath("/training/builder");
}

export async function scanDuplicateExercisesAction(): Promise<void> {
  await requireAdmin();
  await refreshDuplicateReviewTasks();
  revalidatePath("/admin");
}

export async function resolveDuplicateExerciseAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const taskId = String(formData.get("taskId") ?? "");
  const keepExerciseId = String(formData.get("keepExerciseId") ?? "");
  const status = String(formData.get("status") ?? "merged") === "ignored" ? "ignored" : "merged";
  if (!taskId || !keepExerciseId) return;
  await resolveDuplicateTask(taskId, keepExerciseId, status);
  revalidatePath("/admin");
  revalidatePath("/exercises");
}

export async function resolveDuplicateExercisesBulkAction(formData: FormData): Promise<void> {
  await requireAdmin();
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
