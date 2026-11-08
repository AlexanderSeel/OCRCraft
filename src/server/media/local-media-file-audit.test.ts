import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, it } from "vitest";
import { auditLocalMediaFiles } from "./local-media-file-audit";

it("detects shared bytes and per-record hash mismatches without changing files", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ocrcraft-media-audit-"));
  const file = path.join(root, "generated", "exercises", "sample.png");
  try {
    await mkdir(path.dirname(file), { recursive: true });
    const bytes = Buffer.from("existing image candidate");
    await writeFile(file, bytes);
    const hash = createHash("sha256").update(bytes).digest("hex");
    const shared = { storage_provider: "filesystem", storage_uri: "/generated/exercises/sample.png" };
    const result = await auditLocalMediaFiles([
      { id: "matching", ...shared, sha256: hash.toUpperCase() },
      { id: "outdated", ...shared, sha256: "0".repeat(64) },
      { id: "no-hash", ...shared, sha256: null },
    ], root);
    expect(result.observations.matching).toEqual({ local_file_exists: true, local_file_sha256: hash, local_file_integrity: "verified" });
    expect(result.observations.outdated.local_file_integrity).toBe("checksum_mismatch");
    expect(result.observations["no-hash"].local_file_integrity).toBe("missing_recorded_hash");
    expect(result.sharedLocalFileGroups).toEqual([{ assetIds: ["matching", "outdated", "no-hash"] }]);
    expect(await readFile(file)).toEqual(bytes);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

it("separates missing files, invalid paths and remote media", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ocrcraft-media-audit-missing-"));
  try {
    const result = await auditLocalMediaFiles([
      { id: "missing", storage_provider: "filesystem", storage_uri: "/generated/exercises/missing.png", sha256: null },
      { id: "traversal", storage_provider: "filesystem", storage_uri: "/generated/exercises/../../../outside.png", sha256: null },
      { id: "remote", storage_provider: "s3", storage_uri: "https://example.invalid/image.png", sha256: null },
    ], root);
    expect(result.observations.missing).toMatchObject({ local_file_exists: false, local_file_integrity: "missing" });
    expect(result.observations.traversal).toMatchObject({ local_file_exists: null, local_file_integrity: "invalid_path" });
    expect(result.observations.remote.local_file_integrity).toBe("not_local");
    expect(result.sharedLocalFileGroups).toEqual([]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
