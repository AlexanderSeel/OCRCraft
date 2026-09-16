import { loadEnvConfig } from "@next/env";
import { ensureDatabaseReady } from "../src/server/db/database-ready";
import { ExerciseImageGenerationRepository } from "../src/server/images/exercise-image-generation-repository";
import { ExerciseImageGenerationService } from "../src/server/images/exercise-image-generation-service";
import { OpenAIImageGenerator } from "../src/server/images/openai-image-generator";
import {
  createExerciseImageStorageFromEnvironment,
  type ExerciseImageStorage,
} from "../src/server/images/exercise-image-storage";
import type { ExerciseImageGenerator as ExerciseImageGeneratorPort } from "../src/server/images/openai-image-generator";

interface CommandOptions {
  readonly exerciseIdentifier: string;
  readonly dryRun: boolean;
}

function parseArguments(args: readonly string[]): CommandOptions | "help" {
  let exerciseIdentifier: string | undefined;
  let dryRun = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--help" || argument === "-h") return "help";
    if (argument === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (argument === "--exercise") {
      exerciseIdentifier = args[index + 1];
      if (!exerciseIdentifier || exerciseIdentifier.startsWith("--")) {
        throw new Error("--exercise requires an exercise UUID or seed key.");
      }
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }

  if (!exerciseIdentifier) throw new Error("Provide one exercise with --exercise <seed-key-or-uuid>.");
  return { exerciseIdentifier, dryRun };
}

function printHelp(): void {
  process.stdout.write([
    "Generate one OCRCraft exercise illustration.",
    "",
    "Usage:",
    "  npm run exercise:image -- --exercise <seed-key-or-uuid> --dry-run",
    "  npm run exercise:image -- --exercise <seed-key-or-uuid>",
    "",
    "Dry-run reads structured exercise data and prints the prompt without calling OpenAI or writing an image.",
  ].join("\n"));
}

const dryRunImageGenerator: ExerciseImageGeneratorPort = {
  async generate() {
    throw new Error("Image generation cannot run in dry-run mode.");
  },
};

const dryRunStorage: ExerciseImageStorage = {
  provider: "filesystem",
  async save() {
    throw new Error("Image storage cannot run in dry-run mode.");
  },
  async delete() {
    throw new Error("Image storage cannot run in dry-run mode.");
  },
};

async function main(): Promise<void> {
  loadEnvConfig(process.cwd());
  const options = parseArguments(process.argv.slice(2));
  if (options === "help") {
    printHelp();
    return;
  }

  await ensureDatabaseReady();
  const repository = new ExerciseImageGenerationRepository();

  if (options.dryRun) {
    const service = new ExerciseImageGenerationService(repository, dryRunImageGenerator, dryRunStorage);
    const result = await service.generate({ exerciseIdentifier: options.exerciseIdentifier, dryRun: true });
    if (result.mode !== "dry-run") throw new Error("The dry-run command unexpectedly generated an image.");
    process.stdout.write(result.prompt);
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set. Set it in the environment before generating an image.");
  }

  const storage = createExerciseImageStorageFromEnvironment();
  try {
    const service = new ExerciseImageGenerationService(repository, new OpenAIImageGenerator(), storage);
    const result = await service.generate({ exerciseIdentifier: options.exerciseIdentifier });
    if (result.mode !== "generated") throw new Error("Image generation did not return a generated asset.");
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } finally {
    storage.close?.();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Exercise image generation failed: ${message}\n`);
  process.exitCode = 1;
});
