"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { MAIN_PART_EVERY_UNITS, MAIN_PART_PROGRAMMING_MODES, MAIN_PART_SCORE_MODES, PARTNER_WORK_MODES } from "@/domain/training/model";
import { updateTrainingMainPartProgramming } from "@/server/training/training-main-part-programming-repository";
import { mainPartProgrammingSchema } from "@/server/training/training-draft-schema";

const optionalInteger = (min: number, max: number) => z.preprocess(
  (value) => value === "" || value == null ? undefined : value,
  z.coerce.number().int().min(min).max(max).optional(),
);

const formSchema = z.object({
  sessionId: z.string().uuid(),
  mainPartIndex: z.coerce.number().int().min(1).max(12),
  mode: z.enum(MAIN_PART_PROGRAMMING_MODES),
  workSeconds: optionalInteger(5, 3600),
  restSeconds: optionalInteger(0, 1800),
  rounds: optionalInteger(1, 50),
  roundRestSeconds: optionalInteger(0, 600),
  scoreMode: z.preprocess(
    (value) => value === "" || value == null ? undefined : value,
    z.enum(MAIN_PART_SCORE_MODES).optional(),
  ),
  ladderStart: optionalInteger(1, 200),
  ladderEnd: optionalInteger(1, 200),
  ladderStep: optionalInteger(1, 50),
  chipperRepsPerExercise: optionalInteger(1, 500),
  everyValue: optionalInteger(1, 10000),
  everyUnit: z.preprocess(
    (value) => value === "" || value == null ? undefined : value,
    z.enum(MAIN_PART_EVERY_UNITS).optional(),
  ),
  everyWorkSeconds: optionalInteger(5, 1800),
  everyRestSeconds: optionalInteger(0, 1800),
  partnerMode: z.preprocess(
    (value) => value === "" || value == null ? undefined : value,
    z.enum(PARTNER_WORK_MODES).optional(),
  ),
  partnerSwitchSeconds: optionalInteger(5, 1800),
});

export async function updateTrainingMainPartProgrammingAction(formData: FormData): Promise<void> {
  const fallbackId = String(formData.get("sessionId") ?? "");
  const parsed = formSchema.safeParse({
    sessionId: formData.get("sessionId"),
    mainPartIndex: formData.get("mainPartIndex"),
    mode: formData.get("mode"),
    workSeconds: formData.get("workSeconds"),
    restSeconds: formData.get("restSeconds"),
    rounds: formData.get("rounds"),
    roundRestSeconds: formData.get("roundRestSeconds"),
    scoreMode: formData.get("scoreMode"),
    ladderStart: formData.get("ladderStart"),
    ladderEnd: formData.get("ladderEnd"),
    ladderStep: formData.get("ladderStep"),
    chipperRepsPerExercise: formData.get("chipperRepsPerExercise"),
    everyValue: formData.get("everyValue"),
    everyUnit: formData.get("everyUnit"),
    everyWorkSeconds: formData.get("everyWorkSeconds"),
    everyRestSeconds: formData.get("everyRestSeconds"),
    partnerMode: formData.get("partnerMode"),
    partnerSwitchSeconds: formData.get("partnerSwitchSeconds"),
  });
  if (!parsed.success) redirect(`/training/${fallbackId}?error=programming`);

  const programming = mainPartProgrammingSchema.safeParse({
    mode: parsed.data.mode,
    workSeconds: parsed.data.workSeconds,
    restSeconds: parsed.data.restSeconds,
    rounds: parsed.data.rounds,
    roundRestSeconds: parsed.data.roundRestSeconds,
    scoreMode: parsed.data.scoreMode,
    ladderStart: parsed.data.ladderStart,
    ladderEnd: parsed.data.ladderEnd,
    ladderStep: parsed.data.ladderStep,
    chipperRepsPerExercise: parsed.data.chipperRepsPerExercise,
    everyValue: parsed.data.everyValue,
    everyUnit: parsed.data.everyUnit,
    everyWorkSeconds: parsed.data.everyWorkSeconds,
    everyRestSeconds: parsed.data.everyRestSeconds,
    partnerMode: parsed.data.partnerMode,
    partnerSwitchSeconds: parsed.data.partnerSwitchSeconds,
  });
  if (!programming.success) redirect(`/training/${parsed.data.sessionId}?error=programming`);

  try {
    await updateTrainingMainPartProgramming(
      parsed.data.sessionId,
      parsed.data.mainPartIndex,
      programming.data,
    );
  } catch {
    redirect(`/training/${parsed.data.sessionId}?error=programming`);
  }

  revalidatePath("/training");
  revalidatePath(`/training/${parsed.data.sessionId}`);
  revalidatePath(`/training/${parsed.data.sessionId}/trainer`);
  revalidatePath(`/training/${parsed.data.sessionId}/print`);
  redirect(`/training/${parsed.data.sessionId}?saved=programming`);
}
