import { z } from "zod";
import {
  exerciseCategories,
  exercisePhases,
  exerciseRiskLevels,
  type ExerciseDraft,
} from "@/domain/exercise/model";

const nullableAge = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : Number(value)))
  .refine((value) => value === null || (Number.isInteger(value) && value >= 4 && value <= 99), {
    message: "Bitte ein Alter zwischen 4 und 99 angeben.",
  });

export const exerciseFormSchema = z.object({
  nameDe: z.string().trim().min(2, "Der deutsche Name ist erforderlich."),
  nameEn: z.string().trim(),
  summaryDe: z.string().trim().max(800, "Maximal 800 Zeichen."),
  summaryEn: z.string().trim().max(800, "Maximal 800 Zeichen."),
  aliasesDe: z.string().trim().max(500),
  aliasesEn: z.string().trim().max(500),
  category: z.enum(exerciseCategories),
  phase: z.enum(exercisePhases),
  riskLevel: z.enum(exerciseRiskLevels),
  minAge: nullableAge,
});

export type ExerciseFormFields = z.infer<typeof exerciseFormSchema>;

function aliases(value: string): readonly string[] {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}

export function toExerciseDraft(fields: ExerciseFormFields): ExerciseDraft {
  return {
    nameDe: fields.nameDe,
    nameEn: fields.nameEn || fields.nameDe,
    summaryDe: fields.summaryDe,
    summaryEn: fields.summaryEn || fields.summaryDe,
    aliasesDe: aliases(fields.aliasesDe),
    aliasesEn: aliases(fields.aliasesEn),
    category: fields.category,
    phase: fields.phase,
    riskLevel: fields.riskLevel,
    minAge: fields.minAge,
  };
}
