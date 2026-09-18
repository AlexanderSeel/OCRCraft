import { z } from "zod";
import { exerciseTypes } from "../../domain/exercise/classification";
import {
  AUDIENCES,
  BODY_REGIONS,
  MAIN_PART_EVERY_UNITS,
  MAIN_PART_PROGRAMMING_MODES,
  MAIN_PART_SCORE_MODES,
  TRAINING_FORMATS,
  TRAINING_LOCATIONS,
} from "../../domain/training/model";

export const TRAINING_BUILDER_MODES = ["local", "ai"] as const;
export type TrainingBuilderMode = (typeof TRAINING_BUILDER_MODES)[number];

export const mainPartProgrammingSchema = z.object({
  mode: z.enum(MAIN_PART_PROGRAMMING_MODES),
  workSeconds: z.number().int().min(5).max(3600).optional(),
  restSeconds: z.number().int().min(0).max(1800).optional(),
  rounds: z.number().int().min(1).max(50).optional(),
  scoreMode: z.enum(MAIN_PART_SCORE_MODES).optional(),
  ladderStart: z.number().int().min(1).max(100).optional(),
  ladderEnd: z.number().int().min(1).max(200).optional(),
  ladderStep: z.number().int().min(1).max(50).optional(),
  everyValue: z.number().int().min(1).max(10000).optional(),
  everyUnit: z.enum(MAIN_PART_EVERY_UNITS).optional(),
}).superRefine((value, context) => {
  if (value.mode === "interval") {
    if (value.workSeconds == null) context.addIssue({ code: "custom", path: ["workSeconds"], message: "Intervallblöcke benötigen eine Arbeitszeit." });
    if (value.restSeconds == null) context.addIssue({ code: "custom", path: ["restSeconds"], message: "Intervallblöcke benötigen eine Pausenzeit." });
  }
  if (value.mode === "rounds") {
    if (value.rounds == null) context.addIssue({ code: "custom", path: ["rounds"], message: "Rundenblöcke benötigen eine Rundenzahl." });
    if (value.scoreMode == null) context.addIssue({ code: "custom", path: ["scoreMode"], message: "Rundenblöcke benötigen Zeit oder Qualität als Ziel." });
  }
  if (["ladder", "reverse-ladder", "pyramid"].includes(value.mode)) {
    if (value.ladderStart == null) context.addIssue({ code: "custom", path: ["ladderStart"], message: "Ladder/Pyramid benötigt einen Startwert." });
    if (value.ladderEnd == null) context.addIssue({ code: "custom", path: ["ladderEnd"], message: "Ladder/Pyramid benötigt einen Endwert." });
    if (value.ladderStep == null) context.addIssue({ code: "custom", path: ["ladderStep"], message: "Ladder/Pyramid benötigt eine Schrittweite." });
    if (value.mode === "ladder" && value.ladderStart != null && value.ladderEnd != null && value.ladderStart >= value.ladderEnd) {
      context.addIssue({ code: "custom", path: ["ladderEnd"], message: "Eine aufsteigende Ladder benötigt einen Endwert über dem Startwert." });
    }
    if (value.mode === "reverse-ladder" && value.ladderStart != null && value.ladderEnd != null && value.ladderStart <= value.ladderEnd) {
      context.addIssue({ code: "custom", path: ["ladderEnd"], message: "Eine Reverse Ladder benötigt einen Endwert unter dem Startwert." });
    }
  }
  if (value.mode === "every") {
    if (value.everyValue == null) context.addIssue({ code: "custom", path: ["everyValue"], message: "Every-X benötigt einen Abstand/Wert." });
    if (value.everyUnit == null) context.addIssue({ code: "custom", path: ["everyUnit"], message: "Every-X benötigt eine Einheit." });
  }
});

export const trainingDraftRequestSchema = z.object({
  templateKey: z.string().regex(/^[a-z0-9][a-z0-9-]{2,79}$/).optional(),
  groupId: z.string().uuid().optional(),
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
  warmupExerciseCount: z.number().int().min(1).max(6).default(2),
  mainExerciseCount: z.number().int().min(1).max(8).default(4),
  mainPartExerciseCounts: z.array(z.number().int().min(1).max(8)).max(4).default([]),
  mainPartProgramming: z.array(mainPartProgrammingSchema).max(4).default([]),
  cooldownExerciseCount: z.number().int().min(1).max(6).default(2),
  mainPartCount: z.number().int().min(1).max(4).default(1),
  organizationMode: z.enum(["solo", "team"]).default("solo"),
  teamSize: z.number().int().min(2).max(20).optional(),
  /** Explicit number of parallel rotation groups in solo/rotation mode. */
  groupSplitCount: z.number().int().min(1).max(20).optional(),
  sourceTrainingIds: z.array(z.string().uuid()).max(6).default([]),
  preferredExerciseIds: z.array(z.string().trim().min(1).max(100)).max(12),
  availableEquipment: z.array(z.object({
    equipmentId: z.string().trim().min(1).max(100),
    quantityAvailable: z.number().int().min(0).max(500),
  })).max(100).default([]),
  /** Omitted = do not constrain club obstacles; present [] = explicitly no obstacle stations available. */
  availableObstacleExerciseIds: z.array(z.string().uuid()).max(100).optional(),
  minAge: z.number().int().min(3).max(99).optional(),
  maxAge: z.number().int().min(3).max(99).optional(),
  locale: z.enum(["de", "en"]).default("de"),
}).refine(
  (value) => new Set(value.availableEquipment.map((item) => item.equipmentId)).size === value.availableEquipment.length,
  { message: "Jede Ausrüstungsart darf nur einmal angegeben werden.", path: ["availableEquipment"] },
).refine(
  (value) => value.availableObstacleExerciseIds == null || new Set(value.availableObstacleExerciseIds).size === value.availableObstacleExerciseIds.length,
  { message: "Jede Hindernisstation darf nur einmal angegeben werden.", path: ["availableObstacleExerciseIds"] },
).refine(
  (value) => new Set(value.sourceTrainingIds).size === value.sourceTrainingIds.length,
  { message: "Ein Quelltraining darf nur einmal ausgewählt werden.", path: ["sourceTrainingIds"] },
).refine(
  (value) => value.minAge == null || value.maxAge == null || value.minAge <= value.maxAge,
  { message: "minAge darf nicht größer als maxAge sein.", path: ["maxAge"] },
).refine(
  (value) => !value.bodyRegions.some((region) => value.avoidBodyRegions.includes(region)),
  { message: "Eine Körperregion kann nicht gleichzeitig Fokus und Ausschluss sein.", path: ["avoidBodyRegions"] },
).refine(
  (value) => value.organizationMode !== "team" || value.teamSize != null,
  { message: "Für Teamtraining ist eine Teamgröße erforderlich.", path: ["teamSize"] },
).refine(
  (value) => value.teamSize == null || value.teamSize <= value.participantCount,
  { message: "Die Teamgröße darf die Teilnehmerzahl nicht überschreiten.", path: ["teamSize"] },
).refine(
  (value) => !value.formats.includes("partner")
    || (value.organizationMode === "team" && value.teamSize === 2),
  { message: "Partner Workout wird verbindlich in 2er-Teams geplant.", path: ["teamSize"] },
).refine(
  (value) => value.organizationMode !== "team" || value.groupSplitCount == null,
  { message: "Rotationsgruppen werden nur im Solo-/Rotationsmodus verwendet.", path: ["groupSplitCount"] },
).refine(
  (value) => value.groupSplitCount == null || value.groupSplitCount <= value.participantCount,
  { message: "Es kann nicht mehr Rotationsgruppen als Teilnehmende geben.", path: ["groupSplitCount"] },
).refine(
  (value) => value.mainPartExerciseCounts.length === 0 || value.mainPartExerciseCounts.length === value.mainPartCount,
  { message: "Für jeden Hauptteil muss genau eine Übungsanzahl angegeben werden.", path: ["mainPartExerciseCounts"] },
).refine(
  (value) => value.mainPartProgramming.length === 0 || value.mainPartProgramming.length === value.mainPartCount,
  { message: "Für jeden Hauptteil muss genau eine Programmierung angegeben werden.", path: ["mainPartProgramming"] },
);

type ParsedTrainingDraftRequest = z.infer<typeof trainingDraftRequestSchema>;

export type TrainingDraftRequest = Omit<ParsedTrainingDraftRequest, "mainPartExerciseCounts" | "mainPartProgramming"> & {
  readonly mainPartExerciseCounts?: readonly number[];
  readonly mainPartProgramming?: readonly z.infer<typeof mainPartProgrammingSchema>[];
};