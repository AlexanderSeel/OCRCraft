import { z } from "zod";
import {
  exerciseCategories,
  exercisePhases,
  exerciseRiskLevels,
} from "../../domain/exercise/model";

export const aiExerciseDraftProposalSchema = z.object({
  nameDe: z.string().trim().min(2).max(120),
  nameEn: z.string().trim().min(2).max(120),
  summaryDe: z.string().trim().min(10).max(800),
  summaryEn: z.string().trim().min(10).max(800),
  aliasesDe: z.array(z.string().trim().min(1).max(80)).max(12).default([]),
  aliasesEn: z.array(z.string().trim().min(1).max(80)).max(12).default([]),
  category: z.enum(exerciseCategories),
  phase: z.enum(exercisePhases),
  riskLevel: z.enum(exerciseRiskLevels),
  minAge: z.number().int().min(4).max(99).nullable().default(null),
  rationale: z.string().trim().max(1000).optional(),
});

export type AiExerciseDraftProposal = z.infer<typeof aiExerciseDraftProposalSchema>;

export const aiExerciseDraftRequestSchema = z.object({
  brief: z.string().trim().min(10).max(3000),
});

export type AiExerciseDraftRequest = z.infer<typeof aiExerciseDraftRequestSchema>;
