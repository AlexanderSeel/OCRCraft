"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { updateExerciseFacets } from "@/server/exercises/exercise-facet-repository";

const facetId = z.string().trim().min(1).max(100);
const facetSchema = z.object({
  exerciseId: z.string().uuid(),
  bodyRegions: z.array(z.object({
    id: facetId,
    emphasis: z.enum(["primary", "secondary"]),
  })).max(30),
  movementPatternIds: z.array(facetId).max(30),
  tagIds: z.array(facetId).max(80),
  equipment: z.array(z.object({
    id: z.string().uuid(),
    quantityRequired: z.number().int().min(1).max(99),
  })).max(50),
});

function strings(formData: FormData, name: string): string[] {
  return formData.getAll(name).map(String).map((value) => value.trim()).filter(Boolean);
}

function bodyRegions(formData: FormData) {
  const selected = [...new Set(strings(formData, "bodyRegionIds"))];
  return selected.flatMap((id) => {
    const emphasis = String(formData.get(`bodyEmphasis:${id}`) ?? "primary");
    return emphasis === "primary" || emphasis === "secondary"
      ? [{ id, emphasis }]
      : [];
  });
}

export async function updateExerciseFacetsAction(
  exerciseId: string,
  formData: FormData,
): Promise<void> {
  const movementPatternIds = [...new Set(strings(formData, "movementPatternIds"))];
  const tagIds = [...new Set(strings(formData, "tagIds"))];
  const equipmentIds = [...new Set(strings(formData, "equipmentIds"))];

  const parsed = facetSchema.safeParse({
    exerciseId,
    bodyRegions: bodyRegions(formData),
    movementPatternIds,
    tagIds,
    equipment: equipmentIds.map((id) => ({
      id,
      quantityRequired: Number(formData.get(`equipmentQty:${id}`) ?? 1),
    })),
  });

  if (!parsed.success) {
    redirect(`/exercises/${exerciseId}/edit?facetError=invalid`);
  }

  try {
    await updateExerciseFacets(parsed.data.exerciseId, {
      bodyRegions: parsed.data.bodyRegions,
      movementPatternIds: parsed.data.movementPatternIds,
      tagIds: parsed.data.tagIds,
      equipment: parsed.data.equipment,
    });
  } catch {
    redirect(`/exercises/${exerciseId}/edit?facetError=save`);
  }

  revalidatePath("/exercises");
  revalidatePath(`/exercises/${exerciseId}/edit`);
  redirect(`/exercises/${exerciseId}/edit?facetsSaved=1`);
}
