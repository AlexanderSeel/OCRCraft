import { createHash } from "node:crypto";
import { readFile, realpath } from "node:fs/promises";
import path from "node:path";

interface LocalMediaAsset {
  readonly id: string;
  readonly storage_provider: string | null;
  readonly storage_uri: string | null;
  readonly sha256: string | null;
}

export type LocalMediaIntegrity = "not_local" | "invalid_path" | "missing" | "unreadable"
  | "verified" | "missing_recorded_hash" | "checksum_mismatch";

interface LocalFileObservation {
  readonly local_file_exists: boolean | null;
  readonly local_file_sha256: string | null;
  readonly local_file_integrity: LocalMediaIntegrity;
}

const isWithin = (root: string, file: string) => {
  const relative = path.relative(root, file);
  return relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
};

/** Read-only inspection: never moves files or changes reviews to repair a mismatch. */
export async function auditLocalMediaFiles(assets: readonly LocalMediaAsset[], publicRoot: string) {
  const root = path.resolve(publicRoot, "generated", "exercises");
  const canonicalRoot = await realpath(root).catch(() => root);
  const files = new Map<string, { readonly hash: string | null; readonly exists: boolean | null; readonly failure?: LocalMediaIntegrity }>();
  const references = new Map<string, string[]>();
  const observations: Record<string, LocalFileObservation> = {};

  for (const asset of assets) {
    const uri = asset.storage_uri;
    if (asset.storage_provider !== "filesystem" || !uri?.startsWith("/generated/exercises/")) {
      observations[asset.id] = { local_file_exists: null, local_file_sha256: null, local_file_integrity: "not_local" };
      continue;
    }
    const file = path.resolve(publicRoot, uri.slice(1));
    if (!isWithin(root, file)) {
      observations[asset.id] = { local_file_exists: null, local_file_sha256: null, local_file_integrity: "invalid_path" };
      continue;
    }
    let canonical: string;
    try {
      canonical = await realpath(file);
    } catch (error) {
      const missing = (error as NodeJS.ErrnoException).code === "ENOENT";
      observations[asset.id] = { local_file_exists: missing ? false : null, local_file_sha256: null, local_file_integrity: missing ? "missing" : "unreadable" };
      continue;
    }
    if (!isWithin(canonicalRoot, canonical)) {
      observations[asset.id] = { local_file_exists: null, local_file_sha256: null, local_file_integrity: "invalid_path" };
      continue;
    }
    const key = process.platform === "win32" ? canonical.toLowerCase() : canonical;
    const ids = references.get(key) ?? [];
    ids.push(asset.id);
    references.set(key, ids);
    let result = files.get(key);
    if (!result) {
      try {
        result = { hash: createHash("sha256").update(await readFile(canonical)).digest("hex"), exists: true };
      } catch (error) {
        const missing = (error as NodeJS.ErrnoException).code === "ENOENT";
        result = { hash: null, exists: missing ? false : null, failure: missing ? "missing" : "unreadable" };
      }
      files.set(key, result);
    }
    const recordedHash = asset.sha256?.trim().toLowerCase();
    observations[asset.id] = {
      local_file_exists: result.exists,
      local_file_sha256: result.hash,
      local_file_integrity: result.failure ?? (!recordedHash ? "missing_recorded_hash" : result.hash === recordedHash ? "verified" : "checksum_mismatch"),
    };
  }

  return {
    observations,
    sharedLocalFileGroups: [...references.values()].filter((ids) => ids.length > 1).map((assetIds) => ({ assetIds })),
  };
}
