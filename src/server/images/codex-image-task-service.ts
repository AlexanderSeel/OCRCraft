import "server-only";

import { buildExerciseImagePrompt } from "@/server/images/exercise-image-prompt-builder";
import { ExerciseImageGenerationRepository } from "@/server/images/exercise-image-generation-repository";
import {
  buildCodexImageOutputFilename,
  chooseCodexImageFigurePresentation,
} from "@/server/images/codex-image-task-core";
import {
  listMediaCatalog,
  listMediaGenerationCandidates,
} from "@/server/media/media-catalog-repository";
import { getMediaGenerationCandidateReason } from "@/server/media/media-rights-core";
import {
  CODEX_IMAGE_P1_BATCHES,
  type CodexImageP1BatchId,
} from "@/server/images/codex-image-p1-batches";

export interface CodexImageTaskExportOptions {
  readonly query?: string;
  readonly limit?: number;
  readonly seedKeys?: readonly string[];
}

export async function buildCodexImageTaskExport(
  options: CodexImageTaskExportOptions = {},
): Promise<Record<string, unknown>> {
  const query = options.query?.trim() ?? "";
  const limit = Math.max(1, Math.min(1000, Math.trunc(options.limit ?? 1000)));
  const seedKeyFilter = new Set((options.seedKeys ?? []).map((value) => value.trim()).filter(Boolean));
  const candidates = await listMediaGenerationCandidates(query, limit, [...seedKeyFilter]);
  const scopedCandidates = seedKeyFilter.size > 0
    ? candidates.filter((candidate) => candidate.seedKey && seedKeyFilter.has(candidate.seedKey))
    : candidates;
  const exportable = scopedCandidates.filter((candidate) => candidate.activeJobCount === 0);
  const repository = new ExerciseImageGenerationRepository();

  const tasks: Record<string, unknown>[] = [];
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

  return {
    format: "ocrcraft-codex-image-tasks-v1",
    generatedAt: new Date().toISOString(),
    query: query || null,
    candidateCount: scopedCandidates.length,
    taskCount: tasks.length,
    requestedSeedKeys: seedKeyFilter.size > 0 ? [...seedKeyFilter] : null,
    skippedRequestedSeedKeys: seedKeyFilter.size > 0
      ? [...seedKeyFilter].filter((seedKey) => !scopedCandidates.some((candidate) => candidate.seedKey === seedKey))
      : [],
    skippedActiveImageJobs: scopedCandidates.length - exportable.length,
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
}

export interface CodexImageBatchProgress {
  readonly id: CodexImageP1BatchId;
  readonly total: number;
  readonly complete: number;
  readonly remaining: number;
  readonly activeJobs: number;
  readonly readyToGenerate: number;
}

export async function getCodexImageP1BatchProgress(): Promise<readonly CodexImageBatchProgress[]> {
  const candidates = await listMediaGenerationCandidates("", 1000);
  const candidatesBySeed = new Map(
    candidates
      .filter((candidate): candidate is typeof candidate & { readonly seedKey: string } => Boolean(candidate.seedKey))
      .map((candidate) => [candidate.seedKey, candidate]),
  );

  return (Object.entries(CODEX_IMAGE_P1_BATCHES) as readonly [
    CodexImageP1BatchId,
    readonly string[],
  ][]).map(([id, seedKeys]) => {
    const remainingCandidates = seedKeys
      .map((seedKey) => candidatesBySeed.get(seedKey))
      .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate));
    const activeJobs = remainingCandidates.filter((candidate) => candidate.activeJobCount > 0).length;
    const remaining = remainingCandidates.length;

    return {
      id,
      total: seedKeys.length,
      complete: seedKeys.length - remaining,
      remaining,
      activeJobs,
      readyToGenerate: remaining - activeJobs,
    };
  });
}

export async function buildCodexImageReviewExport(options: {
  readonly seedKeys?: readonly string[];
} = {}): Promise<Record<string, unknown>> {
  const seedKeyFilter = new Set((options.seedKeys ?? []).map((value) => value.trim()).filter(Boolean));
  const repository = new ExerciseImageGenerationRepository();
  const pendingAssets = (await listMediaCatalog({
    reviewStatus: "pending",
    limit: 500,
  })).filter((asset) =>
    asset.mediaType === "image" || asset.mediaType === "illustration"
  ).filter((asset) =>
    seedKeyFilter.size === 0 || (asset.seedKey ? seedKeyFilter.has(asset.seedKey) : false)
  );

  const tasks: Record<string, unknown>[] = [];
  for (const asset of pendingAssets) {
    let expectedPrompt: string | null = null;
    let promptError: string | null = null;
    try {
      const context = await repository.getContext(asset.seedKey ?? asset.exerciseId);
      expectedPrompt = buildExerciseImagePrompt(
        context,
        asset.figurePresentation === "adult_woman" ? "adult_woman" : "adult_man",
      );
    } catch (error) {
      promptError = error instanceof Error ? error.message : String(error);
    }

    tasks.push({
      assetId: asset.id,
      exerciseId: asset.exerciseId,
      seedKey: asset.seedKey,
      exerciseName: asset.exerciseName,
      sourceType: asset.sourceType,
      imageUrl: asset.imageUrl,
      localPublicPath: asset.imageUrl?.startsWith("/") ? `public${asset.imageUrl}` : null,
      generationStatus: asset.generationStatus,
      reviewStatus: asset.reviewStatus,
      biomechanicsReview: asset.biomechanicsReview,
      textMatchReview: asset.textMatchReview,
      reviewNotes: asset.reviewNotes,
      sequenceStepCount: asset.sequenceStepCount,
      figurePresentation: asset.figurePresentation,
      expectedPrompt,
      promptError,
      reviewChecklist: [
        "Exercise mechanics match the structured execution steps.",
        "No merged people, duplicate limbs, impossible joints or malformed hands/feet.",
        "Equipment and obstacle geometry match the exercise.",
        "No unexplained extra participant is present.",
        "Sequence frames keep the same main demonstrator and progress in the correct order.",
        "The depicted movement remains safe and biomechanically plausible.",
      ],
    });
  }

  return {
    format: "ocrcraft-codex-image-review-v1",
    generatedAt: new Date().toISOString(),
    requestedSeedKeys: seedKeyFilter.size > 0 ? [...seedKeyFilter] : null,
    pendingAssetCount: tasks.length,
    tasks,
  };
}
