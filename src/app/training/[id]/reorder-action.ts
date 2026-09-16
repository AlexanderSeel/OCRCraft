"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { reorderTrainingItems } from "@/server/training/training-item-reorder-repository";

const reorderSchema = z.object({
  sessionId: z.string().uuid(),
  phaseId: z.string().uuid(),
  orderedItemIds: z.array(z.string().uuid()).min(1).max(200),
});

export async function reorderTrainingItemsAction(formData: FormData): Promise<void> {
  let orderedItemIds: unknown = [];
  try {
    orderedItemIds = JSON.parse(String(formData.get("orderedItemIds") ?? "[]"));
  } catch {
    throw new Error("Ungültige Reihenfolge.");
  }

  const parsed = reorderSchema.parse({
    sessionId: formData.get("sessionId"),
    phaseId: formData.get("phaseId"),
    orderedItemIds,
  });

  await reorderTrainingItems(parsed.data.sessionId, parsed.data.phaseId, parsed.data.orderedItemIds);
  revalidatePath("/training");
  revalidatePath(`/training/${parsed.data.sessionId}`);
}
