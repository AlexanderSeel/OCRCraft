import { z } from "zod";
import { AUDIENCES, BODY_REGIONS, TRAINING_FORMATS } from "../../domain/training/model";

export const trainingDraftRequestSchema = z.object({
  audience: z.enum(AUDIENCES),
  participantCount: z.number().int().min(1).max(200),
  durationMinutes: z.number().int().min(30).max(180),
  goals: z.array(z.string().trim().min(1).max(80)).min(1).max(12),
  bodyRegions: z.array(z.enum(BODY_REGIONS)).max(BODY_REGIONS.length),
  formats: z.array(z.enum(TRAINING_FORMATS)).min(1).max(4),
  intensity: z.enum(["technique", "balanced", "conditioning"]),
  preferredExerciseIds: z.array(z.string().trim().min(1).max(100)).max(12),
  availableEquipment: z.array(z.object({
    equipmentId: z.string().trim().min(1).max(100),
    quantityAvailable: z.number().int().min(0).max(500),
  })).max(100).default([]),
  minAge: z.number().int().min(3).max(99).optional(),
  maxAge: z.number().int().min(3).max(99).optional(),
  locale: z.enum(["de", "en"]).default("de"),
}).refine(
  (value) => new Set(value.availableEquipment.map((item) => item.equipmentId)).size === value.availableEquipment.length,
  { message: "Jede Ausrüstungsart darf nur einmal angegeben werden.", path: ["availableEquipment"] },
).refine(
  (value) => value.minAge == null || value.maxAge == null || value.minAge <= value.maxAge,
  { message: "minAge darf nicht größer als maxAge sein.", path: ["maxAge"] },
);

export type TrainingDraftRequest = z.infer<typeof trainingDraftRequestSchema>;
