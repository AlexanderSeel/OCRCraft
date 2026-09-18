import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("AI provider secret storage", () => {
  it("encrypts and decrypts a provider key without storing plaintext", async () => {
    vi.stubEnv("OCRCRAFT_AI_SECRET_KEY", "test-master-secret-for-ocrcraft");
    const { decryptAiProviderSecret, encryptAiProviderSecret } = await import("./ai-provider-secret");
    const encrypted = encryptAiProviderSecret("sk-test-value");
    expect(encrypted).not.toContain("sk-test-value");
    expect(encrypted.startsWith("v1.")).toBe(true);
    expect(decryptAiProviderSecret(encrypted)).toBe("sk-test-value");
  });

  it("refuses database key storage when no master key is configured", async () => {
    vi.stubEnv("OCRCRAFT_AI_SECRET_KEY", "");
    const { encryptAiProviderSecret } = await import("./ai-provider-secret");
    expect(() => encryptAiProviderSecret("secret")).toThrow("OCRCRAFT_AI_SECRET_KEY");
  });
});
