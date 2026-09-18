import "server-only";

import { z } from "zod";
import type { GeneratedExerciseImage } from "./exercise-image-types";
import { recordAiProviderUsage } from "@/server/ai/ai-provider-settings-repository";

export const OPENAI_IMAGE_MODEL = "gpt-image-2";
const endpoint = "https://api.openai.com/v1/images/generations";
const imageResponseSchema = z.object({
  data: z.array(z.object({ b64_json: z.string().min(1) })).min(1),
});

export class OpenAIImageGenerationError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "OpenAIImageGenerationError";
  }
}

export interface ExerciseImageGenerator {
  generate(prompt: string): Promise<GeneratedExerciseImage>;
}

export interface OpenAIImageGeneratorOptions {
  readonly apiKey?: string;
  readonly fetchImplementation?: typeof fetch;
  readonly sleep?: (milliseconds: number) => Promise<void>;
  readonly maxAttempts?: number;
  readonly timeoutMilliseconds?: number;
}

function retryAfterMilliseconds(response: Response, attempt: number): number {
  const value = response.headers.get("retry-after");
  if (value) {
    const seconds = Number(value);
    if (Number.isFinite(seconds)) return Math.min(15_000, Math.max(0, seconds * 1000));
    const date = Date.parse(value);
    if (Number.isFinite(date)) return Math.min(15_000, Math.max(0, date - Date.now()));
  }
  return Math.min(8_000, 500 * (2 ** (attempt - 1)));
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 409 || status === 429 || status >= 500;
}

async function responseError(response: Response): Promise<string> {
  try {
    const payload: unknown = await response.json();
    const parsed = z.object({ error: z.object({ message: z.string().optional() }).optional() }).safeParse(payload);
    return parsed.success && parsed.data.error?.message
      ? parsed.data.error.message.slice(0, 500)
      : `OpenAI image API returned HTTP ${response.status}.`;
  } catch {
    return `OpenAI image API returned HTTP ${response.status}.`;
  }
}

export class OpenAIImageGenerator implements ExerciseImageGenerator {
  private readonly apiKey: string | undefined;
  private readonly fetchImplementation: typeof fetch;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly maxAttempts: number;
  private readonly timeoutMilliseconds: number;

  constructor(options: OpenAIImageGeneratorOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.sleep = options.sleep ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
    this.maxAttempts = options.maxAttempts ?? 3;
    this.timeoutMilliseconds = options.timeoutMilliseconds ?? 150_000;
  }

  async generate(prompt: string): Promise<GeneratedExerciseImage> {
    if (!this.apiKey) throw new OpenAIImageGenerationError("OPENAI_API_KEY is not set in the environment.", null, false);

    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      let response: Response;
      try {
        response = await this.fetchImplementation(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: OPENAI_IMAGE_MODEL,
            prompt,
            n: 1,
            size: "1536x1024",
            quality: "medium",
            output_format: "png",
          }),
          signal: AbortSignal.timeout(this.timeoutMilliseconds),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Network request failed.";
        if (attempt < this.maxAttempts) {
          await this.sleep(Math.min(8_000, 500 * (2 ** (attempt - 1))));
          continue;
        }
        throw new OpenAIImageGenerationError(`OpenAI image request failed after ${attempt} attempts: ${message}`, null, true);
      }

      if (!response.ok) {
        const message = await responseError(response);
        const retryable = isRetryableStatus(response.status);
        if (retryable && attempt < this.maxAttempts) {
          await this.sleep(retryAfterMilliseconds(response, attempt));
          continue;
        }
        throw new OpenAIImageGenerationError(message, response.status, retryable);
      }

      const payload: unknown = await response.json();
      const parsed = imageResponseSchema.safeParse(payload);
      if (!parsed.success) {
        throw new OpenAIImageGenerationError("OpenAI image response did not contain a base64 PNG image.", response.status, false);
      }
      const bytes = Buffer.from(parsed.data.data[0].b64_json, "base64");
      const isPng = bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      if (!isPng) throw new OpenAIImageGenerationError("OpenAI image response was not a valid PNG file.", response.status, false);
      await recordAiProviderUsage({
        providerId: "openai",
        capability: "image",
        modelId: OPENAI_IMAGE_MODEL,
        imageCount: 1,
      }).catch(() => undefined);
      return {
        bytes,
        contentType: "image/png",
        width: bytes.readUInt32BE(16),
        height: bytes.readUInt32BE(20),
      };
    }

    throw new OpenAIImageGenerationError("OpenAI image request failed after all retry attempts.", null, true);
  }
}
