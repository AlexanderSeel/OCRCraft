import "server-only";

import { ExerciseImageGenerationRepository } from "@/server/images/exercise-image-generation-repository";
import { ExerciseImageGenerationService } from "@/server/images/exercise-image-generation-service";
import { createExerciseImageStorageFromEnvironment } from "@/server/images/exercise-image-storage";
import { OpenAIImageGenerator } from "@/server/images/openai-image-generator";
import {
  claimNextMediaGenerationJob,
  failQueuedMediaGenerationJobs,
  markMediaGenerationJobFailed,
  markMediaGenerationJobSucceeded,
  requeueStaleMediaGenerationJobs,
} from "./media-generation-job-repository";

let activeWorker: Promise<void> | undefined;

function configuredConcurrency(): number {
  const parsed = Number(process.env.OCRCRAFT_IMAGE_BATCH_CONCURRENCY ?? "2");
  if (!Number.isFinite(parsed)) return 2;
  return Math.max(1, Math.min(4, Math.trunc(parsed)));
}

async function processQueue(): Promise<void> {
  await requeueStaleMediaGenerationJobs();

  if (!process.env.OPENAI_API_KEY) {
    await failQueuedMediaGenerationJobs("OPENAI_API_KEY is not configured for background image generation.");
    return;
  }

  let storage;
  try {
    storage = createExerciseImageStorageFromEnvironment();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await failQueuedMediaGenerationJobs(`Image storage configuration error: ${message}`);
    return;
  }

  const service = new ExerciseImageGenerationService(
    new ExerciseImageGenerationRepository(),
    new OpenAIImageGenerator(),
    storage,
  );

  try {
    const worker = async (): Promise<void> => {
      while (true) {
        const job = await claimNextMediaGenerationJob();
        if (!job) return;

        try {
          const result = await service.generate({ exerciseIdentifier: job.exerciseId });
          if (result.mode !== "generated") {
            throw new Error("Background generation did not return a generated image.");
          }
          await markMediaGenerationJobSucceeded(job.id, result.assetId);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          await markMediaGenerationJobFailed(job.id, message);
        }
      }
    };

    await Promise.all(
      Array.from({ length: configuredConcurrency() }, () => worker()),
    );
  } finally {
    storage.close?.();
  }
}

export function runExerciseImageGenerationQueue(): Promise<void> {
  activeWorker ??= processQueue().finally(() => {
    activeWorker = undefined;
  });
  return activeWorker;
}
