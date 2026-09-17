import { readFile } from "node:fs/promises";
import { adaptHasaneyldrmExercises } from "../src/server/exercises/import/hasaneyldrm-exercises-adapter";

const inputPath = process.argv[2];
if (!inputPath || inputPath.startsWith("-")) {
  console.error("Usage: npm exec tsx scripts/import-hasaneyldrm-exercises.ts <dataset.json>");
  process.exit(2);
}
const source = JSON.parse(await readFile(inputPath, "utf8")) as unknown;
const drafts = adaptHasaneyldrmExercises(source);
console.log(JSON.stringify({ mode: "dry-run", count: drafts.length, drafts }, null, 2));
