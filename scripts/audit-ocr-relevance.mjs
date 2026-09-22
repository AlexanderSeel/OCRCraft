import { readFile } from "node:fs/promises";
import { join } from "node:path";

const base = JSON.parse(await readFile(join(process.cwd(), "data", "hasaneyldrm-exercises.json"), "utf8"));
const candidates = JSON.parse(await readFile(join(process.cwd(), "data", "exercisedb-exercises.json"), "utf8"));
const normalize = (value) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const baseNames = new Set(base.map((row) => normalize(row.name)));
const unique = candidates.filter((row) => !baseNames.has(normalize(row.name)));
const highSignal = ["pull up", "chin up", "hang", "carry", "sled", "crawl", "sprint", "battling rope", "obstacle", "climb"];
const conditioning = ["squat", "lunge", "deadlift", "push up", "plank", "jump", "step up", "balance", "row", "rope"];

function bucket(row) {
  const searchable = normalize([row.name, ...(row.bodyParts ?? []), ...(row.equipments ?? []), ...(row.targetMuscles ?? [])].join(" "));
  if (highSignal.some((term) => searchable.includes(term))) return "high_signal_review";
  if (conditioning.some((term) => searchable.includes(term))) return "conditioning_review";
  return "manual_review";
}

const groups = new Map();
for (const row of unique) {
  const key = bucket(row);
  groups.set(key, [...(groups.get(key) ?? []), row.name]);
}

console.log("# OCR-Relevanz-Audit\n");
console.log(`ExerciseDB-Kandidaten außerhalb der hasaneyldrm-Basis: **${unique.length}**\n`);
for (const key of ["high_signal_review", "conditioning_review", "manual_review"]) {
  const names = groups.get(key) ?? [];
  console.log(`- ${key}: **${names.length}**`);
  for (const name of names.slice(0, 25)) console.log(`  - ${name}`);
}
console.log("\nDie Buckets sind Suchprioritäten, keine Freigaben. Jeder Kandidat braucht vor Übernahme OCRCraft-eigene Sicherheits-, Alters-, Kapazitäts- und Coachingfelder.");
