"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { createDatabaseBackup } from "@/server/db/backup-service";
import { recordAuditEvent } from "@/server/db/audit-service";
import { activateSearchProfile, deleteSearchProfile, saveSearchProfile } from "@/server/search/search-profile-repository";
import { reseedAllDatabaseData } from "@/server/db/reseed-service";
import { resolveDuplicateTask } from "@/server/exercises/duplicate-review-service";
import {
  enrichImportedGymExerciseForOutdoor,
  enrichImportedGymExercisesForOutdoor,
} from "@/server/exercises/outdoor-variant-enrichment-service";
import { requireAdmin, requireSuperAdmin } from "@/server/auth/identity-service";
import { restoreDatabaseBackup } from "@/server/db/restore-service";
import { aiProviderInstanceIdSchema, aiProviderKindSchema, deleteAiProviderInstance, disconnectAiProviderOAuth, saveAiProviderInstance, type AiCapability } from "@/server/ai/ai-provider-settings-repository";
import { cancelAppTask, deleteAppTask, enqueueAppTask, retryAppTask } from "@/server/queue/app-task-repository";
import { runAppTaskQueue } from "@/server/queue/app-task-worker";
import { deleteFailedMediaGenerationJob } from "@/server/media/media-generation-job-repository";

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
    await enqueueAppTask({ type: "search_rebuild", title: "Deutsche und englische Suchindizes aufbauen", requestedBy: actor.id });
    void runAppTaskQueue();
    await recordAuditEvent({ action: "search.rebuild", entityType: "search_index", actorType: "user", actorId: actor.id, metadata: { locales: ["de", "en"] } });
    redirect("/admin?tab=queue&queued=search");
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
  const actor = await requireAdmin();
  await enqueueAppTask({ type: "duplicate_scan", title: "Übungen auf Doppelungen prüfen", requestedBy: actor.id });
  void runAppTaskQueue();
  revalidatePath("/admin");
}

export async function cancelAppTaskAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await cancelAppTask(id);
  revalidatePath("/admin");
}

export async function retryAppTaskAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) { await retryAppTask(id); void runAppTaskQueue(); }
  revalidatePath("/admin");
}

export async function deleteAppTaskAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await deleteAppTask(id);
  revalidatePath("/admin");
}

export async function deleteFailedMediaJobAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await deleteFailedMediaGenerationJob(id);
  revalidatePath("/admin");
  revalidatePath("/media");
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
  const actor = await requireAdmin();
  const decision = String(formData.get("decision") ?? "left");
  const selections = formData.getAll("selection").map(String);
  const resolutions = selections.flatMap((selection) => {
    const [taskId, leftExerciseId, rightExerciseId] = selection.split(":");
    return taskId && leftExerciseId && rightExerciseId ? [{ taskId, leftExerciseId, rightExerciseId, decision }] : [];
  });
  if (resolutions.length) {
    await enqueueAppTask({ type: "duplicate_resolve", title: `${resolutions.length} Dublettenentscheidungen anwenden`, requestedBy: actor.id, payload: { resolutions } });
    void runAppTaskQueue();
  }

  revalidatePath("/admin");
  revalidatePath("/exercises");
}



function optionalPositiveInt(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const parsed = Number(text);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error("positive-integer-required");
  return parsed;
}

function assignmentFrom(formData: FormData, capability: AiCapability) {
  if (formData.get("assign_" + capability) !== "on") return null;
  return {
    capability,
    priority: optionalPositiveInt(formData.get("priority_" + capability)) ?? 10,
  } as const;
}

export async function saveAiProviderSettingsAction(formData: FormData): Promise<void> {
  const actor = await requireAdmin();
  const providerKind = aiProviderKindSchema.safeParse(formData.get("providerKind"));
  if (!providerKind.success) redirect("/admin?tab=settings&aiError=provider#ai-provider-settings");
  const idValue = String(formData.get("id") ?? "").trim();
  const id = idValue ? aiProviderInstanceIdSchema.safeParse(idValue) : null;
  if (id && !id.success) redirect("/admin?tab=settings&aiError=provider#ai-provider-settings");

  try {
    const authModeValue = String(formData.get("authMode") ?? "environment");
    const authMode = authModeValue === "encrypted_key"
      ? "encrypted_key"
      : authModeValue === "oauth"
        ? "oauth"
        : "environment";
    const assignments = (["training","exercise_draft","image"] as const)
      .map((capability) => assignmentFrom(formData, capability))
      .filter((item): item is NonNullable<typeof item> => item != null);

    const savedId = await saveAiProviderInstance({
      id: id?.success ? id.data : null,
      providerKind: providerKind.data,
      displayName: String(formData.get("displayName") ?? "").trim(),
      enabled: formData.get("enabled") === "on",
      baseUrl: String(formData.get("baseUrl") ?? "").trim() || null,
      textModelId: String(formData.get("textModelId") ?? "").trim() || null,
      imageModelId: String(formData.get("imageModelId") ?? "").trim() || null,
      authMode,
      apiKeyEnv: String(formData.get("apiKeyEnv") ?? "").trim() || null,
      apiKey: String(formData.get("apiKey") ?? "").trim() || undefined,
      clearStoredApiKey: formData.get("clearStoredApiKey") === "on",
      monthlyTextTokenLimit: optionalPositiveInt(formData.get("monthlyTextTokenLimit")),
      monthlyRequestLimit: optionalPositiveInt(formData.get("monthlyRequestLimit")),
      assignments,
      updatedBy: actor.id,
    });

    await recordAuditEvent({
      action: "ai_provider_instance.update",
      entityType: "ai_provider_instance",
      entityId: savedId,
      actorType: "user",
      actorId: actor.id,
      metadata: {
        providerKind: providerKind.data,
        authMode,
        assignments,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/exercises/ai-drafts");
    revalidatePath("/training/builder");
    redirect("/admin?tab=settings&aiSaved=" + encodeURIComponent(savedId) + "#ai-provider-settings");
  } catch (error) {
    const code = error instanceof Error && error.message.includes("OCRCRAFT_AI_SECRET_KEY")
      ? "secret"
      : error instanceof Error && (
          error.message.includes("Modell")
          || error.message.includes("Base URL")
          || error.message.includes("unterstützt")
        )
        ? "config"
        : "save";
    redirect("/admin?tab=settings&aiError=" + code + "#ai-provider-settings");
  }
}

export async function deleteAiProviderSettingsAction(formData: FormData): Promise<void> {
  const actor = await requireAdmin();
  const id = aiProviderInstanceIdSchema.safeParse(formData.get("id"));
  if (!id.success) redirect("/admin?tab=settings&aiError=provider#ai-provider-settings");

  try {
    const deleted = await deleteAiProviderInstance(id.data);
    if (deleted) {
      await recordAuditEvent({
        action: "ai_provider_instance.delete",
        entityType: "ai_provider_instance",
        entityId: id.data,
        actorType: "user",
        actorId: actor.id,
      });
    }
  } catch {
    redirect("/admin?tab=settings&aiError=save#ai-provider-settings");
  }

  revalidatePath("/admin");
  redirect("/admin?tab=settings#ai-provider-settings");
}


export async function disconnectAiProviderOAuthAction(formData: FormData): Promise<void> {
  const actor = await requireAdmin();
  const id = aiProviderInstanceIdSchema.safeParse(formData.get("id"));
  if (!id.success) redirect("/admin?tab=settings&aiError=provider#ai-provider-settings");

  try {
    await disconnectAiProviderOAuth(id.data, actor.id);
    await recordAuditEvent({
      action: "ai_provider.oauth.disconnect",
      entityType: "ai_provider_instance",
      entityId: id.data,
      actorType: "user",
      actorId: actor.id,
    });
  } catch {
    redirect("/admin?tab=settings&aiError=oauth#ai-provider-settings");
  }

  revalidatePath("/admin");
  redirect("/admin?tab=settings&aiSaved=oauth-disconnected#ai-provider-settings");
}


const searchProfileIdSchema = z.string().uuid();
const searchProfileSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(80),
  exact: z.coerce.number().int().min(0).max(500),
  prefix: z.coerce.number().int().min(0).max(500),
  alias: z.coerce.number().int().min(0).max(500),
  summary: z.coerce.number().int().min(0).max(500),
  taxonomy: z.coerce.number().int().min(0).max(500),
  bodyRegions: z.coerce.number().int().min(0).max(500),
  equipment: z.coerce.number().int().min(0).max(500),
  instructions: z.coerce.number().int().min(0).max(500),
});

export async function saveSearchProfileAction(formData: FormData): Promise<void> {
  const actor = await requireAdmin();
  const idText = String(formData.get("id") ?? "").trim();
  const parsed = searchProfileSchema.safeParse({
    id: idText || undefined,
    name: formData.get("name"),
    exact: formData.get("exact"),
    prefix: formData.get("prefix"),
    alias: formData.get("alias"),
    summary: formData.get("summary"),
    taxonomy: formData.get("taxonomy"),
    bodyRegions: formData.get("bodyRegions"),
    equipment: formData.get("equipment"),
    instructions: formData.get("instructions"),
  });
  if (!parsed.success) redirect("/admin?tab=settings&searchError=invalid#search-profile-settings");

  let savedId = "";
  try {
    savedId = await saveSearchProfile({
      id: parsed.data.id,
      name: parsed.data.name,
      weights: parsed.data,
    });
    await recordAuditEvent({
      action: "search_profile.update",
      entityType: "search_profile",
      entityId: savedId,
      actorType: "user",
      actorId: actor.id,
      metadata: { name: parsed.data.name, weights: parsed.data },
    });
  } catch {
    redirect("/admin?tab=settings&searchError=save#search-profile-settings");
  }

  revalidatePath("/admin");
  revalidatePath("/exercises");
  redirect("/admin?tab=settings&searchSaved=" + encodeURIComponent(savedId) + "#search-profile-settings");
}

export async function activateSearchProfileAction(formData: FormData): Promise<void> {
  const actor = await requireAdmin();
  const id = searchProfileIdSchema.safeParse(formData.get("id"));
  if (!id.success) redirect("/admin?tab=settings&searchError=invalid#search-profile-settings");

  let activated = false;
  try {
    activated = await activateSearchProfile(id.data);
    if (activated) {
      await recordAuditEvent({
        action: "search_profile.activate",
        entityType: "search_profile",
        entityId: id.data,
        actorType: "user",
        actorId: actor.id,
      });
    }
  } catch {
    redirect("/admin?tab=settings&searchError=save#search-profile-settings");
  }
  if (!activated) redirect("/admin?tab=settings&searchError=missing#search-profile-settings");

  revalidatePath("/admin");
  revalidatePath("/exercises");
  redirect("/admin?tab=settings&searchSaved=" + encodeURIComponent(id.data) + "#search-profile-settings");
}

export async function deleteSearchProfileAction(formData: FormData): Promise<void> {
  const actor = await requireAdmin();
  const id = searchProfileIdSchema.safeParse(formData.get("id"));
  if (!id.success) redirect("/admin?tab=settings&searchError=invalid#search-profile-settings");

  let deleted = false;
  try {
    deleted = await deleteSearchProfile(id.data);
    if (deleted) {
      await recordAuditEvent({
        action: "search_profile.delete",
        entityType: "search_profile",
        entityId: id.data,
        actorType: "user",
        actorId: actor.id,
      });
    }
  } catch {
    redirect("/admin?tab=settings&searchError=save#search-profile-settings");
  }
  if (!deleted) redirect("/admin?tab=settings&searchError=protected#search-profile-settings");

  revalidatePath("/admin");
  redirect("/admin?tab=settings&searchSaved=deleted#search-profile-settings");
}
