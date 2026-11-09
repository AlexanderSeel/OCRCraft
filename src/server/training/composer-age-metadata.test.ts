import { describe, expect, it } from "vitest";
import type { TrainingDraftExerciseCandidate } from "@/domain/training/draft";
import { composeSportsTrainingDraft } from "./sports-training-composer";
import { composeStructuredSportsTrainingDraft } from "./structured-sports-training-composer";
import { composeAiTrainingDraft } from "./ai-training-composer";
import { trainingDraftRequestSchema } from "./training-draft-schema";

const candidates: TrainingDraftExerciseCandidate[] = (["warmup","main","cooldown"] as const).map((phase) => ({
  id: phase, name: phase, category: phase === "main" ? "strength" : phase,
  defaultPhase: phase, riskLevel: "low", minAge: 8, bodyRegions: ["full-body"], equipment: [],
  equipmentRequirements: [], stationCapacity: 12, tags: [], defaultDurationSeconds: 180,
  movementPatterns: ["locomotion"], exerciseType: "drill", difficulty: "beginner", impactLevel: "low",
  coordinationComplexity: "simple", trainingGoals: ["coordination"],
}));
const request = trainingDraftRequestSchema.parse({ audience:"kids",minAge:10,participantCount:4,durationMinutes:45,
  goals:["Koordination"],bodyRegions:[],formats:["circuit"],intensity:"balanced",preferredExerciseIds:[],
  warmupExerciseCount:1,mainExerciseCount:1,mainPartExerciseCounts:[1],cooldownExerciseCount:1,mainPartCount:1 });

describe("age metadata preservation through composition", () => {
  it.each(["offline", "structured offline", "AI"] as const)("preserves the catalog minimum age in %s output", (mode) => {
    const draft = mode === "AI" ? composeAiTrainingDraft({
      request,approvedExercises:candidates,providerId:"test",
      proposal:{phases:candidates.map((candidate)=>({kind:candidate.defaultPhase,items:[{exerciseId:candidate.id}]}))},
    }) : mode === "offline" ? composeSportsTrainingDraft(request,candidates) : composeStructuredSportsTrainingDraft(request,candidates);
    const items=draft.session.phases.flatMap((phase)=>phase.items);
    expect(items).toHaveLength(3);
    expect(items.every((item)=>item.exercise.minimumAge===8)).toBe(true);
  });
});

describe("shared logistics validation through composition", () => {
  it.each(["offline", "structured offline", "AI"] as const)("includes cross-phase transitions in %s estimates", (mode) => {
    const withLogistics = candidates.map((candidate) => ({ ...candidate, setupSeconds: 60, transitionSeconds: 90 }));
    const draft = mode === "AI" ? composeAiTrainingDraft({
      request, approvedExercises: withLogistics, providerId: "test",
      proposal: { phases: withLogistics.map((candidate) => ({ kind: candidate.defaultPhase, items: [{ exerciseId: candidate.id }] })) },
    }) : mode === "offline" ? composeSportsTrainingDraft(request, withLogistics) : composeStructuredSportsTrainingDraft(request, withLogistics);
    expect(draft.validationIssues).toContainEqual(expect.objectContaining({
      code: "setup-transition-time", severity: "warning", estimatedLogisticsMinutes: 6, estimatedTotalMinutes: 51,
    }));
    expect(draft.session.totalDurationMinutes).toBe(request.durationMinutes);
  });
});
