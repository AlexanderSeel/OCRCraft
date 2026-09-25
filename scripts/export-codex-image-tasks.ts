import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildExerciseImagePrompt } from "@/server/images/exercise-image-prompt-builder";
import { ExerciseImageGenerationRepository } from "@/server/images/exercise-image-generation-repository";
import {
  buildCodexImageOutputFilename,
  chooseCodexImageFigurePresentation,
} from "@/server/images/codex-image-task-core";
import { listMediaGenerationCandidates } from "@/server/media/media-catalog-repository";
import { getMediaGenerationCandidateReason } from "@/server/media/media-rights-core";

interface ExportArgs {
  readonly output: string;
  readonly query: string;
  readonly limit: number;
}

function parseArgs(argv: readonly string[]): ExportArgs {
  const option = (name: string) => argv.find((value) => value.startsWith(`--${name}=`))?.slice(name.length + 3);
  const parsedLimit = Number(option("limit") ?? "1000");
  return {
    output: option("output") || path.join("artifacts", "codex-image-tasks.json"),
    query: option("query")?.trim() ?? "",
    limit: Number.isFinite(parsedLimit) ? Math.max(1, Math.min(1000, Math.trunc(parsedLimit))) : 1000,
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const candidates = await listMediaGenerationCandidates(args.query, args.limit);
  const exportable = candidates.filter((candidate) => candidate.activeJobCount === 0);
  const repository = new ExerciseImageGenerationRepository();

  const tasks = [];
  let promptReady = 0;

  for (const [zeroBasedIndex, candidate] of exportable.entries()) {
    const identifier = candidate.seedKey ?? candidate.exerciseId;
    const figurePresentation = chooseCodexImageFigurePresentation(identifier);
    const reason = getMediaGenerationCandidateReason(candidate);
    let prompt: string | null = null;
    let promptError: string | null = null;

    try {
      const context = await repository.getContext(identifier);
      prompt = buildExerciseImagePrompt(context, figurePresentation);
      promptReady += 1;
    } catch (error) {
      promptError = error instanceof Error ? error.message : String(error);
    }

    tasks.push({
      order: zeroBasedIndex + 1,
      exerciseId: candidate.exerciseId,
      seedKey: candidate.seedKey,
      exerciseName: candidate.exerciseName,
      category: candidate.category,
      reason,
      currentImageAssetCount: candidate.imageAssetCount,
      failedImageCount: candidate.failedImageCount,
      rightsBlockedImageCount: candidate.rightsBlockedImageCount,
      figurePresentation,
      outputFilename: buildCodexImageOutputFilename(
        zeroBasedIndex + 1,
        candidate.seedKey,
        candidate.exerciseName,
      ),
      promptReady: prompt !== null,
      prompt,
      promptError,
      importPolicy: {
        registerAs: "club_created",
        initialReviewStatus: "pending",
        neverOverwriteApprovedPrimaryMedia: true,
        replaceOnlyWhenCurrentMediaIsUnusable: true,
        biomechanicsReviewRequired: true,
        textMatchReviewRequired: true,
      },
    });
  }

  const payload = {
    format: "ocrcraft-codex-image-tasks-v1",
    generatedAt: new Date().toISOString(),
    query: args.query || null,
    candidateCount: candidates.length,
    taskCount: tasks.length,
    skippedActiveImageJobs: candidates.length - exportable.length,
    promptReadyCount: promptReady,
    promptBlockedCount: tasks.length - promptReady,
    generationRules: [
      "Use the exact OCRCraft prompt stored in each task; the structured catalog content is the source of truth.",
      "Generate one task/output file at a time. Do not create contact sheets or composite atlases for import.",
      "Do not merge people, duplicate limbs, distort hands/feet, or add participants not required by the exercise.",
      "Reject and regenerate anatomically implausible results before import.",
      "Keep the same main demonstrator across all frames of a sequence and preserve the requested equipment.",
      "Never overwrite an already approved usable primary medium.",
      "After import keep the new medium pending until biomechanics and text-match review pass.",
    ],
    tasks,
  };

  const outputPath = path.resolve(args.output);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(payload, null, 2), "utf8");
  process.stdout.write(
    `Codex image task export written to ${outputPath}\n` +
    `${tasks.length} task(s), ${promptReady} prompt-ready, ${tasks.length - promptReady} blocked by incomplete structured image context, ${candidates.length - exportable.length} skipped because an image job is active.\n`,
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Codex image task export failed: ${message}\n`);
  process.exitCode = 1;
});
