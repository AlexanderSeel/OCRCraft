import type { TrainingDraftExerciseCandidate } from "@/domain/training/draft";
import { SPORTS_PLANNING_PRINCIPLES } from "./sports-planning-principles";
import type { TrainingDraftRequest } from "./training-draft-schema";

type CandidateWithHistory = TrainingDraftExerciseCandidate & { readonly recentUseCount?: number };

export interface AiTrainingSourceSession {
  readonly id: string;
  readonly title: string;
  readonly phases: readonly {
    readonly kind: "warmup" | "main" | "cooldown";
    readonly exerciseIds: readonly string[];
  }[];
}

export interface AiTrainingGenerationContext {
  readonly request: TrainingDraftRequest;
  readonly approvedExercises: readonly TrainingDraftExerciseCandidate[];
  readonly sourceSessions?: readonly AiTrainingSourceSession[];
}

export interface AiTrainingProvider {
  readonly id: string;
  readonly modelId?: string;
  generateTrainingPlan(context: AiTrainingGenerationContext): Promise<unknown>;
}

interface OpenAiCompatibleResponse {
  readonly choices?: readonly {
    readonly message?: {
      readonly content?: string | null;
    };
  }[];
}

export class OpenAiCompatibleTrainingProvider implements AiTrainingProvider {
  readonly id = "openai-compatible";
  readonly modelId: string;

  constructor(
    private readonly baseUrl: string,
    model: string,
    private readonly apiKey?: string,
  ) {
    this.modelId = model;
  }

  async generateTrainingPlan(context: AiTrainingGenerationContext): Promise<unknown> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: this.modelId,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: [
              "You are OCRCraft's training-plan composer.",
              "Use ONLY exerciseId values from the approved exercise pool.",
              "Return JSON only. Do not invent exercises, equipment, safety facts or medical advice.",
              "Create exactly one canonical warmup phase, one canonical main phase and one canonical cooldown phase.",
              "Respect the exact requested exercise counts. If mainPartCount is greater than one, assign every main item a 1-based mainPart and place exactly mainExerciseCount exercises in each main part.",
              "Respect organizationMode and teamSize. For team mode prefer exercises whose station capacity and teamwork metadata fit the requested team size.",
              "Respect audience, ages, goals, body focus/avoidance, requested exercise types, formats, location, intensity and equipment.",
              "If sourceSessions are supplied, use them as inspiration/context for recomposition, not as permission to bypass current constraints or copy every item.",
              "When two exercises are similarly suitable, prefer the one with the lower recentUseCount so recent sessions are not repeated unnecessarily.",
              "Preferred exercise IDs may intentionally override that variety preference.",
              "Follow the supplied sportsPlanningPrinciples; the same principles are checked deterministically after generation.",
              "The server assigns exact phase/block durations and runs deterministic safety/logistics validation after your proposal.",
            ].join(" "),
          },
          {
            role: "user",
            content: JSON.stringify(buildPromptPayload(context)),
          },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`AI provider failed (${response.status})${detail ? `: ${detail.slice(0, 300)}` : ""}`);
    }

    const payload = await response.json() as OpenAiCompatibleResponse;
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI provider returned no JSON training proposal.");

    try {
      return JSON.parse(content) as unknown;
    } catch {
      throw new Error("AI provider returned invalid JSON.");
    }
  }
}

export function getConfiguredAiTrainingProvider(): AiTrainingProvider | null {
  const baseUrl = process.env.OCRCRAFT_AI_BASE_URL?.trim();
  const model = process.env.OCRCRAFT_AI_MODEL?.trim();
  if (!baseUrl || !model) return null;

  return new OpenAiCompatibleTrainingProvider(
    baseUrl,
    model,
    process.env.OCRCRAFT_AI_API_KEY?.trim() || undefined,
  );
}

function buildPromptPayload(context: AiTrainingGenerationContext) {
  return {
    outputSchema: {
      title: "optional string",
      rationale: "optional short trainer-facing rationale",
      phases: [
        {
          kind: "warmup | main | cooldown",
          items: [
            {
              exerciseId: "approved exercise id",
              format: "optional free | circuit | tabata | amrap | emom | rig-run | run-exercise | technique | relay",
              level: "optional level1 | level2 | level3",
              trainerNote: "optional short note",
              mainPart: "required 1-based integer for main items when mainPartCount > 1; omit outside main",
            },
          ],
        },
      ],
    },
    sportsPlanningPrinciples: SPORTS_PLANNING_PRINCIPLES,
    sourceSessions: context.sourceSessions ?? [],
    request: {
      audience: context.request.audience,
      minAge: context.request.minAge,
      maxAge: context.request.maxAge,
      participantCount: context.request.participantCount,
      durationMinutes: context.request.durationMinutes,
      goals: context.request.goals,
      bodyRegions: context.request.bodyRegions,
      avoidBodyRegions: context.request.avoidBodyRegions,
      exerciseTypes: context.request.exerciseTypes,
      formats: context.request.formats,
      location: context.request.location,
      intensity: context.request.intensity,
      warmupExerciseCount: context.request.warmupExerciseCount,
      mainExerciseCount: context.request.mainExerciseCount,
      cooldownExerciseCount: context.request.cooldownExerciseCount,
      mainPartCount: context.request.mainPartCount,
      organizationMode: context.request.organizationMode,
      teamSize: context.request.teamSize,
      preferredExerciseIds: context.request.preferredExerciseIds,
      availableEquipment: context.request.availableEquipment,
    },
    approvedExercises: context.approvedExercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      category: exercise.category,
      phase: exercise.defaultPhase,
      exerciseType: exercise.exerciseType,
      trainingGoals: exercise.trainingGoals,
      difficulty: exercise.difficulty,
      impactLevel: exercise.impactLevel,
      coordinationComplexity: exercise.coordinationComplexity,
      riskLevel: exercise.riskLevel,
      minAge: exercise.minAge,
      bodyRegions: exercise.bodyRegions,
      movementPatterns: exercise.movementPatterns,
      tags: exercise.tags,
      equipment: exercise.equipmentRequirements,
      stationCapacity: exercise.stationCapacity,
      recentUseCount: Math.max(0, Number((exercise as CandidateWithHistory).recentUseCount ?? 0)),
      structuredContext: exercise.planningText?.slice(0, 900),
      level1: exercise.level1?.slice(0, 280),
      level2: exercise.level2?.slice(0, 280),
      level3: exercise.level3?.slice(0, 280),
    })),
  };
}
