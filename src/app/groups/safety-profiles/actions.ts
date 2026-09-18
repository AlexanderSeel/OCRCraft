"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, trainerQualificationSchema } from "@/server/auth/identity-service";
import {
  createYouthSafetyProfile,
  setYouthSafetyProfileArchived,
  updateYouthSafetyProfile,
} from "@/server/groups/youth-safety-profile-repository";

const profileSchema = z.object({
  name: z.string().trim().min(1).max(120),
  audience: z.enum(["kids","youth"]),
  minAge: z.coerce.number().int().min(3).max(17),
  maxAge: z.coerce.number().int().min(3).max(17),
  maximumRiskLevel: z.enum(["low","medium","high"]),
  maximumImpactLevel: z.enum(["low","moderate","high"]),
  supervisionRequirement: z.enum(["normal","increased","direct"]),
  minimumTrainerQualification: trainerQualificationSchema,
  notes: z.string().trim().max(1200),
  restrictedExerciseIds: z.array(z.string().uuid()).max(150),
}).refine((value) => value.minAge <= value.maxAge, {
  path: ["maxAge"],
  message: "Das Höchstalter muss mindestens dem Mindestalter entsprechen.",
});

function parseProfile(formData: FormData) {
  return profileSchema.safeParse({
    name: formData.get("name"),
    audience: formData.get("audience"),
    minAge: formData.get("minAge"),
    maxAge: formData.get("maxAge"),
    maximumRiskLevel: formData.get("maximumRiskLevel"),
    maximumImpactLevel: formData.get("maximumImpactLevel"),
    supervisionRequirement: formData.get("supervisionRequirement"),
    minimumTrainerQualification: formData.get("minimumTrainerQualification"),
    notes: String(formData.get("notes") ?? ""),
    restrictedExerciseIds: formData.getAll("restrictedExerciseIds"),
  });
}

function refresh() {
  revalidatePath("/groups");
  revalidatePath("/groups/safety-profiles");
  revalidatePath("/quick-create");
}

export async function createYouthSafetyProfileAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = parseProfile(formData);
  if (!parsed.success) redirect("/groups/safety-profiles?error=invalid");
  try {
    await createYouthSafetyProfile(parsed.data);
  } catch {
    redirect("/groups/safety-profiles?error=save");
  }
  refresh();
  redirect("/groups/safety-profiles?saved=created");
}

export async function updateYouthSafetyProfileAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = z.string().uuid().safeParse(formData.get("id"));
  const parsed = parseProfile(formData);
  if (!id.success || !parsed.success) redirect("/groups/safety-profiles?error=invalid");
  try {
    const updated = await updateYouthSafetyProfile(id.data, parsed.data);
    if (!updated) redirect("/groups/safety-profiles?error=missing");
  } catch {
    redirect("/groups/safety-profiles?error=save");
  }
  refresh();
  redirect("/groups/safety-profiles?saved=updated");
}

export async function setYouthSafetyProfileArchivedAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = z.object({
    id: z.string().uuid(),
    archived: z.enum(["true","false"]).transform((value) => value === "true"),
  }).safeParse({
    id: formData.get("id"),
    archived: formData.get("archived"),
  });
  if (!parsed.success) redirect("/groups/safety-profiles?error=invalid");
  try {
    const updated = await setYouthSafetyProfileArchived(parsed.data.id, parsed.data.archived);
    if (!updated) redirect("/groups/safety-profiles?error=missing");
  } catch {
    redirect("/groups/safety-profiles?error=linked");
  }
  refresh();
  redirect("/groups/safety-profiles?saved=" + (parsed.data.archived ? "archived" : "restored"));
}
