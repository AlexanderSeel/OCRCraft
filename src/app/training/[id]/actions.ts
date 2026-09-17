"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  addTrainingItem,
  deleteTrainingItem,
  moveTrainingItem,
  updateTrainingItem,
} from "@/server/training/training-session-mutation-repository";
import { updateTrainingSessionMetadata } from "@/server/training/training-session-repository";

const metadataSchema = z.object({
  title: z.string().trim().min(1).max(120),
  status: z.enum(["draft", "ready", "completed", "archived"]),
  routeName: z.preprocess((value) => typeof value === "string" && value.trim() === "" ? null : value, z.string().trim().max(160).nullable()),
  routeDistanceMetres: z.preprocess((value) => value === "" || value == null ? null : value, z.coerce.number().positive().max(100000).nullable()),
  routeSurface: z.preprocess((value) => typeof value === "string" && value.trim() === "" ? null : value, z.string().trim().max(160).nullable()),
  routeGpsReference: z.preprocess((value) => typeof value === "string" && value.trim() === "" ? null : value, z.string().trim().max(500).nullable()),
  routeNotes: z.preprocess((value) => typeof value === "string" && value.trim() === "" ? null : value, z.string().trim().max(2000).nullable()),
});

const nullableText = (max: number) =>
  z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? null : value,
    z.string().trim().max(max).nullable(),
  );

const formatSchema = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? null : value,
  z.enum(["free", "circuit", "tabata", "amrap", "emom", "rig-run", "run-exercise", "technique", "relay"]).nullable(),
);

const itemFieldsSchema = z.object({
  durationMinutes: z.coerce.number().int().min(1).max(240),
  format: formatSchema,
  instructions: nullableText(4000),
  levelLabel: nullableText(120),
});

const addItemSchema = itemFieldsSchema.extend({
  sessionId: z.string().uuid(),
  phaseId: z.string().uuid(),
  exerciseId: z.string().uuid(),
});

const updateItemSchema = itemFieldsSchema.extend({
  sessionId: z.string().uuid(),
  itemId: z.string().uuid(),
});

const itemTargetSchema = z.object({
  sessionId: z.string().uuid(),
  itemId: z.string().uuid(),
});

const moveItemSchema = itemTargetSchema.extend({
  direction: z.enum(["up", "down"]),
});

function refreshTraining(sessionId: string): void {
  revalidatePath("/training");
  revalidatePath(`/training/${sessionId}`);
}

function itemFields(formData: FormData) {
  return {
    durationMinutes: formData.get("durationMinutes"),
    format: formData.get("format"),
    instructions: formData.get("instructions"),
    levelLabel: formData.get("levelLabel"),
  };
}

export async function updateTrainingSessionMetadataAction(
  id: string,
  formData: FormData,
): Promise<void> {
  const parsed = metadataSchema.safeParse({
    title: formData.get("title"),
    status: formData.get("status"),
    routeName: formData.get("routeName"),
    routeDistanceMetres: formData.get("routeDistanceMetres"),
    routeSurface: formData.get("routeSurface"),
    routeGpsReference: formData.get("routeGpsReference"),
    routeNotes: formData.get("routeNotes"),
  });

  if (!parsed.success) redirect(`/training/${id}?error=invalid-metadata`);

  const updated = await updateTrainingSessionMetadata(id, parsed.data);
  if (!updated) redirect("/training");

  refreshTraining(id);
  redirect(`/training/${id}?saved=metadata`);
}

export async function addTrainingItemAction(formData: FormData): Promise<void> {
  const parsed = addItemSchema.safeParse({
    sessionId: formData.get("sessionId"),
    phaseId: formData.get("phaseId"),
    exerciseId: formData.get("exerciseId"),
    ...itemFields(formData),
  });
  const fallbackId = String(formData.get("sessionId") ?? "");
  if (!parsed.success) redirect(`/training/${fallbackId}?error=invalid-item`);

  try {
    await addTrainingItem(parsed.data.sessionId, parsed.data.phaseId, {
      exerciseId: parsed.data.exerciseId,
      durationMinutes: parsed.data.durationMinutes,
      format: parsed.data.format,
      instructions: parsed.data.instructions,
      levelLabel: parsed.data.levelLabel,
    });
  } catch {
    redirect(`/training/${parsed.data.sessionId}?error=add-item`);
  }

  refreshTraining(parsed.data.sessionId);
  redirect(`/training/${parsed.data.sessionId}?saved=item`);
}

export async function updateTrainingItemAction(formData: FormData): Promise<void> {
  const parsed = updateItemSchema.safeParse({
    sessionId: formData.get("sessionId"),
    itemId: formData.get("itemId"),
    ...itemFields(formData),
  });
  const fallbackId = String(formData.get("sessionId") ?? "");
  if (!parsed.success) redirect(`/training/${fallbackId}?error=invalid-item`);

  try {
    await updateTrainingItem(parsed.data.sessionId, parsed.data.itemId, {
      durationMinutes: parsed.data.durationMinutes,
      format: parsed.data.format,
      instructions: parsed.data.instructions,
      levelLabel: parsed.data.levelLabel,
    });
  } catch {
    redirect(`/training/${parsed.data.sessionId}?error=update-item`);
  }

  refreshTraining(parsed.data.sessionId);
  redirect(`/training/${parsed.data.sessionId}?saved=item`);
}

export async function deleteTrainingItemAction(formData: FormData): Promise<void> {
  const parsed = itemTargetSchema.safeParse({
    sessionId: formData.get("sessionId"),
    itemId: formData.get("itemId"),
  });
  const fallbackId = String(formData.get("sessionId") ?? "");
  if (!parsed.success) redirect(`/training/${fallbackId}?error=invalid-item`);

  try {
    await deleteTrainingItem(parsed.data.sessionId, parsed.data.itemId);
  } catch {
    redirect(`/training/${parsed.data.sessionId}?error=delete-item`);
  }

  refreshTraining(parsed.data.sessionId);
  redirect(`/training/${parsed.data.sessionId}?saved=item`);
}

export async function moveTrainingItemAction(formData: FormData): Promise<void> {
  const parsed = moveItemSchema.safeParse({
    sessionId: formData.get("sessionId"),
    itemId: formData.get("itemId"),
    direction: formData.get("direction"),
  });
  const fallbackId = String(formData.get("sessionId") ?? "");
  if (!parsed.success) redirect(`/training/${fallbackId}?error=invalid-item`);

  try {
    await moveTrainingItem(parsed.data.sessionId, parsed.data.itemId, parsed.data.direction);
  } catch {
    redirect(`/training/${parsed.data.sessionId}?error=move-item`);
  }

  refreshTraining(parsed.data.sessionId);
  redirect(`/training/${parsed.data.sessionId}?saved=item`);
}
