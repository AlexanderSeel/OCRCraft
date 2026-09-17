import { readFile } from "node:fs/promises";
import { adaptHasaneyldrmExercises } from "../src/server/exercises/import/hasaneyldrm-exercises-adapter";
import { importHasaneyldrmExercises } from "../src/server/exercises/import/hasaneyldrm-exercises-persistence";

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath || inputPath.startsWith("-")) {
    console.error("Usage: npm exec tsx scripts/import-hasaneyldrm-exercises.ts <dataset.json>");
    process.exitCode = 2;
    return;
  }
  const source = JSON.parse(await readFile(inputPath, "utf8")) as unknown;
  const limitFlag = process.argv.indexOf("--limit");
  const limit = limitFlag >= 0 ? Number(process.argv[limitFlag + 1]) : undefined;
  if (process.argv.includes("--persist")) {
    console.log(JSON.stringify({ mode: "persist", ...(await importHasaneyldrmExercises(source, limit)) }, null, 2));
  } else {
    const drafts = adaptHasaneyldrmExercises(source).slice(0, limit ?? Number.POSITIVE_INFINITY);
    console.log(JSON.stringify({ mode: "dry-run", count: drafts.length, drafts }, null, 2));
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
