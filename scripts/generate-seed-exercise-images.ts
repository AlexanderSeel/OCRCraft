import { loadEnvConfig } from "@next/env";
import {
  codexImageP1BatchSeedKeys,
  isCodexImageP1BatchId,
} from "../src/server/images/codex-image-p1-batches";
import { ExerciseImageGenerationRepository } from "../src/server/images/exercise-image-generation-repository";
import { ExerciseImageGenerationService } from "../src/server/images/exercise-image-generation-service";
import { OpenAIImageGenerator } from "../src/server/images/openai-image-generator";
import { createExerciseImageStorageFromEnvironment } from "../src/server/images/exercise-image-storage";

async function main(): Promise<void> {
  loadEnvConfig(process.cwd());
  const args = process.argv.slice(2);
  const batchArgument = args.find((value) => value.startsWith("--batch="))?.slice("--batch=".length).trim() ?? "";
  const allSeeds = args.includes("--all-seeds");
  if (!allSeeds && !batchArgument) {
    throw new Error("Pass --all-seeds or --batch=<single-subject|ocrfra-obstacles|games-partner>.");
  }
  if (batchArgument && !isCodexImageP1BatchId(batchArgument)) {
    throw new Error(`Unknown image batch: ${batchArgument}`);
  }
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set in the environment or .env file.");
  }

  const repository = new ExerciseImageGenerationRepository();
  const abandonedCount = await repository.markAbandonedGenerationsFailed();
  if (abandonedCount > 0) {
    process.stdout.write(`Marked ${abandonedCount} interrupted image jobs failed so they can be retried.\n`);
  }
  const allMissingExercises = await repository.listSeedExercisesMissingImage();
  const requestedSeedKeys = batchArgument ? new Set(codexImageP1BatchSeedKeys(batchArgument)) : null;
  const exercises = requestedSeedKeys
    ? allMissingExercises.filter((exercise) => requestedSeedKeys.has(exercise.seedKey))
    : allMissingExercises;

  if (exercises.length === 0) {
    process.stdout.write(batchArgument
      ? `No remaining image candidates in batch ${batchArgument}.\n`
      : "All active seed exercises already have generated illustrations.\n");
    return;
  }

  const storage = createExerciseImageStorageFromEnvironment();
  const service = new ExerciseImageGenerationService(repository, new OpenAIImageGenerator(), storage);
  const failures: { seedKey: string; message: string }[] = [];
  let nextIndex = 0;

  try {
    const concurrency = batchArgument ? 1 : 8;
    process.stdout.write(
      `Generating illustrations for ${exercises.length} active seed exercises (${concurrency} request${concurrency === 1 ? "" : "s"} at a time). Existing generated assets are preserved; every new asset remains pending for biomechanics/text review.\n`,
    );
    const worker = async (): Promise<void> => {
      while (nextIndex < exercises.length) {
        const index = nextIndex;
        nextIndex += 1;
        const exercise = exercises[index];
        try {
          const result = await service.generate({ exerciseIdentifier: exercise.exerciseId });
          if (result.mode !== "generated") throw new Error("Generation did not return a stored image.");
          process.stdout.write(`[${index + 1}/${exercises.length}] ${exercise.seedKey}: generated (${result.assetId})\n`);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          failures.push({ seedKey: exercise.seedKey, message });
          process.stderr.write(`[${index + 1}/${exercises.length}] ${exercise.seedKey}: failed: ${message}\n`);
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, exercises.length) }, () => worker()));
  } finally {
    storage.close?.();
  }

  if (failures.length > 0) {
    process.stderr.write(`${failures.length} seed illustrations failed; rerun this command to retry them.\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write(`Completed ${exercises.length} seed exercise illustrations.\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Seed exercise image generation failed: ${message}\n`);
  process.exitCode = 1;
});
