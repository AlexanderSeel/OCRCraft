import { afterEach, describe, expect, it, vi } from "vitest";
import type { TrainingDraftExerciseCandidate } from "@/domain/training/draft";
import { OpenAiCompatibleTrainingProvider } from "./ai-training-provider";
import type { TrainingDraftRequest } from "./training-draft-schema";

const request: TrainingDraftRequest = {
  audience: "adults",
  participantCount: 14,
  durationMinutes: 60,
  goals: ["OCR-Technik"],
  bodyRegions: ["forearms-grip"],
  avoidBodyRegions: [],
  exerciseTypes: ["skill"],
  formats: ["technique"],
  location: "indoor",
  intensity: "technique",
  builderMode: "ai",
  sourceTrainingIds: [
    "11111111-1111-4111-8111-111111111111",
    "22222222-2222-4222-8222-222222222222",
  ],
  preferredExerciseIds: [],
  availableEquipment: [],
  minAge: 18,
  locale: "de",
};

const exercise: TrainingDraftExerciseCandidate = {
  id: "exercise-approved",
  name: "Approved Rig Skill",
  category: "grip-rig",
  defaultPhase: "main",
  riskLevel: "low",
  minAge: null,
  bodyRegions: ["forearms-grip"],
  equipment: [],
  equipmentRequirements: [],
  stationCapacity: 14,
  tags: ["rig"],
  movementPatterns: ["hang"],
  exerciseType: "skill",
  difficulty: "beginner",
  impactLevel: "low",
  coordinationComplexity: "moderate",
  trainingGoals: ["ocr_technique", "grip"],
  planningText: "Controlled rig transition with stable shoulder position.",
  defaultDurationSeconds: 180,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("OpenAI-compatible training provider", () => {
  it("sends multiple previous sessions as bounded recomposition context", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      choices: [{
        message: {
          content: JSON.stringify({
            phases: [
              { kind: "warmup", items: [] },
              { kind: "main", items: [{ exerciseId: exercise.id }] },
              { kind: "cooldown", items: [] },
            ],
          }),
        },
      }],
    }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const provider = new OpenAiCompatibleTrainingProvider("http://localhost:11434/v1", "local-model", "secret");
    const sourceSessions = [
      {
        id: request.sourceTrainingIds[0],
        title: "Rig Dienstag",
        phases: [
          { kind: "warmup" as const, exerciseIds: [] },
          { kind: "main" as const, exerciseIds: [exercise.id] },
          { kind: "cooldown" as const, exerciseIds: [] },
        ],
      },
      {
        id: request.sourceTrainingIds[1],
        title: "OCR Donnerstag",
        phases: [
          { kind: "warmup" as const, exerciseIds: [] },
          { kind: "main" as const, exerciseIds: [exercise.id] },
          { kind: "cooldown" as const, exerciseIds: [] },
        ],
      },
    ];

    await provider.generateTrainingPlan({
      request,
      approvedExercises: [exercise],
      sourceSessions,
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(String(init?.body)) as {
      messages: { role: string; content: string }[];
    };
    const userPayload = JSON.parse(body.messages.find((message) => message.role === "user")?.content ?? "{}") as {
      sourceSessions: typeof sourceSessions;
      approvedExercises: { id: string }[];
      request: { bodyRegions: string[]; exerciseTypes: string[] };
    };

    expect(userPayload.sourceSessions.map((session) => session.id)).toEqual(request.sourceTrainingIds);
    expect(userPayload.approvedExercises.map((item) => item.id)).toEqual([exercise.id]);
    expect(userPayload.request.bodyRegions).toEqual(["forearms-grip"]);
    expect(userPayload.request.exerciseTypes).toEqual(["skill"]);
  });
});
