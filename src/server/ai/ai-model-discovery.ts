import "server-only";

import { z } from "zod";
import type { AiProviderAuthMode, AiProviderKind } from "./ai-provider-core";

import { getKnownAiModels, mergeAiModelOptions, type AiModelOption } from "./ai-model-catalog";

export type { AiModelOption } from "./ai-model-catalog";

export interface AiModelDiscoveryResult {
  readonly models: readonly AiModelOption[];
  readonly live: boolean;
  readonly warning: string | null;
}

function openAiModelOption(id: string): AiModelOption {
  const lower = id.toLowerCase();
  const image = lower.includes("image") || lower.includes("dall-e");
  const nonText = image || lower.includes("embedding") || lower.includes("tts") || lower.includes("whisper");
  return {
    id,
    label: id,
    supportsText: !nonText,
    supportsImage: image,
    source: "live",
  };
}

async function discoverOpenAiCompatible(
  baseUrl: string,
  apiKey?: string,
): Promise<readonly AiModelOption[]> {
  const response = await fetch(baseUrl.replace(/\/$/, "") + "/models", {
    headers: apiKey ? { authorization: "Bearer " + apiKey } : undefined,
    signal: AbortSignal.timeout(12_000),
    redirect: "error",
  });
  if (!response.ok) throw new Error("Model-Endpunkt antwortete mit HTTP " + String(response.status) + ".");
  const payload = z.object({
    data: z.array(z.object({ id: z.string().min(1) })),
  }).parse(await response.json());
  return payload.data.map((model) => openAiModelOption(model.id));
}

async function discoverGemini(input: {
  readonly baseUrl: string;
  readonly apiKey?: string;
  readonly authMode: AiProviderAuthMode;
  readonly googleProjectId: string | null;
}): Promise<readonly AiModelOption[]> {
  if (!input.apiKey) throw new Error("Für den Live-Abruf fehlt ein Gemini API-Key oder OAuth-Token.");
  const headers: Record<string, string> = {};
  if (input.authMode === "oauth") {
    if (!input.googleProjectId) throw new Error("OCRCRAFT_GOOGLE_PROJECT_ID fehlt für Gemini OAuth.");
    headers.authorization = "Bearer " + input.apiKey;
    headers["x-goog-user-project"] = input.googleProjectId;
  } else {
    headers["x-goog-api-key"] = input.apiKey;
  }
  const response = await fetch(input.baseUrl.replace(/\/$/, "") + "/models?pageSize=1000", {
    headers,
    signal: AbortSignal.timeout(12_000),
    redirect: "error",
  });
  if (!response.ok) throw new Error("Gemini Models API antwortete mit HTTP " + String(response.status) + ".");
  const payload = z.object({
    models: z.array(z.object({
      name: z.string().min(1),
      displayName: z.string().optional(),
      supportedGenerationMethods: z.array(z.string()).optional(),
    })).default([]),
  }).parse(await response.json());
  return payload.models.map((model) => {
    const id = model.name.replace(/^models\//, "");
    const methods = model.supportedGenerationMethods ?? [];
    const image = /image|imagen/i.test(id + " " + (model.displayName ?? ""));
    return {
      id,
      label: model.displayName || id,
      supportsText: methods.includes("generateContent") && !image,
      supportsImage: image,
      source: "live" as const,
    };
  });
}

async function discoverAnthropic(
  baseUrl: string,
  apiKey?: string,
): Promise<readonly AiModelOption[]> {
  if (!apiKey) throw new Error("Für den Live-Abruf fehlt ANTHROPIC_API_KEY bzw. ein gespeicherter Key.");
  const response = await fetch(baseUrl.replace(/\/$/, "") + "/models?limit=1000", {
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    signal: AbortSignal.timeout(12_000),
    redirect: "error",
  });
  if (!response.ok) throw new Error("Anthropic Models API antwortete mit HTTP " + String(response.status) + ".");
  const payload = z.object({
    data: z.array(z.object({
      id: z.string().min(1),
      display_name: z.string().optional(),
    })).default([]),
  }).parse(await response.json());
  return payload.data.map((model) => ({
    id: model.id,
    label: model.display_name || model.id,
    supportsText: true,
    supportsImage: false,
    source: "live" as const,
  }));
}

async function discoverCopilot(apiKey?: string): Promise<readonly AiModelOption[]> {
  if (!apiKey) throw new Error("Für den Copilot-Modellabruf fehlt ein GitHub User Access Token.");
  const { CopilotClient } = await import("@github/copilot-sdk");
  const client = new CopilotClient({
    gitHubToken: apiKey,
    useLoggedInUser: false,
    mode: "empty",
    logLevel: "error",
  });
  try {
    await client.start();
    const models = await client.listModels();
    return models
      .filter((model) => model.policy?.state !== "disabled")
      .map((model) => ({
        id: model.id,
        label: model.name || model.id,
        supportsText: true,
        supportsImage: false,
        source: "live" as const,
      }));
  } finally {
    await client.stop().catch(() => []);
  }
}

export async function discoverAiModels(input: {
  readonly providerKind: AiProviderKind;
  readonly baseUrl: string | null;
  readonly apiKey?: string;
  readonly authMode: AiProviderAuthMode;
  readonly googleProjectId: string | null;
}): Promise<AiModelDiscoveryResult> {
  const fallback = getKnownAiModels(input.providerKind);
  try {
    let live: readonly AiModelOption[];
    if (input.providerKind === "gemini") {
      live = await discoverGemini({
        baseUrl: input.baseUrl || "https://generativelanguage.googleapis.com/v1beta",
        apiKey: input.apiKey,
        authMode: input.authMode,
        googleProjectId: input.googleProjectId,
      });
    } else if (input.providerKind === "anthropic") {
      live = await discoverAnthropic(input.baseUrl || "https://api.anthropic.com/v1", input.apiKey);
    } else if (input.providerKind === "copilot") {
      live = await discoverCopilot(input.apiKey);
    } else {
      if (!input.baseUrl) throw new Error("Base URL fehlt.");
      live = await discoverOpenAiCompatible(input.baseUrl, input.apiKey);
    }
    return {
      models: mergeAiModelOptions([...live, ...fallback]),
      live: true,
      warning: null,
    };
  } catch (error) {
    return {
      models: mergeAiModelOptions(fallback),
      live: false,
      warning: error instanceof Error ? error.message : "Modelle konnten nicht live geladen werden.",
    };
  }
}
