import { describe, expect, it, vi } from "vitest";
import { ExerciseImageGenerationService } from "./exercise-image-generation-service";
import { buildExerciseImagePrompt } from "./exercise-image-prompt-builder";
import { chooseRandomExerciseFigurePresentation } from "./ocrcraft-exercise-illustration-v2";
import type {
  ExerciseImageGenerationContext,
  ExerciseImageGenerationRepositoryPort,
  GeneratedExerciseImage,
  StoredExerciseImage,
} from "./exercise-image-types";
import type { ExerciseImageGenerator } from "./openai-image-generator";
import type { ExerciseImageStorage } from "./exercise-image-storage";

const context: ExerciseImageGenerationContext = {
  exerciseId: "35b80ab9-27a4-444d-96e4-0e3297957426",
  seedKey: "easy-jog",
  category: "running",
  exerciseType: "endurance",
  difficulty: "beginner",
  riskLevel: "low",
  minimumAge: null,
  impactLevel: "low",
  coordinationComplexity: "simple",
  spaceRequirement: "running-route",
  supervision: "normal",
  suitableIndoors: true,
  suitableOutdoors: true,
  bodyRegions: [{ emphasis: "primary", labelDe: "Ganzkörper", labelEn: "Full Body" }],
  movementPatterns: [{ labelDe: "Laufen", labelEn: "Run" }],
  equipment: [],
  localized: {
    de: {
      name: "Lockeres Einlaufen", summary: "Lockeres, gleichmäßiges Joggen.", purpose: "Bereitet die Laufbelastung vor.",
      setup: "Markierte Runde.", startPosition: "Aufrechter Stand.", finishReset: "Ruhig ausgehen.", breathingCue: "Gleichmäßig atmen.",
      tempoCue: "Sprechtempo.", safetyNotes: "Bei Beschwerden gehen.", qualityCriteria: "Leise Schritte.", prerequisites: "Keine.",
      fallbackExercise: "Zügiges Gehen.", executionSteps: ["Gehe an.", "Trabe locker.", "Gehe aus."], coachingCues: ["Leise Schritte"],
      commonMistakes: [{ mistake: "Zu schnell.", correction: "Tempo senken." }], specializedGuidance: ["RPE 2 bis 3."],
    },
    en: {
      name: "Easy Jog", summary: "Easy steady jogging.", purpose: "Prepares for running effort.",
      setup: "Marked loop.", startPosition: "Stand upright.", finishReset: "Walk easily.", breathingCue: "Breathe evenly.",
      tempoCue: "Conversational pace.", safetyNotes: "Walk if uncomfortable.", qualityCriteria: "Quiet steps.", prerequisites: "None.",
      fallbackExercise: "Brisk walking.", executionSteps: ["Walk to start.", "Jog easily.", "Walk to finish."], coachingCues: ["Quiet steps"],
      commonMistakes: [{ mistake: "Going too fast.", correction: "Slow down." }], specializedGuidance: ["RPE 2 to 3."],
    },
  },
};

function makeRepository() {
  return {
    getContext: vi.fn(async () => context),
    createGeneratingRecord: vi.fn(async () => "6f42f47b-3442-49eb-a6f3-5bc4fb374d18"),
    markGenerated: vi.fn(async () => undefined),
    markFailed: vi.fn(async () => undefined),
  } satisfies ExerciseImageGenerationRepositoryPort;
}

function makeImage(): GeneratedExerciseImage {
  return { bytes: new Uint8Array([1, 2, 3]), contentType: "image/png", width: 1536, height: 1024 };
}

function makeStoredImage(): StoredExerciseImage {
  return {
    storageProvider: "filesystem",
    storageKey: `${context.exerciseId}/6f42f47b-3442-49eb-a6f3-5bc4fb374d18.png`,
    storageUri: "/generated/exercises/sample.png",
  };
}

describe("exercise image prompt and generation service", () => {
  it("builds a step-by-step single-athlete storyboard from bilingual structured exercise details", () => {
    const prompt = buildExerciseImagePrompt(context, "adult_woman");
    expect(prompt).toContain("friendly flat editorial artwork");
    expect(prompt).toContain("dark navy functional OCR sportswear");
    expect(prompt).toContain("restrained coral-red panels");
    expect(prompt).toContain("exactly one adult athlete identity: an adult woman");
    expect(prompt).toContain("exactly 3 sequential frames");
    expect(prompt).toContain("one frame for each numbered item in the structured execution steps");
    expect(prompt).toContain("1. Walk to start.");
    expect(prompt).toContain("2. Jog easily.");
    expect(prompt).toContain("3. Walk to finish.");
    expect(prompt).toContain("do not show a child or a second athlete");
    expect(prompt).toContain("Lockeres Einlaufen");
    expect(prompt).toContain("Easy Jog");
    expect(prompt).toContain("Walk to start.");
    expect(prompt).toContain("RPE 2 bis 3.");
    expect(prompt).toContain("Safety notes: Bei Beschwerden gehen.");
  });

  it("randomly chooses one adult presentation", () => {
    const random = vi.spyOn(Math, "random");
    random.mockReturnValueOnce(0.2).mockReturnValueOnce(0.8);
    expect(chooseRandomExerciseFigurePresentation()).toBe("adult_woman");
    expect(chooseRandomExerciseFigurePresentation()).toBe("adult_man");
    random.mockRestore();
  });

  it("dry run returns only the prompt and never invokes generation, storage, or metadata writes", async () => {
    const repository = makeRepository();
    const imageGenerator: ExerciseImageGenerator = { generate: vi.fn(async () => makeImage()) };
    const storage: ExerciseImageStorage = { provider: "filesystem", save: vi.fn(async () => makeStoredImage()), delete: vi.fn(async () => undefined) };
    const service = new ExerciseImageGenerationService(repository, imageGenerator, storage, () => "adult_woman");

    const result = await service.generate({ exerciseIdentifier: "easy-jog", dryRun: true });

    if (result.mode !== "dry-run") throw new Error("Expected dry-run output.");
    expect(result.mode).toBe("dry-run");
    expect(result).toMatchObject({ figurePresentation: "adult_woman", sequenceStepCount: 3 });
    expect(result.prompt).toContain("Easy Jog");
    expect(imageGenerator.generate).not.toHaveBeenCalled();
    expect(storage.save).not.toHaveBeenCalled();
    expect(repository.createGeneratingRecord).not.toHaveBeenCalled();
  });

  it("stores a successful generation as pending human review with source metadata", async () => {
    const repository = makeRepository();
    const imageGenerator: ExerciseImageGenerator = { generate: vi.fn(async () => makeImage()) };
    const storage: ExerciseImageStorage = { provider: "filesystem", save: vi.fn(async () => makeStoredImage()), delete: vi.fn(async () => undefined) };
    const service = new ExerciseImageGenerationService(repository, imageGenerator, storage, () => "adult_man");

    const result = await service.generate({ exerciseIdentifier: "easy-jog" });

    expect(result).toMatchObject({ mode: "generated", reviewStatus: "pending", storageUri: "/generated/exercises/sample.png", figurePresentation: "adult_man", sequenceStepCount: 3 });
    expect(repository.createGeneratingRecord).toHaveBeenCalledWith(expect.objectContaining({
      exerciseId: context.exerciseId,
      styleProfile: "ocrcraft-exercise-illustration-v2",
      illustrationFormat: "exercise_sequence",
      figurePresentation: "adult_man",
      sequenceStepCount: 3,
      storageProvider: "filesystem",
      generationPrompt: expect.stringContaining("Easy Jog"),
    }));
    expect(repository.markGenerated).toHaveBeenCalledWith(expect.objectContaining({
      assetId: "6f42f47b-3442-49eb-a6f3-5bc4fb374d18",
      contentType: "image/png",
      width: 1536,
      height: 1024,
      sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
    }));
  });

  it("records API failures and does not store a partial image", async () => {
    const repository = makeRepository();
    const imageGenerator: ExerciseImageGenerator = { generate: vi.fn(async () => { throw new Error("API unavailable"); }) };
    const storage: ExerciseImageStorage = { provider: "filesystem", save: vi.fn(async () => makeStoredImage()), delete: vi.fn(async () => undefined) };
    const service = new ExerciseImageGenerationService(repository, imageGenerator, storage, () => "adult_woman");

    await expect(service.generate({ exerciseIdentifier: "easy-jog" })).rejects.toThrow("API unavailable");

    expect(repository.markFailed).toHaveBeenCalledWith("6f42f47b-3442-49eb-a6f3-5bc4fb374d18", "API unavailable");
    expect(storage.save).not.toHaveBeenCalled();
  });
});
