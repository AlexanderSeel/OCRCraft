"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createClubGroup,
  setClubGroupArchived,
  updateClubGroup,
} from "@/server/groups/group-repository";

const optionalInteger = (min: number, max: number) => z.preprocess(
  (value) => value == null || value === "" ? null : value,
  z.coerce.number().int().min(min).max(max).nullable(),
);

const groupSchema = z.object({
  name: z.string().trim().min(1).max(120),
  audience: z.enum(["kids", "youth", "adults", "mixed"]),
  minAge: optionalInteger(3, 99),
  maxAge: optionalInteger(3, 99),
  defaultParticipantCount: z.coerce.number().int().min(1).max(500),
  defaultDurationMinutes: optionalInteger(10, 480),
  defaultLocale: z.enum(["de", "en"]),
  maximumRiskLevel: z.preprocess(
    (value) => value === "" ? null : value,
    z.enum(["low", "medium", "high"]).nullable(),
  ),
  defaultLocation: z.enum(["indoor", "outdoor", "mixed"]),
  defaultEquipment: z.array(z.object({
    equipmentId: z.string().uuid(),
    quantityAvailable: z.number().int().min(0).max(500),
  })).max(100),
}).superRefine((value, context) => {
  if (value.minAge != null && value.maxAge != null && value.minAge > value.maxAge) {
    context.addIssue({
      code: "custom",
      path: ["maxAge"],
      message: "Das maximale Alter muss mindestens so hoch wie das Mindestalter sein.",
    });
  }
});

const groupTargetSchema = z.object({
  id: z.string().uuid(),
  archived: z.enum(["true", "false"]).transform((value) => value === "true"),
});

function parseGroupEquipment(formData: FormData) {
  const defaults: { equipmentId: string; quantityAvailable: number }[] = [];
  const seen = new Set<string>();
  for (const [key, rawValue] of formData.entries()) {
    if (!key.startsWith("equipmentQty:")) continue;
    const equipmentId = key.slice("equipmentQty:".length);
    const value = String(rawValue).trim();
    if (value === "") continue;
    const id = z.string().uuid().safeParse(equipmentId);
    const quantity = z.coerce.number().int().min(0).max(500).safeParse(value);
    if (!id.success || !quantity.success || seen.has(equipmentId)) return null;
    seen.add(equipmentId);
    defaults.push({ equipmentId, quantityAvailable: quantity.data });
  }
  return defaults;
}

function parseGroupForm(formData: FormData) {
  const defaultEquipment = parseGroupEquipment(formData);
  return groupSchema.safeParse({
    name: formData.get("name"),
    audience: formData.get("audience"),
    minAge: formData.get("minAge"),
    maxAge: formData.get("maxAge"),
    defaultParticipantCount: formData.get("defaultParticipantCount"),
    defaultDurationMinutes: formData.get("defaultDurationMinutes"),
    defaultLocale: formData.get("defaultLocale"),
    maximumRiskLevel: formData.get("maximumRiskLevel"),
    defaultLocation: formData.get("defaultLocation"),
    defaultEquipment,
  });
}

function refreshGroups(): void {
  revalidatePath("/groups");
  revalidatePath("/quick-create");
}

export async function createClubGroupAction(formData: FormData): Promise<void> {
  const parsed = parseGroupForm(formData);
  if (!parsed.success) redirect("/groups?error=invalid-group");

  try {
    await createClubGroup(parsed.data);
  } catch {
    redirect("/groups?error=create-group");
  }

  refreshGroups();
  redirect("/groups?saved=created");
}

export async function updateClubGroupAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const parsed = parseGroupForm(formData);
  if (!z.string().uuid().safeParse(id).success || !parsed.success) {
    redirect("/groups?error=invalid-group");
  }

  try {
    const updated = await updateClubGroup(id, parsed.data);
    if (!updated) redirect("/groups?error=missing-group");
  } catch {
    redirect("/groups?error=update-group");
  }

  refreshGroups();
  redirect("/groups?saved=updated");
}

export async function setClubGroupArchivedAction(formData: FormData): Promise<void> {
  const parsed = groupTargetSchema.safeParse({
    id: formData.get("id"),
    archived: formData.get("archived"),
  });
  if (!parsed.success) redirect("/groups?error=invalid-group");

  try {
    const updated = await setClubGroupArchived(parsed.data.id, parsed.data.archived);
    if (!updated) redirect("/groups?error=missing-group");
  } catch {
    redirect("/groups?error=archive-group");
  }

  refreshGroups();
  redirect(`/groups?saved=${parsed.data.archived ? "archived" : "restored"}${parsed.data.archived ? "" : "&archived=1"}`);
}
