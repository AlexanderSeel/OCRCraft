import { describe, expect, it } from "vitest";
import {
  defaultProviderBaseUrl,
  evaluateAiProviderRoutingState,
  evaluateAiUsageLimits,
  providerProtocol,
  providerSupportsCapability,
  providerSupportsOAuth,
} from "./ai-provider-core";

describe("AI provider routing core", () => {
  it("provides standard provider URLs and protocols", () => {
    expect(defaultProviderBaseUrl("openai")).toBe("https://api.openai.com/v1");
    expect(defaultProviderBaseUrl("gemini")).toBe("https://generativelanguage.googleapis.com/v1beta");
    expect(defaultProviderBaseUrl("copilot")).toBeNull();
    expect(providerProtocol("gemini")).toBe("gemini");
    expect(providerProtocol("copilot")).toBe("copilot");
  });

  it("limits image routing to implemented image adapters", () => {
    expect(providerSupportsCapability("openai", "image")).toBe(true);
    expect(providerSupportsCapability("openai-compatible", "image")).toBe(true);
    expect(providerSupportsCapability("gemini", "image")).toBe(false);
    expect(providerSupportsCapability("anthropic", "image")).toBe(false);
    expect(providerSupportsCapability("copilot", "image")).toBe(false);
  });

  it("only exposes OAuth where the provider has a supported user auth flow", () => {
    expect(providerSupportsOAuth("gemini")).toBe(true);
    expect(providerSupportsOAuth("copilot")).toBe(true);
    expect(providerSupportsOAuth("openai")).toBe(false);
    expect(providerSupportsOAuth("anthropic")).toBe(false);
  });

  it("reports why a provider is not route-ready", () => {
    const base = {
      enabled: true,
      providerKind: "openai" as const,
      authMode: "environment" as const,
      environmentKeyAvailable: true,
      hasStoredApiKey: false,
      hasOAuthCredential: false,
      capabilities: ["training"] as const,
      textModelId: "gpt-5.6-sol",
      imageModelId: null,
      requestLimitReached: false,
      textTokenLimitReached: false,
    };
    expect(evaluateAiProviderRoutingState(base)).toBe("ready");
    expect(evaluateAiProviderRoutingState({ ...base, environmentKeyAvailable: false })).toBe("auth_missing");
    expect(evaluateAiProviderRoutingState({ ...base, requestLimitReached: true })).toBe("limit_reached");
    expect(evaluateAiProviderRoutingState({ ...base, textModelId: null })).toBe("model_missing");
    expect(evaluateAiProviderRoutingState({ ...base, capabilities: [] })).toBe("unassigned");
    expect(evaluateAiProviderRoutingState({ ...base, enabled: false })).toBe("inactive");
  });

  it("allows unauthenticated local OpenAI-compatible endpoints", () => {
    expect(evaluateAiProviderRoutingState({
      enabled: true,
      providerKind: "openai-compatible",
      authMode: "environment",
      environmentKeyAvailable: false,
      hasStoredApiKey: false,
      hasOAuthCredential: false,
      capabilities: ["exercise_draft"],
      textModelId: "local-model",
      imageModelId: null,
      requestLimitReached: false,
      textTokenLimitReached: false,
    })).toBe("ready");
  });

  it("treats text token budgets as token counts rather than currency", () => {
    expect(evaluateAiUsageLimits({
      requests: 9,
      totalTokens: 1000,
      monthlyRequestLimit: 10,
      monthlyTextTokenLimit: 1000,
    })).toEqual({
      requestLimitReached: false,
      textTokenLimitReached: true,
    });
  });
});
