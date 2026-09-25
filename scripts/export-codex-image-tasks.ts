import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildCodexImageTaskExport } from "@/server/images/codex-image-task-service";
import {
  codexImageP1BatchSeedKeys,
  isCodexImageP1BatchId,
} from "@/server/images/codex-image-p1-batches";

interface ExportArgs {
  readonly output: string;
  readonly query: string;
  readonly limit: number;
  readonly seedKeys: readonly string[];
}

function parseArgs(argv: readonly string[]): ExportArgs {
  const option = (name: string) => argv.find((value) => value.startsWith(`--${name}=`))?.slice(name.length + 3);
  const parsedLimit = Number(option("limit") ?? "1000");
  const batch = option("batch")?.trim() ?? "";
  if (batch && !isCodexImageP1BatchId(batch)) {
    throw new Error(`Unknown --batch=${batch}. Use single-subject, ocrfra-obstacles or games-partner.`);
  }
  const explicitSeedKeys = (option("seed-keys") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const seedKeys = explicitSeedKeys.length > 0
    ? explicitSeedKeys
    : batch
      ? codexImageP1BatchSeedKeys(batch)
      : [];
  return {
    output: option("output") || path.join("artifacts", batch ? `codex-image-tasks-${batch}.json` : "codex-image-tasks.json"),
    query: option("query")?.trim() ?? "",
    limit: Number.isFinite(parsedLimit) ? Math.max(1, Math.min(1000, Math.trunc(parsedLimit))) : 1000,
    seedKeys,
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const payload = await buildCodexImageTaskExport({
    query: args.query,
    limit: args.limit,
    seedKeys: args.seedKeys,
  });
  const outputPath = path.resolve(args.output);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(payload, null, 2), "utf8");

  const taskCount = Number(payload.taskCount ?? 0);
  const promptReadyCount = Number(payload.promptReadyCount ?? 0);
  const promptBlockedCount = Number(payload.promptBlockedCount ?? 0);
  const skippedActiveImageJobs = Number(payload.skippedActiveImageJobs ?? 0);
  process.stdout.write(
    `Codex image task export written to ${outputPath}\n` +
    `${taskCount} task(s), ${promptReadyCount} prompt-ready, ${promptBlockedCount} blocked by incomplete structured image context, ${skippedActiveImageJobs} skipped because an image job is active.\n`,
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Codex image task export failed: ${message}\n`);
  process.exitCode = 1;
});
