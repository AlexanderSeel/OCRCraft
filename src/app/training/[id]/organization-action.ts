"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { updateTrainingOrganization } from "@/server/training/training-organization-repository";

const organizationSchema = z.object({
  sessionId: z.string().uuid(),
  organizationMode: z.enum(["solo", "team"]),
  teamSize: z.preprocess(
    (value) => value === "" || value == null ? null : value,
    z.coerce.number().int().min(2).max(20).nullable(),
  ),
}).superRefine((value, context) => {
  if (value.organizationMode === "team" && value.teamSize == null) {
    context.addIssue({ code: "custom", path: ["teamSize"], message: "Teamgröße fehlt." });
  }
});

export async function updateTrainingOrganizationAction(formData: FormData): Promise<void> {
  const sessionId = String(formData.get("sessionId") ?? "");
  const parsed = organizationSchema.safeParse({
    sessionId,
    organizationMode: formData.get("organizationMode"),
    teamSize: formData.get("teamSize"),
  });
  if (!parsed.success) redirect(`/training/${sessionId}?error=organization`);

  const updated = await updateTrainingOrganization(parsed.data.sessionId, {
    organizationMode: parsed.data.organizationMode,
    teamSize: parsed.data.organizationMode === "team" ? parsed.data.teamSize : null,
  });
  if (!updated) redirect("/training");

  revalidatePath("/training");
  revalidatePath(`/training/${parsed.data.sessionId}`);
  redirect(`/training/${parsed.data.sessionId}?saved=organization`);
}
