import { z } from "zod";
import { MAIN_PART_PROGRAMMING_MODES, TRAINING_FORMATS, TRAINING_PHASES } from "./model";

const nullableText = z.string().nullable();

export const savedTrainingTemplateSnapshotSchema = z.object({
  version: z.literal(1),
  session: z.object({
    title: z.string().trim().min(1).max(120),
    totalDurationMinutes: z.number().int().min(1).max(1440),
    locale: z.enum(["de", "en"]),
    notes: nullableText,
    organizationMode: z.enum(["solo", "team"]),
    teamSize: z.number().int().min(2).max(20).nullable(),
    groupSplitCount: z.number().int().min(1).max(20).nullable(),
  }),
  phases: z.array(z.object({
    kind: z.enum(TRAINING_PHASES),
    title: z.string().trim().min(1).max(160),
    sortOrder: z.number().int().min(0),
    items: z.array(z.object({
      exerciseId: z.string().uuid().nullable(),
      titleOverride: nullableText,
      format: z.enum(TRAINING_FORMATS).nullable(),
      durationMinutes: z.number().int().min(1).max(1440),
      instructions: nullableText,
      levelLabel: nullableText,
      sortOrder: z.number().int().min(0),
      mainPartIndex: z.number().int().min(1).max(20).nullable(),
      mainPartTitle: nullableText,
      programming: z.object({
        mode: z.enum(MAIN_PART_PROGRAMMING_MODES),
        workSeconds: z.number().int().optional(),
        restSeconds: z.number().int().optional(),
        rounds: z.number().int().optional(),
        scoreMode: z.enum(["time", "quality"]).optional(),
        ladderStart: z.number().int().optional(),
        ladderEnd: z.number().int().optional(),
        ladderStep: z.number().int().optional(),
        everyValue: z.number().int().optional(),
        everyUnit: z.enum(["metres", "minutes", "checkpoint"]).optional(),
      }).nullable(),
    })),
  })).min(1),
});

export type SavedTrainingTemplateSnapshot = z.infer<typeof savedTrainingTemplateSnapshotSchema>;

export function collectSavedTemplateExerciseIds(snapshot: SavedTrainingTemplateSnapshot): readonly string[] {
  return [...new Set(snapshot.phases.flatMap((phase) =>
    phase.items.flatMap((item) => item.exerciseId ? [item.exerciseId] : [])
  ))];
}

export function savedTemplateItemCount(snapshot: SavedTrainingTemplateSnapshot): number {
  return snapshot.phases.reduce((sum, phase) => sum + phase.items.length, 0);
}
