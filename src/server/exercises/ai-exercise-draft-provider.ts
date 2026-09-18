import "server-only";

import { createAiJsonFallbackClient } from "@/server/ai/ai-json-provider";
import { resolveAiProviderChain } from "@/server/ai/ai-provider-settings-repository";
import {
  aiExerciseDraftProposalSchema,
  type AiExerciseDraftProposal,
  type AiExerciseDraftRequest,
} from "./ai-exercise-draft-schema";

export interface AiExerciseDraftProvider {
  readonly id: string;
  readonly modelId?: string;
  generateExerciseDraft(request: AiExerciseDraftRequest): Promise<AiExerciseDraftProposal>;
}

interface OpenAiCompatibleResponse {
  readonly choices?: readonly {
    readonly message?: { readonly content?: string | null };
  }[];
}

export class OpenAiCompatibleExerciseDraftProvider implements AiExerciseDraftProvider {
  readonly id = "openai-compatible";
  readonly modelId: string;

  constructor(
    private readonly baseUrl: string,
    model: string,
    private readonly apiKey?: string,
  ) {
    this.modelId = model;
  }

  async generateExerciseDraft(request: AiExerciseDraftRequest): Promise<AiExerciseDraftProposal> {
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
          { role: "system", content: exerciseDraftSystemPrompt() },
          { role: "user", content: JSON.stringify(exerciseDraftPayload(request)) },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`AI exercise provider failed (${response.status})${detail ? `: ${detail.slice(0, 300)}` : ""}`);
    }

    const payload = await response.json() as OpenAiCompatibleResponse;
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI exercise provider returned no JSON draft.");

    let parsed: unknown;
    try {
      parsed = JSON.parse(content) as unknown;
    } catch {
      throw new Error("AI exercise provider returned invalid JSON.");
    }
    return aiExerciseDraftProposalSchema.parse(parsed);
  }
}

class ConfiguredAiExerciseDraftProvider implements AiExerciseDraftProvider {
  constructor(
    private readonly client: ReturnType<typeof createAiJsonFallbackClient>,
  ) {}

  get id(): string {
    return this.client.providerId;
  }

  get modelId(): string {
    return this.client.modelId;
  }

  async generateExerciseDraft(request: AiExerciseDraftRequest): Promise<AiExerciseDraftProposal> {
    const proposal = await this.client.generateJson(
      exerciseDraftSystemPrompt(),
      exerciseDraftPayload(request),
    );
    return aiExerciseDraftProposalSchema.parse(proposal);
  }
}

export async function getConfiguredAiExerciseDraftProvider(): Promise<AiExerciseDraftProvider | null> {
  const configs = await resolveAiProviderChain("exercise_draft");
  if (configs.length === 0) return null;
  return new ConfiguredAiExerciseDraftProvider(createAiJsonFallbackClient(configs, "exercise_draft"));
}
function exerciseDraftSystemPrompt(): string {
  return [
    "Create one OCRCraft exercise draft for trainer review.",
    "Return JSON only and use exactly the requested schema.",
    "Write independent German and English names/summaries, concise common aliases, and conservative training metadata.",
    "Do not provide medical diagnosis, rehabilitation claims, unsafe obstacle instructions, invented certifications, or third-party copyrighted descriptions.",
    "This is only a pending draft. A trainer must approve it before it can enter the active exercise catalogue.",
    "Allowed category values: warmup, mobility, strength, core, running, grip-rig, carry-lift, ocr-skill, balance-agility, throw, cooldown, general.",
    "Allowed phase values: warmup, main, cooldown. Allowed riskLevel values: low, medium, high.",
  ].join(" ");
}

function exerciseDraftPayload(request: AiExerciseDraftRequest) {
  return {
    brief: request.brief,
    outputSchema: {
      nameDe: "string",
      nameEn: "string",
      summaryDe: "string",
      summaryEn: "string",
      aliasesDe: ["string"],
      aliasesEn: ["string"],
      category: "allowed category",
      phase: "warmup | main | cooldown",
      riskLevel: "low | medium | high",
      minAge: "integer 4..99 or null",
      rationale: "optional short trainer-facing reason",
    },
  };
}

