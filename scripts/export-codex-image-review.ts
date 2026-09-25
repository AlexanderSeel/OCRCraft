import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  codexImageP1BatchSeedKeys,
  isCodexImageP1BatchId,
} from "@/server/images/codex-image-p1-batches";
import { buildCodexImageReviewExport } from "@/server/images/codex-image-task-service";

function option(name: string): string {
  return process.argv.slice(2).find((value) => value.startsWith(`--${name}=`))?.slice(name.length + 3).trim() ?? "";
}

async function main(): Promise<void> {
  const batchValue = option("batch");
  if (batchValue && !isCodexImageP1BatchId(batchValue)) {
    throw new Error(`Unknown --batch=${batchValue}. Use single-subject, ocrfra-obstacles or games-partner.`);
  }
  const batch = batchValue && isCodexImageP1BatchId(batchValue) ? batchValue : null;
  const output = path.resolve(option("output") || path.join(
    "artifacts",
    batch ? `codex-image-review-${batch}.json` : "codex-image-review.json",
  ));
  const payload = await buildCodexImageReviewExport({
    seedKeys: batch ? codexImageP1BatchSeedKeys(batch) : [],
  });
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(payload, null, 2), "utf8");
  process.stdout.write(`Codex image review export written to ${output}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
