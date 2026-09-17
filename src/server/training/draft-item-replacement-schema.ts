import { z } from "zod";
import { DRAFT_ALTERNATIVE_MODES } from "./draft-item-alternative";
import { trainingPhaseRegenerationSchema } from "./training-phase-regeneration-schema";

export const draftItemReplacementSchema = trainingPhaseRegenerationSchema
  .omit({ phase: true })
  .extend({
    exerciseId: z.string().trim().min(1).max(100),
    mode: z.enum(DRAFT_ALTERNATIVE_MODES),
  });

export type DraftItemReplacementRequest = z.infer<typeof draftItemReplacementSchema>;
