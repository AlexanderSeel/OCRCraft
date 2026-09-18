import { describe, expect, it } from "vitest";
import { getKnownAiModels, mergeAiModelOptions } from "./ai-model-catalog";

describe("AI model catalog", () => {
  it("provides immediately selectable known models", () => {
    expect(getKnownAiModels("openai").some((model) => model.id === "gpt-5.6-sol")).toBe(true);
    expect(getKnownAiModels("gemini").some((model) => model.id === "gemini-3.8-flash")).toBe(true);
    expect(getKnownAiModels("anthropic").some((model) => model.id === "claude-fable-5-1")).toBe(true);
    expect(getKnownAiModels("copilot")).toEqual([]);
  });

  it("prefers live metadata while preserving known capability flags", () => {
    expect(mergeAiModelOptions([
      { id: "model-a", label: "Known A", supportsText: true, supportsImage: false, source: "known" },
      { id: "model-a", label: "Live A", supportsText: false, supportsImage: true, source: "live" },
    ])).toEqual([
      { id: "model-a", label: "Known A", supportsText: true, supportsImage: true, source: "live" },
    ]);
  });
});
