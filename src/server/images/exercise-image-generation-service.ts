import { createHash } from "node:crypto";
import type { ExerciseImageGenerator } from "./openai-image-generator";
import { buildExerciseImagePrompt } from "./exercise-image-prompt-builder";
import type { ExerciseImageStorage } from "./exercise-image-storage";
import type { ExerciseImageGenerationRepositoryPort } from "./exercise-image-types";
import { ocrcraftExerciseIllustrationV1 } from "./ocrcraft-exercise-illustration-v1";

export interface GenerateExerciseImageInput {
  readonly exerciseIdentifier: string;
  readonly dryRun?: boolean;
}

export interface ExerciseImagePromptPreview {
  readonly mode: "dry-run";
  readonly exerciseId: string;
  readonly exerciseName: string;
  readonly styleProfile: string;
  readonly prompt: string;
}

export interface ExerciseImageGenerationResult {
  readonly mode: "generated";
  readonly assetId: string;
  readonly exerciseId: string;
  readonly exerciseName: string;
  readonly storageUri: string;
  readonly reviewStatus: "pending";
  readonly width: number;
  readonly height: number;
}

export class ExerciseImageGenerationService {
  constructor(
    private readonly repository: ExerciseImageGenerationRepositoryPort,
    private readonly imageGenerator: ExerciseImageGenerator,
    private readonly storage: ExerciseImageStorage,
  ) {}

  async generate(input: GenerateExerciseImageInput): Promise<ExerciseImagePromptPreview | ExerciseImageGenerationResult> {
    const context = await this.repository.getContext(input.exerciseIdentifier);
    const prompt = buildExerciseImagePrompt(context);
    const exerciseName = context.localized.de.name;

    if (input.dryRun) {
      return {
        mode: "dry-run",
        exerciseId: context.exerciseId,
        exerciseName,
        styleProfile: ocrcraftExerciseIllustrationV1.id,
        prompt,
      };
    }

    const assetId = await this.repository.createGeneratingRecord({
      exerciseId: context.exerciseId,
      styleProfile: ocrcraftExerciseIllustrationV1.id,
      generationPrompt: prompt,
      storageProvider: this.storage.provider,
    });
    let storageKey: string | undefined;

    try {
      const generatedImage = await this.imageGenerator.generate(prompt);
      const storedImage = await this.storage.save({
        exerciseId: context.exerciseId,
        assetId,
        bytes: generatedImage.bytes,
        contentType: generatedImage.contentType,
      });
      storageKey = storedImage.storageKey;
      const sha256 = createHash("sha256").update(generatedImage.bytes).digest("hex");
      await this.repository.markGenerated({
        assetId,
        storedImage,
        contentType: generatedImage.contentType,
        sha256,
        width: generatedImage.width,
        height: generatedImage.height,
      });

      return {
        mode: "generated",
        assetId,
        exerciseId: context.exerciseId,
        exerciseName,
        storageUri: storedImage.storageUri,
        reviewStatus: "pending",
        width: generatedImage.width,
        height: generatedImage.height,
      };
    } catch (error) {
      const cleanupErrors: unknown[] = [];
      if (storageKey) {
        try {
          await this.storage.delete(storageKey);
        } catch (cleanupError) {
          cleanupErrors.push(cleanupError);
        }
      }
      const failureMessage = error instanceof Error ? error.message : String(error);
      try {
        await this.repository.markFailed(assetId, failureMessage);
      } catch (recordError) {
        cleanupErrors.push(recordError);
      }
      if (cleanupErrors.length > 0) {
        throw new AggregateError([error, ...cleanupErrors], "Exercise image generation failed and cleanup was incomplete.");
      }
      throw error;
    }
  }
}
