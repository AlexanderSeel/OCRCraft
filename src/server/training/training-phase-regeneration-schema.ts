import { z } from "zod";
import { TRAINING_FORMATS, TRAINING_PHASES } from "../../domain/training/model";
import { trainingDraftRequestSchema } from "./training-draft-schema";

const preservedItemSchema = z.object({
  exerciseId: z.string().trim().min(1).max(100),
  durationMinutes: z.number().int().min(1).max(180),
  format: z.enum(TRAINING_FORMATS).optional(),
  instructions: z.string().trim().max(4000).optional(),
  levelLabel: z.string().trim().max(1000).optional(),
});

const preservedPhaseSchema = z.object({
  kind: z.enum(TRAINING_PHASES),
  items: z.array(preservedItemSchema).min(1).max(8),
});

export const trainingPhaseRegenerationSchema = z.object({
  request: trainingDraftRequestSchema,
  phase: z.enum(TRAINING_PHASES),
  current: z.object({
    title: z.string().trim().min(1).max(120),
    phases: z.array(preservedPhaseSchema).length(TRAINING_PHASES.length),
  }).superRefine((value, context) => {
    const kinds = value.phases.map((phase) => phase.kind);
    for (const kind of TRAINING_PHASES) {
      if (kinds.filter((candidate) => candidate === kind).length !== 1) {
        context.addIssue({ code: "custom", path: ["phases"], message: `${kind} muss genau einmal enthalten sein.` });
      }
    }
    const ids = value.phases.flatMap((phase) => phase.items.map((item) => item.exerciseId));
    if (new Set(ids).size !== ids.length) {
      context.addIssue({ code: "custom", path: ["phases"], message: "Der aktuelle Entwurf darf keine Übung doppelt enthalten." });
    }
  }),
});

export type TrainingPhaseRegenerationRequest = z.infer<typeof trainingPhaseRegenerationSchema>;
