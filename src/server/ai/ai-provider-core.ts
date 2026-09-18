export const AI_PROVIDER_KINDS = [
  "openai",
  "gemini",
  "anthropic",
  "openai-compatible",
] as const;

export type AiProviderKind = (typeof AI_PROVIDER_KINDS)[number];

export const AI_CAPABILITIES = [
  "training",
  "exercise_draft",
  "image",
] as const;

export type AiCapability = (typeof AI_CAPABILITIES)[number];

export const AI_PROVIDER_PROTOCOLS = [
  "openai-compatible",
  "anthropic",
] as const;

export type AiProviderProtocol = (typeof AI_PROVIDER_PROTOCOLS)[number];

export function aiCapabilityLabel(capability: AiCapability): string {
  if (capability === "training") return "Trainingsgenerierung";
  if (capability === "exercise_draft") return "Übungsentwürfe";
  return "Bildgenerierung";
}

export function providerKindLabel(kind: AiProviderKind): string {
  if (kind === "openai") return "OpenAI";
  if (kind === "gemini") return "Google Gemini";
  if (kind === "anthropic") return "Anthropic Claude";
  return "OpenAI-kompatibel";
}

export function providerProtocol(kind: AiProviderKind): AiProviderProtocol {
  return kind === "anthropic" ? "anthropic" : "openai-compatible";
}

export function defaultProviderBaseUrl(kind: AiProviderKind): string | null {
  if (kind === "openai") return "https://api.openai.com/v1";
  if (kind === "gemini") return "https://generativelanguage.googleapis.com/v1beta/openai";
  if (kind === "anthropic") return "https://api.anthropic.com/v1";
  return null;
}

export function defaultProviderKeyEnvironment(kind: AiProviderKind): string | null {
  if (kind === "openai") return "OPENAI_API_KEY";
  if (kind === "gemini") return "GEMINI_API_KEY";
  if (kind === "anthropic") return "ANTHROPIC_API_KEY";
  return "OCRCRAFT_AI_API_KEY";
}

export function defaultImageModel(kind: AiProviderKind): string | null {
  return kind === "openai" ? "gpt-image-2" : null;
}

export function providerSupportsCapability(
  kind: AiProviderKind,
  capability: AiCapability,
): boolean {
  if (capability !== "image") return true;
  return kind === "openai" || kind === "openai-compatible";
}

export function aiPriorityLabel(priority: number): string {
  return "P" + String(Math.max(1, Math.trunc(priority)));
}

export function evaluateAiUsageLimits(input: {
  readonly requests: number;
  readonly totalTokens: number;
  readonly monthlyRequestLimit: number | null;
  readonly monthlyTextTokenLimit: number | null;
}): {
  readonly requestLimitReached: boolean;
  readonly textTokenLimitReached: boolean;
} {
  return {
    requestLimitReached: input.monthlyRequestLimit != null
      && input.requests >= input.monthlyRequestLimit,
    textTokenLimitReached: input.monthlyTextTokenLimit != null
      && input.totalTokens >= input.monthlyTextTokenLimit,
  };
}
