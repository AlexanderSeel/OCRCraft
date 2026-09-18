import { z } from "zod";
import { TRAINING_FORMATS, TRAINING_PHASES } from "../../domain/training/model";
import { trainingDraftRequestSchema } from "./training-draft-schema";

const reviewedItemSchema = z.object({
  exerciseId: z.string().trim().min(1).max(100),
  durationMinutes: z.number().int().min(1).max(180),
  format: z.enum(TRAINING_FORMATS).optional(),
  instructions: z.string().trim().max(4000).optional(),
  levelLabel: z.string().trim().max(1000).optional(),
  mainPartIndex: z.number().int().min(1).max(4).optional(),
  mainPartTitle: z.string().trim().min(1).max(120).optional(),
});

const reviewedPhaseSchema = z.object({
  kind: z.enum(TRAINING_PHASES),
  items: z.array(reviewedItemSchema).min(1).max(32),
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
  }),
}).superRefine((value, context) => {
  if (value.groupId !== value.request.groupId) {
    context.addIssue({
      code: "custom",
      path: ["groupId"],
      message: "Die gespeicherte Trainingsgruppe muss der validierten Regelgruppe entsprechen.",
    });
  }

  const kinds = value.reviewed.phases.map((phase) => phase.kind);
  for (const kind of TRAINING_PHASES) {
    if (kinds.filter((candidate) => candidate === kind).length !== 1) {
      context.addIssue({ code: "custom", path: ["reviewed", "phases"], message: `${kind} muss genau einmal enthalten sein.` });
    }
  }

  const ids = value.reviewed.phases.flatMap((phase) => phase.items.map((item) => item.exerciseId));
  if (new Set(ids).size !== ids.length) {
    context.addIssue({ code: "custom", path: ["reviewed", "phases"], message: "Übungen dürfen nicht doppelt vorkommen." });
  }

  const warmup = value.reviewed.phases.find((phase) => phase.kind === "warmup");
  const main = value.reviewed.phases.find((phase) => phase.kind === "main");
  const cooldown = value.reviewed.phases.find((phase) => phase.kind === "cooldown");
  if (warmup && warmup.items.length !== value.request.warmupExerciseCount) {
    context.addIssue({ code: "custom", path: ["reviewed", "phases"], message: `Aufwärmen muss ${value.request.warmupExerciseCount} Übungen enthalten.` });
  }
  if (cooldown && cooldown.items.length !== value.request.cooldownExerciseCount) {
    context.addIssue({ code: "custom", path: ["reviewed", "phases"], message: `Cooldown muss ${value.request.cooldownExerciseCount} Übungen enthalten.` });
  }
  if (main) {
    const expectedCounts = Array.from(
      { length: value.request.mainPartCount },
      (_, index) => value.request.mainPartExerciseCounts[index] ?? value.request.mainExerciseCount,
    );
    const expectedMainItems = expectedCounts.reduce((sum, count) => sum + count, 0);
    if (main.items.length !== expectedMainItems) {
      context.addIssue({ code: "custom", path: ["reviewed", "phases"], message: `Hauptteil muss insgesamt ${expectedMainItems} Übungen enthalten.` });
    }
    for (let part = 1; part <= value.request.mainPartCount; part += 1) {
      const expectedCount = expectedCounts[part - 1] ?? value.request.mainExerciseCount;
      const count = main.items.filter((item) => (item.mainPartIndex ?? 1) === part).length;
      if (count !== expectedCount) {
        context.addIssue({
          code: "custom",
          path: ["reviewed", "phases"],
          message: `Hauptteil ${part} muss ${expectedCount} Übungen enthalten.`,
        });
      }
    }
    if (main.items.some((item) => (item.mainPartIndex ?? 1) > value.request.mainPartCount)) {
      context.addIssue({ code: "custom", path: ["reviewed", "phases"], message: "Der geprüfte AI-Entwurf enthält einen nicht angeforderten Hauptteil." });
    }
  }

  for (const phase of value.reviewed.phases.filter((candidate) => candidate.kind !== "main")) {
    if (phase.items.some((item) => item.mainPartIndex != null || item.mainPartTitle != null)) {
      context.addIssue({ code: "custom", path: ["reviewed", "phases"], message: "Hauptteil-Metadaten dürfen nur im Hauptteil vorkommen." });
    }
  }
});

export type ReviewedAiTrainingPersistence = z.infer<typeof reviewedAiTrainingPersistenceSchema>;
