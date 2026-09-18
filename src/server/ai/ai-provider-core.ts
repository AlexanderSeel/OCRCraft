export const AI_PROVIDER_KINDS = [
  "openai",
  "gemini",
  "anthropic",
  "copilot",
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
  "gemini",
  "copilot",
] as const;

export type AiProviderProtocol = (typeof AI_PROVIDER_PROTOCOLS)[number];
export type AiProviderAuthMode = "environment" | "encrypted_key" | "oauth";

export function aiCapabilityLabel(capability: AiCapability): string {
  if (capability === "training") return "Trainingsgenerierung";
  if (capability === "exercise_draft") return "Übungsentwürfe";
  return "Bildgenerierung";
}

export function providerKindLabel(kind: AiProviderKind): string {
  if (kind === "openai") return "OpenAI";
  if (kind === "gemini") return "Google Gemini";
  if (kind === "anthropic") return "Anthropic Claude";
  if (kind === "copilot") return "GitHub Copilot";
  return "OpenAI-kompatibel";
}

export function providerProtocol(kind: AiProviderKind): AiProviderProtocol {
  if (kind === "anthropic") return "anthropic";
  if (kind === "gemini") return "gemini";
  if (kind === "copilot") return "copilot";
  return "openai-compatible";
}

export function defaultProviderBaseUrl(kind: AiProviderKind): string | null {
  if (kind === "openai") return "https://api.openai.com/v1";
  if (kind === "gemini") return "https://generativelanguage.googleapis.com/v1beta";
  if (kind === "anthropic") return "https://api.anthropic.com/v1";
  return null;
}

export function defaultProviderKeyEnvironment(kind: AiProviderKind): string | null {
  if (kind === "openai") return "OPENAI_API_KEY";
  if (kind === "gemini") return "GEMINI_API_KEY";
  if (kind === "anthropic") return "ANTHROPIC_API_KEY";
  if (kind === "copilot") return "COPILOT_GITHUB_TOKEN";
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

export function providerSupportsOAuth(kind: AiProviderKind): boolean {
  return kind === "gemini" || kind === "copilot";
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

export type AiProviderRoutingState =
  | "ready"
  | "inactive"
  | "unassigned"
  | "auth_missing"
  | "model_missing"
  | "limit_reached";

export function evaluateAiProviderRoutingState(input: {
  readonly enabled: boolean;
  readonly providerKind: AiProviderKind;
  readonly authMode: AiProviderAuthMode;
  readonly environmentKeyAvailable: boolean;
  readonly hasStoredApiKey: boolean;
  readonly hasOAuthCredential: boolean;
  readonly capabilities: readonly AiCapability[];
  readonly textModelId: string | null;
  readonly imageModelId: string | null;
  readonly requestLimitReached: boolean;
  readonly textTokenLimitReached: boolean;
}): AiProviderRoutingState {
  if (!input.enabled) return "inactive";
  if (input.capabilities.length === 0) return "unassigned";
  if (input.requestLimitReached || input.textTokenLimitReached) return "limit_reached";

  const authOptional = input.providerKind === "openai-compatible";
  const authAvailable = input.authMode === "oauth"
    ? input.hasOAuthCredential
    : input.authMode === "encrypted_key"
      ? input.hasStoredApiKey || authOptional
      : input.environmentKeyAvailable || authOptional;
  if (!authAvailable) return "auth_missing";

  const needsText = input.capabilities.some((capability) => capability !== "image");
  const needsImage = input.capabilities.includes("image");
  if ((needsText && !input.textModelId?.trim()) || (needsImage && !input.imageModelId?.trim())) {
    return "model_missing";
  }

  return "ready";
}

export function aiProviderRoutingStateLabel(state: AiProviderRoutingState): string {
  if (state === "ready") return "Bereit";
  if (state === "inactive") return "Inaktiv";
  if (state === "unassigned") return "Nicht zugewiesen";
  if (state === "auth_missing") return "Zugang fehlt";
  if (state === "model_missing") return "Modell fehlt";
  return "Limit erreicht";
}
