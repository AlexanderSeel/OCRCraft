import "server-only";

import {
  recordAiProviderUsage,
  type AiCapability,
  type ResolvedAiProvider,
} from "./ai-provider-settings-repository";

interface OpenAiCompatibleResponse {
  readonly choices?: readonly {
    readonly message?: { readonly content?: string | null };
  }[];
  readonly usage?: {
    readonly prompt_tokens?: number;
    readonly completion_tokens?: number;
    readonly total_tokens?: number;
  };
}

interface AnthropicResponse {
  readonly content?: readonly {
    readonly type?: string;
    readonly text?: string;
  }[];
  readonly usage?: {
    readonly input_tokens?: number;
    readonly output_tokens?: number;
  };
}

export interface AiJsonClient {
  readonly providerId: string;
  readonly modelId: string;
  generateJson(systemPrompt: string, userPayload: unknown): Promise<unknown>;
}

abstract class TrackedAiJsonClient implements AiJsonClient {
  readonly providerId: string;
  readonly modelId: string;

  constructor(
    protected readonly config: ResolvedAiProvider,
    protected readonly capability: AiCapability,
  ) {
    this.providerId = config.providerId;
    this.modelId = config.modelId;
  }

  abstract generateJson(systemPrompt: string, userPayload: unknown): Promise<unknown>;

  protected async recordUsage(input: {
    readonly inputTokens?: number;
    readonly outputTokens?: number;
    readonly totalTokens?: number;
    readonly status?: "succeeded" | "failed";
  }): Promise<void> {
    await recordAiProviderUsage({
      providerId: this.providerId,
      capability: this.capability,
      modelId: this.modelId,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      totalTokens: input.totalTokens,
      status: input.status,
    }).catch(() => undefined);
  }
}

export class OpenAiCompatibleJsonClient extends TrackedAiJsonClient {
  async generateJson(systemPrompt: string, userPayload: unknown): Promise<unknown> {
    const response = await fetch(`${this.config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(this.config.apiKey ? { authorization: `Bearer ${this.config.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: this.modelId,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(userPayload) },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      await this.recordUsage({ status: "failed" });
      throw new Error(`AI provider failed (${response.status})${detail ? `: ${detail.slice(0, 300)}` : ""}`);
    }

    const payload = await response.json() as OpenAiCompatibleResponse;
    const content = payload.choices?.[0]?.message?.content;
    await this.recordUsage({
      inputTokens: payload.usage?.prompt_tokens,
      outputTokens: payload.usage?.completion_tokens,
      totalTokens: payload.usage?.total_tokens,
    });
    if (!content) throw new Error("AI provider returned no JSON content.");

    try {
      return JSON.parse(content) as unknown;
    } catch {
      throw new Error("AI provider returned invalid JSON.");
    }
  }
}

export class AnthropicJsonClient extends TrackedAiJsonClient {
  async generateJson(systemPrompt: string, userPayload: unknown): Promise<unknown> {
    if (!this.config.apiKey) throw new Error("Anthropic API-Key fehlt.");
    const response = await fetch(`${this.config.baseUrl.replace(/\/$/, "")}/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.modelId,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: JSON.stringify(userPayload),
          },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      await this.recordUsage({ status: "failed" });
      throw new Error(`Anthropic provider failed (${response.status})${detail ? `: ${detail.slice(0, 300)}` : ""}`);
    }

    const payload = await response.json() as AnthropicResponse;
    const text = payload.content?.find((item) => item.type === "text")?.text;
    const inputTokens = payload.usage?.input_tokens ?? 0;
    const outputTokens = payload.usage?.output_tokens ?? 0;
    await this.recordUsage({
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
    });
    if (!text) throw new Error("Anthropic provider returned no JSON content.");

    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new Error("Anthropic provider returned invalid JSON.");
    }
  }
}

export function createAiJsonClient(
  config: ResolvedAiProvider,
  capability: AiCapability,
): AiJsonClient {
  return config.protocol === "anthropic"
    ? new AnthropicJsonClient(config, capability)
    : new OpenAiCompatibleJsonClient(config, capability);
}
