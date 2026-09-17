import { z } from "zod";
import { TRAINING_FORMATS, TRAINING_PHASES } from "../../domain/training/model";
import { trainingDraftRequestSchema } from "./training-draft-schema";

const reviewedItemSchema = z.object({
  exerciseId: z.string().trim().min(1).max(100),
  durationMinutes: z.number().int().min(1).max(180),
  format: z.enum(TRAINING_FORMATS).optional(),
  instructions: z.string().trim().max(4000).optional(),
  levelLabel: z.string().trim().max(1000).optional(),
});

const reviewedPhaseSchema = z.object({
  kind: z.enum(TRAINING_PHASES),
  items: z.array(reviewedItemSchema).min(1).max(8),
});

export const reviewedAiTrainingPersistenceSchema = z.object({
  request: trainingDraftRequestSchema.refine((value) => value.builderMode === "ai", {
    message: "Reviewed AI persistence requires builderMode=ai.",
    path: ["builderMode"],
  }),
  title: z.string().trim().min(1).max(120).optional(),
  groupId: z.string().uuid().optional(),
  reviewed: z.object({
    phases: z.array(reviewedPhaseSchema).length(TRAINING_PHASES.length),
  }).superRefine((value, context) => {
    const kinds = value.phases.map((phase) => phase.kind);
    for (const kind of TRAINING_PHASES) {
      if (kinds.filter((candidate) => candidate === kind).length !== 1) {
        context.addIssue({ code: "custom", path: ["phases"], message: `${kind} muss genau einmal enthalten sein.` });
      }
    }
    const ids = value.phases.flatMap((phase) => phase.items.map((item) => item.exerciseId));
    if (new Set(ids).size !== ids.length) {
      context.addIssue({ code: "custom", path: ["phases"], message: "Übungen dürfen nicht doppelt vorkommen." });
    }
  }),
});

export type ReviewedAiTrainingPersistence = z.infer<typeof reviewedAiTrainingPersistenceSchema>;
