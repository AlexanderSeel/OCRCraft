import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenAiCompatibleExerciseDraftProvider } from "./ai-exercise-draft-provider";

vi.mock("server-only", () => ({}));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AI exercise draft provider", () => {
  it("returns a validated bilingual pending-exercise proposal", async () => {
    const content = {
      nameDe: "Partner-Zug im Stand",
      nameEn: "Standing Partner Pull",
      summaryDe: "Eine kontrollierte Partnerübung für Zugkraft und Rumpfstabilität ohne Zusatzgewicht.",
      summaryEn: "A controlled partner drill for pulling strength and trunk stability without added load.",
      aliasesDe: ["Partnerzug"],
      aliasesEn: ["Partner Pull"],
      category: "strength",
      phase: "main",
      riskLevel: "low",
      minAge: 14,
      rationale: "Einfach skalierbar und für Vereinsgruppen gut beobachtbar.",
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      void input;
      void init;
      return new Response(JSON.stringify({
        choices: [{ message: { content: JSON.stringify(content) } }],
      }), { status: 200, headers: { "content-type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = new OpenAiCompatibleExerciseDraftProvider("http://localhost:11434/v1", "local-model");
    await expect(provider.generateExerciseDraft({ brief: "Create a low-risk partner strength drill for an OCR club." }))
      .resolves.toEqual(content);
  });

  it("rejects provider output outside the OCRCraft exercise taxonomy", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      void input;
      void init;
      return new Response(JSON.stringify({
        choices: [{
          message: {
            content: JSON.stringify({
              nameDe: "Testübung",
              nameEn: "Test Exercise",
              summaryDe: "Ausreichend lange deutsche Beschreibung für den Test.",
              summaryEn: "A sufficiently long English description for this test.",
              aliasesDe: [],
              aliasesEn: [],
              category: "medical-rehab",
              phase: "main",
              riskLevel: "low",
              minAge: null,
            }),
          },
        }],
      }), { status: 200, headers: { "content-type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = new OpenAiCompatibleExerciseDraftProvider("http://localhost:11434/v1", "local-model");
    await expect(provider.generateExerciseDraft({ brief: "Create a simple club exercise draft for trainer review." }))
      .rejects.toThrow();
  });
});
