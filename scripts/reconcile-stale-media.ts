import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadEnvConfig } from "@next/env";

async function main() {
  if (process.argv.slice(2).some((argument) => argument !== "--apply")) throw new Error("Usage: media:reconcile-stale [--apply]");
  loadEnvConfig(process.cwd());
  const { reconcileStaleMediaCandidates } = await import("../src/server/media/stale-media-retirement-service");
  const mode = process.argv.includes("--apply") ? "apply" : "preview";
  const result = await reconcileStaleMediaCandidates(mode);
  const output = path.resolve(`artifacts/media-retirement/${mode}.json`);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(result, null, 2) + "\n", "utf8");
  console.log(JSON.stringify({ mode, candidates: result.candidates.length, blocked: result.blocked.length, retired: result.retired, backupPath: result.backupPath, output }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
