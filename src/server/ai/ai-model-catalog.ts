import type { AiProviderKind } from "./ai-provider-core";

export interface AiModelOption {
  readonly id: string;
  readonly label: string;
  readonly supportsText: boolean;
  readonly supportsImage: boolean;
  readonly source: "live" | "known";
}

const knownModels: Readonly<Record<AiProviderKind, readonly AiModelOption[]>> = {
  openai: [
    { id: "gpt-5.6-sol", label: "GPT-5.6 Sol", supportsText: true, supportsImage: false, source: "known" },
    { id: "gpt-5.6-terra", label: "GPT-5.6 Terra", supportsText: true, supportsImage: false, source: "known" },
    { id: "gpt-5.6-luna", label: "GPT-5.6 Luna", supportsText: true, supportsImage: false, source: "known" },
    { id: "gpt-image-2", label: "GPT Image 2", supportsText: false, supportsImage: true, source: "known" },
  ],
  gemini: [
    { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash", supportsText: true, supportsImage: false, source: "known" },
    { id: "gemini-3.7-flash", label: "Gemini 3.7 Flash", supportsText: true, supportsImage: false, source: "known" },
    { id: "gemini-3.6-flash", label: "Gemini 3.6 Flash", supportsText: true, supportsImage: false, source: "known" },
    { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash", supportsText: true, supportsImage: false, source: "known" },
    { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite", supportsText: true, supportsImage: false, source: "known" },
    { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash-Lite", supportsText: true, supportsImage: false, source: "known" },
    { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro Preview", supportsText: true, supportsImage: false, source: "known" },
    { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", supportsText: true, supportsImage: false, source: "known" },
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", supportsText: true, supportsImage: false, source: "known" },
  ],
  anthropic: [
    { id: "claude-fable-5-1", label: "Claude Fable 5.1", supportsText: true, supportsImage: false, source: "known" },
    { id: "claude-opus-5", label: "Claude Opus 5", supportsText: true, supportsImage: false, source: "known" },
    { id: "claude-sonnet-5", label: "Claude Sonnet 5", supportsText: true, supportsImage: false, source: "known" },
    { id: "claude-opus-4-8", label: "Claude Opus 4.8", supportsText: true, supportsImage: false, source: "known" },
    { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", supportsText: true, supportsImage: false, source: "known" },
    { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5", supportsText: true, supportsImage: false, source: "known" },
  ],
  copilot: [],
  "openai-compatible": [],
};

export function getKnownAiModels(providerKind: AiProviderKind): readonly AiModelOption[] {
  return knownModels[providerKind];
}

export function mergeAiModelOptions(models: readonly AiModelOption[]): readonly AiModelOption[] {
  const byId = new Map<string, AiModelOption>();
  for (const model of models) {
    if (!model.id.trim()) continue;
    const current = byId.get(model.id);
    byId.set(model.id, current ? {
      ...current,
      supportsText: current.supportsText || model.supportsText,
      supportsImage: current.supportsImage || model.supportsImage,
      source: current.source === "live" || model.source === "live" ? "live" : "known",
    } : model);
  }
  return [...byId.values()].sort((a, b) => a.label.localeCompare(b.label));
}
