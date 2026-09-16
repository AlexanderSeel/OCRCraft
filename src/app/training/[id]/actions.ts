"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { updateTrainingSessionMetadata } from "@/server/training/training-session-repository";

const metadataSchema = z.object({
  title: z.string().trim().min(1).max(120),
  status: z.enum(["draft", "ready", "completed", "archived"]),
});

export async function updateTrainingSessionMetadataAction(
  id: string,
  formData: FormData,
): Promise<void> {
  const parsed = metadataSchema.safeParse({
    title: formData.get("title"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    redirect(`/training/${id}?error=invalid-metadata`);
  }

  const updated = await updateTrainingSessionMetadata(id, parsed.data);
  if (!updated) redirect("/training");

  revalidatePath("/training");
  revalidatePath(`/training/${id}`);
  redirect(`/training/${id}?saved=1`);
}
