import { z } from "zod";
import { quickCreateRecoverySchema } from "./quick-create-recovery";
import { mainPartProgrammingSchema } from "@/server/training/training-draft-schema";

const count = z.number().int().min(1).max(200);
const phaseCount = z.number().int().min(1).max(4);
const exerciseCounts = z.array(count).min(1).max(4);
const shared = quickCreateRecoverySchema.pick({
  ageRange: true, goals: true, bodyRegions: true, avoidBodyRegions: true, preferredExercises: true,
  formats: true, competitionStyleKey: true, location: true, intensity: true, availableEquipment: true,
  obstacleInventoryDeclared: true, availableObstacleExerciseIds: true, groupSplitCount: true,
});
export const builderRecoverySchema = shared.extend({
  builderMode: z.enum(["local", "ai"]), audience: z.enum(["kids", "youth", "adults", "mixed"]),
  participants: count, duration: z.number().int().min(1).max(180),
  selectedTypes: z.array(z.string().max(200)).max(200), sourceTrainingIds: z.array(z.string().max(200)).max(200),
  warmupExerciseCount: count, mainPartExerciseCounts: exerciseCounts,
  mainPartProgramming: z.array(mainPartProgrammingSchema).min(1).max(4), cooldownExerciseCount: count,
  mainPartCount: phaseCount, organizationMode: z.enum(["solo", "team"]), teamSize: count,
  title: z.string().max(120),
}).refine((value) => value.mainPartExerciseCounts.length === value.mainPartCount && value.mainPartProgramming.length === value.mainPartCount, { message: "Main-part input arrays must match the main-part count." });

export const quickPlannerRecoverySchema = z.object({
  audience: z.enum(["kids", "youth", "adults", "mixed"]), participants: count,
  duration: z.number().int().min(1).max(180), goal: z.string().max(200), bodyRegion: z.string().max(200),
  format: z.string().max(200), location: z.enum(["indoor", "outdoor", "mixed"]), warmupCount: count,
  mainPartCounts: exerciseCounts, cooldownCount: count, mainPartCount: phaseCount,
  organizationMode: z.enum(["solo", "team"]), teamSize: count, groupSplitCount: count.optional(),
  obstacleInventoryDeclared: z.boolean(), availableObstacleExerciseIds: z.array(z.string().max(200)).max(200),
}).refine((value) => value.mainPartCounts.length === value.mainPartCount, { message: "Main-part counts must match the main-part count." });
export const QUICK_PLANNER_RECOVERY_KEY = "ocrcraft-quick-planner-recovery-v1";
export function builderRecoveryKey(sourceTrainingId?: string, mode = "local"): string {
  return `ocrcraft-builder-recovery-v1:${sourceTrainingId ?? "new"}:${mode}`;
}
