import "server-only";
import path from "node:path";
import type { DuckDBConnection } from "@duckdb/node-api";
import { planStaleMediaRetirement } from "@/domain/media/stale-media-retirement";
import { withDuckDbCheckpointBackup, withDuckDbConnection } from "@/server/db/duckdb";
import { auditLocalMediaFiles } from "./local-media-file-audit";
import { listMediaIntegrityCandidates, retireStaleMediaCandidates } from "./stale-media-retirement-repository";

export async function reconcileStaleMediaCandidates(mode: "preview" | "apply") {
  const reconcile = async (connection: DuckDBConnection, backupPath: string | null) => {
    const assets = await listMediaIntegrityCandidates(connection);
    const inspection = await auditLocalMediaFiles(assets, path.resolve("public"));
    const plan = planStaleMediaRetirement(assets.map((asset) => ({ ...asset,
      storageUri: asset.storage_uri ?? "", recordedHash: asset.sha256,
      actualHash: inspection.observations[asset.id].local_file_sha256,
      integrity: inspection.observations[asset.id].local_file_integrity,
    })));
    let retired = 0;
    if (mode === "apply" && plan.candidates.length) {
      retired = await retireStaleMediaCandidates(connection, plan.candidates);
    }
    return { format: "ocrcraft-media-retirement-v1", generatedAt: new Date().toISOString(), mode,
      backupPath, retired, ...plan };
  };
  return mode === "apply"
    ? withDuckDbCheckpointBackup(reconcile)
    : withDuckDbConnection((connection) => reconcile(connection, null));
}
