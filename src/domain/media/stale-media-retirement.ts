export interface MediaIntegrityCandidate {
  readonly id: string;
  readonly exerciseId: string;
  readonly storageUri: string;
  readonly recordedHash: string | null;
  readonly actualHash: string | null;
  readonly integrity: string;
  readonly reviewStatus: string;
  readonly generationStatus: string;
  readonly sourceType: string;
  readonly illustrationFormat: string | null;
  readonly isPrimary: boolean;
  readonly biomechanicsReview: string;
  readonly textMatchReview: string;
  readonly activeJobs: number;
}

export interface StaleMediaRetirement {
  readonly assetId: string;
  readonly exerciseId: string;
  readonly storageUri: string;
  readonly recordedHash: string;
  readonly actualHash: string;
  readonly survivingAssetId: string;
}

/** Technical retirement only; the surviving candidate receives no approval. */
export function planStaleMediaRetirement(assets: readonly MediaIntegrityCandidate[]) {
  const candidates: StaleMediaRetirement[] = [];
  const blocked: { assetId: string; reason: string }[] = [];
  for (const asset of assets.filter((item) => item.integrity === "checksum_mismatch" && item.reviewStatus !== "rejected")) {
    if (asset.reviewStatus !== "pending" || asset.isPrimary || asset.biomechanicsReview !== "unreviewed" || asset.textMatchReview !== "unreviewed") {
      blocked.push({ assetId: asset.id, reason: "primary-or-reviewed" });
      continue;
    }
    const recordedHash = asset.recordedHash;
    const actualHash = asset.actualHash;
    if (asset.sourceType !== "ai_generated" || asset.illustrationFormat !== "exercise_sequence" || asset.generationStatus !== "generated" || asset.activeJobs > 0
      || !recordedHash || !actualHash || !/^[a-f0-9]{64}$/i.test(recordedHash) || !/^[a-f0-9]{64}$/i.test(actualHash)) {
      blocked.push({ assetId: asset.id, reason: "unsupported-or-active" });
      continue;
    }
    const survivor = assets.find((other) => other.id !== asset.id && other.exerciseId === asset.exerciseId
      && other.storageUri === asset.storageUri && other.integrity === "verified" && other.actualHash === asset.actualHash
      && other.reviewStatus !== "rejected" && other.generationStatus === "generated" && other.activeJobs === 0);
    if (!survivor) {
      blocked.push({ assetId: asset.id, reason: "no-matching-survivor" });
      continue;
    }
    candidates.push({ assetId: asset.id, exerciseId: asset.exerciseId, storageUri: asset.storageUri,
      recordedHash, actualHash, survivingAssetId: survivor.id });
  }
  return { candidates, blocked };
}
