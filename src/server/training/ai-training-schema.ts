import { z } from "zod";
import { TRAINING_FORMATS, TRAINING_PHASES } from "../../domain/training/model";

const aiTrainingItemSchema = z.object({
  exerciseId: z.string().trim().min(1).max(100),
  format: z.enum(TRAINING_FORMATS).optional(),
  level: z.enum(["level1", "level2", "level3"]).optional(),
  trainerNote: z.string().trim().max(500).optional(),
});

const aiTrainingPhaseSchema = z.object({
  kind: z.enum(TRAINING_PHASES),
  items: z.array(aiTrainingItemSchema).min(1).max(8),
});

export const aiTrainingPlanSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  rationale: z.string().trim().max(1200).optional(),
  phases: z.array(aiTrainingPhaseSchema).length(TRAINING_PHASES.length),
}).superRefine((value, context) => {
  const kinds = value.phases.map((phase) => phase.kind);
  for (const kind of TRAINING_PHASES) {
    if (kinds.filter((candidate) => candidate === kind).length !== 1) {
      context.addIssue({
        code: "custom",
        path: ["phases"],
        message: `Die AI-Ausgabe muss die Phase ${kind} genau einmal enthalten.`,
      });
    }
  }

  const exerciseIds = value.phases.flatMap((phase) => phase.items.map((item) => item.exerciseId));
  if (new Set(exerciseIds).size !== exerciseIds.length) {
    context.addIssue({
      code: "custom",
      path: ["phases"],
      message: "Eine Übung darf im AI-Entwurf nicht mehrfach vorkommen.",
    });
  }
});

export type AiTrainingPlan = z.infer<typeof aiTrainingPlanSchema>;
