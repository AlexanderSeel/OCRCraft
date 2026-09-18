import { z } from "zod";
import { trainingDraftRequestSchema } from "./training-draft-schema";

export const trainingDraftPersistenceSchema = z.object({
  request: trainingDraftRequestSchema,
  title: z.string().trim().min(1).max(120).optional(),
  groupId: z.string().uuid().optional(),
}).refine(
  (value) => value.groupId === value.request.groupId,
  {
    message: "Die gespeicherte Trainingsgruppe muss der validierten Regelgruppe entsprechen.",
    path: ["groupId"],
  },
);

export type TrainingDraftPersistenceRequest = z.infer<typeof trainingDraftPersistenceSchema>;
