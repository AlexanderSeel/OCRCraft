import { beforeEach, expect, it, vi } from "vitest";
import { trainingDraftRequestSchema } from "./training-draft-schema";
import { trainingPhaseRegenerationSchema } from "./training-phase-regeneration-schema";
import { draftItemReplacementSchema } from "./draft-item-replacement-schema";

const repository = vi.hoisted(() => ({ list: vi.fn(async () => { throw new Error("repository boundary reached"); }) }));
vi.mock("server-only", () => ({}));
vi.mock("./training-draft-repository", () => ({ listTrainingDraftCandidates: repository.list }));
vi.mock("./training-club-rule-service", () => ({
  resolveTrainingClubRules: async () => ({}), assertTrainerQualificationForRules: async () => undefined,
  filterCandidatesForClubRules: vi.fn(),
}));
import { createTrainingDraft } from "./training-draft-service";
import { regenerateTrainingDraftPhase } from "./training-phase-regeneration";
import { replaceDraftExerciseWithAlternative } from "./draft-item-replacement";

beforeEach(() => { repository.list.mockClear(); });

it.each(["local", "ai"] as const)("keeps every %s candidate lookup outdoor for a selected venue", async (builderMode) => {
  const request = trainingDraftRequestSchema.parse({ audience: "adults", participantCount: 8, durationMinutes: 60,
    goals: ["OCR-Technik"], bodyRegions: [], formats: ["circuit"], intensity: "balanced", preferredExerciseIds: [],
    venueId: "synthetic-court", location: "mixed", builderMode });
  const current = { title: "Test", phases: [
    { kind: "warmup", items: [{ exerciseId: "warmup", durationMinutes: 9 }] },
    { kind: "main", items: [{ exerciseId: "main", durationMinutes: 45 }] },
    { kind: "cooldown", items: [{ exerciseId: "cooldown", durationMinutes: 6 }] },
  ] };
  await expect(createTrainingDraft(request)).rejects.toThrow("repository boundary reached");
  await expect(regenerateTrainingDraftPhase(trainingPhaseRegenerationSchema.parse({ request, phase: "main", current }))).rejects.toThrow("repository boundary reached");
  await expect(replaceDraftExerciseWithAlternative(draftItemReplacementSchema.parse({ request, current, exerciseId: "main", mode: "easier" }))).rejects.toThrow("repository boundary reached");
  expect(repository.list).toHaveBeenCalledTimes(3);
  for (let call = 1; call <= 3; call += 1) expect(repository.list).toHaveBeenNthCalledWith(call, expect.objectContaining({ location: "outdoor" }));
});
