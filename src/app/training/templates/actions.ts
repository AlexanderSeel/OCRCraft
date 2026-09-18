"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  archiveClubTrainingTemplate,
  createClubTrainingTemplateFromSession,
  instantiateClubTrainingTemplate,
} from "@/server/training/saved-training-template-service";

const createSchema = z.object({
  sessionId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000),
});

export async function createClubTrainingTemplateAction(formData: FormData): Promise<void> {
  const parsed = createSchema.safeParse({
    sessionId: formData.get("sessionId"),
    name: formData.get("name"),
    description: String(formData.get("description") ?? ""),
  });
  if (!parsed.success) redirect("/training?error=template");

  try {
    await createClubTrainingTemplateFromSession(parsed.data);
  } catch {
    redirect(`/training/${parsed.data.sessionId}?error=template`);
  }

  revalidatePath("/training/templates");
  revalidatePath(`/training/${parsed.data.sessionId}`);
  redirect(`/training/${parsed.data.sessionId}?saved=template`);
}

export async function instantiateClubTrainingTemplateAction(formData: FormData): Promise<void> {
  const templateId = z.string().uuid().safeParse(formData.get("templateId"));
  if (!templateId.success) redirect("/training/templates?error=use");

  let sessionId = "";
  try {
    sessionId = await instantiateClubTrainingTemplate(templateId.data);
  } catch {
    redirect("/training/templates?error=use");
  }

  revalidatePath("/training");
  redirect(`/training/${sessionId}?saved=from-template`);
}

export async function archiveClubTrainingTemplateAction(formData: FormData): Promise<void> {
  const templateId = z.string().uuid().safeParse(formData.get("templateId"));
  if (!templateId.success) redirect("/training/templates?error=archive");

  let archived = false;
  try {
    archived = await archiveClubTrainingTemplate(templateId.data);
  } catch {
    redirect("/training/templates?error=archive");
  }
  if (!archived) redirect("/training/templates?error=archive");

  revalidatePath("/training/templates");
  redirect("/training/templates?saved=archived");
}
