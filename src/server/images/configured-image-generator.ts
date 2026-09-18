import "server-only";

import {
  recordAiProviderUsage,
  resolveAiProviderChain,
} from "@/server/ai/ai-provider-settings-repository";
import {
  OpenAIImageGenerator,
  type ExerciseImageGenerator,
} from "./openai-image-generator";
import type { GeneratedExerciseImage } from "./exercise-image-types";

class FallbackExerciseImageGenerator implements ExerciseImageGenerator {
  async generate(prompt: string): Promise<GeneratedExerciseImage> {
    const configs = await resolveAiProviderChain("image");
    if (configs.length === 0) {
      throw new Error("Für Bildgenerierung ist kein aktiver AI-Provider verfügbar.");
    }
    const errors: Error[] = [];
    for (const config of configs) {
      try {
        const image = await new OpenAIImageGenerator({
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
          model: config.modelId,
        }).generate(prompt);
        await recordAiProviderUsage({
          providerInstanceId: config.instanceId,
          providerId: config.providerKind === "legacy" ? "legacy-openai" : config.providerKind,
          capability: "image",
          modelId: config.modelId,
          imageCount: 1,
        }).catch(() => undefined);
        return image;
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error(String(error)));
        await recordAiProviderUsage({
          providerInstanceId: config.instanceId,
          providerId: config.providerKind === "legacy" ? "legacy-openai" : config.providerKind,
          capability: "image",
          modelId: config.modelId,
          status: "failed",
        }).catch(() => undefined);
      }
    }
    throw new AggregateError(errors, "Alle zugewiesenen Bild-AI-Provider sind fehlgeschlagen.");
  }
}

export async function createConfiguredExerciseImageGenerator(): Promise<ExerciseImageGenerator | null> {
  const configs = await resolveAiProviderChain("image");
  return configs.length ? new FallbackExerciseImageGenerator() : null;
}


export async function hasConfiguredExerciseImageProvider(): Promise<boolean> {
  return (await resolveAiProviderChain("image")).length > 0;
}
