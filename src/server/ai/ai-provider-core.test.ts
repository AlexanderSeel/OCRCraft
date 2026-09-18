import { describe, expect, it } from "vitest";
import {
  defaultProviderBaseUrl,
  evaluateAiUsageLimits,
  providerSupportsCapability,
} from "./ai-provider-core";

describe("AI provider routing core", () => {
  it("provides standard provider URLs", () => {
    expect(defaultProviderBaseUrl("openai")).toBe("https://api.openai.com/v1");
    expect(defaultProviderBaseUrl("gemini")).toContain("generativelanguage.googleapis.com");
    expect(defaultProviderBaseUrl("openai-compatible")).toBeNull();
  });

  it("limits image routing to implemented image adapters", () => {
    expect(providerSupportsCapability("openai", "image")).toBe(true);
    expect(providerSupportsCapability("openai-compatible", "image")).toBe(true);
    expect(providerSupportsCapability("gemini", "image")).toBe(false);
    expect(providerSupportsCapability("anthropic", "image")).toBe(false);
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
