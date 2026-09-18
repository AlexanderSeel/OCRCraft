"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { setMediaReviewStatus } from "@/server/media/media-catalog-repository";

const reviewSchema = z.object({
  assetId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  reviewStatus: z.enum(["pending", "approved", "rejected"]),
});

export async function updateMediaReviewStatusAction(formData: FormData): Promise<void> {
  const parsed = reviewSchema.safeParse({
    assetId: formData.get("assetId"),
    exerciseId: formData.get("exerciseId"),
    reviewStatus: formData.get("reviewStatus"),
  });
  if (!parsed.success) redirect("/media?reviewError=invalid");

  let updated = false;
  try {
    updated = await setMediaReviewStatus(parsed.data.assetId, parsed.data.reviewStatus);
  } catch {
    redirect("/media?reviewError=save");
  }
  if (!updated) redirect("/media?reviewError=missing");

  revalidatePath("/media");
  revalidatePath("/exercises");
  revalidatePath(`/exercises/${parsed.data.exerciseId}`);
  revalidatePath(`/exercises/${parsed.data.exerciseId}/edit`);
  redirect(`/media?reviewSaved=${parsed.data.reviewStatus}`);
}
