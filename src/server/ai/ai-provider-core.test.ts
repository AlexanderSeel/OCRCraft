import { describe, expect, it } from "vitest";
import {
  defaultProviderBaseUrl,
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
