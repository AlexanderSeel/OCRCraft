"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  assignExerciseAsObstacle,
  removeExerciseFromObstacles,
} from "@/server/obstacles/obstacle-assignment-repository";

const exerciseIdSchema = z.string().uuid();

function revalidateObstacleViews(exerciseId: string): void {
  revalidatePath("/obstacles");
  revalidatePath("/exercises");
  revalidatePath(`/exercises/${exerciseId}`);
  revalidatePath(`/exercises/${exerciseId}/edit`);
}

export async function assignExerciseAsObstacleAction(formData: FormData): Promise<void> {
  const parsed = exerciseIdSchema.safeParse(formData.get("exerciseId"));
  if (!parsed.success) redirect("/obstacles?assignmentError=invalid");

  let result: Awaited<ReturnType<typeof assignExerciseAsObstacle>>;
  try {
    result = await assignExerciseAsObstacle(parsed.data);
  } catch {
    redirect("/obstacles?assignmentError=save");
  }

  if (result === "missing") redirect("/obstacles?assignmentError=missing");
  revalidateObstacleViews(parsed.data);
  redirect(`/obstacles?assignment=${result === "assigned" ? "added" : "already"}`);
}

export async function removeExerciseFromObstaclesAction(formData: FormData): Promise<void> {
  const parsed = exerciseIdSchema.safeParse(formData.get("exerciseId"));
  if (!parsed.success) redirect("/obstacles?assignmentError=invalid");

  let removed = false;
  try {
    removed = await removeExerciseFromObstacles(parsed.data);
  } catch {
    redirect("/obstacles?assignmentError=save");
  }
  if (!removed) redirect("/obstacles?assignmentError=missing");

  revalidateObstacleViews(parsed.data);
  redirect("/obstacles?assignment=removed");
}
