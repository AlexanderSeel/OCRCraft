import { z } from "zod";
import { CLUB_VENUE_IDS } from "@/domain/training/club-venues";
import { createPlanningSnapshot, readPlanningSnapshot, type PlanningSnapshot } from "./planning-recovery";

const text = z.string().max(200);
const choices = z.array(text).max(200);
const optionalCount = z.number().int().min(1).max(200).optional();
export const quickCreateRecoverySchema = z.object({
  venueId: z.enum(CLUB_VENUE_IDS).optional(),
  step: z.number().int().min(1).max(5), selectedGroupId: text, selectedTemplateKey: text,
  groupType: z.enum(["kids", "youth", "adults", "mixed"]), ageRange: text,
  participantCount: z.number().int().min(1).max(200), duration: z.number().int().min(1).max(180),
  groupSplitCount: optionalCount, groupOrganizationMode: z.enum(["solo", "team"]),
  groupTeamSize: optionalCount, stationGroupSizeTarget: optionalCount,
  goals: choices, bodyRegions: choices, avoidBodyRegions: choices,
  preferredExercises: z.array(z.object({ id: text, label: text, category: text })).max(200),
  formats: choices, competitionStyleKey: text, location: z.enum(["indoor", "outdoor", "mixed"]),
  availableEquipment: z.record(text, z.string().max(20)), obstacleInventoryDeclared: z.boolean(),
  availableObstacleExerciseIds: choices, intensity: z.enum(["technique", "balanced", "conditioning"]),
  sessionTitle: z.string().max(120),
});
export type QuickCreateRecovery = z.infer<typeof quickCreateRecoverySchema>;
export type QuickCreateSnapshot = PlanningSnapshot<QuickCreateRecovery>;
export const QUICK_CREATE_RECOVERY_KEY = "ocrcraft-quick-create-recovery-v1";
export function readQuickCreateSnapshot(raw: string): QuickCreateSnapshot | null {
  return readPlanningSnapshot(quickCreateRecoverySchema, raw);
}
export function createQuickCreateSnapshot(value: unknown): QuickCreateSnapshot | null {
  return createPlanningSnapshot(quickCreateRecoverySchema, value);
}
