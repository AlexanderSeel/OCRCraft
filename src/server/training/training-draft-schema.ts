import { z } from "zod";
import { exerciseTypes } from "../../domain/exercise/classification";
import { AUDIENCES, BODY_REGIONS, TRAINING_FORMATS, TRAINING_LOCATIONS } from "../../domain/training/model";

export const TRAINING_BUILDER_MODES = ["local", "ai"] as const;
export type TrainingBuilderMode = (typeof TRAINING_BUILDER_MODES)[number];

export const trainingDraftRequestSchema = z.object({
  audience: z.enum(AUDIENCES),
  participantCount: z.number().int().min(1).max(200),
  durationMinutes: z.number().int().min(30).max(180),
  goals: z.array(z.string().trim().min(1).max(80)).min(1).max(12),
  bodyRegions: z.array(z.enum(BODY_REGIONS)).max(BODY_REGIONS.length),
  avoidBodyRegions: z.array(z.enum(BODY_REGIONS)).max(BODY_REGIONS.length).default([]),
  exerciseTypes: z.array(z.enum(exerciseTypes)).max(exerciseTypes.length).default([]),
  formats: z.array(z.enum(TRAINING_FORMATS)).min(1).max(4),
  location: z.enum(TRAINING_LOCATIONS).default("mixed"),
  intensity: z.enum(["technique", "balanced", "conditioning"]),
  builderMode: z.enum(TRAINING_BUILDER_MODES).default("local"),
  sourceTrainingIds: z.array(z.string().uuid()).max(6).default([]),
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
  (value) => new Set(value.sourceTrainingIds).size === value.sourceTrainingIds.length,
  { message: "Ein Quelltraining darf nur einmal ausgewählt werden.", path: ["sourceTrainingIds"] },
).refine(
  (value) => value.minAge == null || value.maxAge == null || value.minAge <= value.maxAge,
  { message: "minAge darf nicht größer als maxAge sein.", path: ["maxAge"] },
).refine(
  (value) => !value.bodyRegions.some((region) => value.avoidBodyRegions.includes(region)),
  { message: "Eine Körperregion kann nicht gleichzeitig Fokus und Ausschluss sein.", path: ["avoidBodyRegions"] },
);

export type TrainingDraftRequest = z.infer<typeof trainingDraftRequestSchema>;
