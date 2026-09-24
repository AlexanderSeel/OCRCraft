import { readFile } from "node:fs/promises";
import { join } from "node:path";

const base = JSON.parse(await readFile(join(process.cwd(), "data", "hasaneyldrm-exercises.json"), "utf8"));
const candidates = JSON.parse(await readFile(join(process.cwd(), "data", "exercisedb-exercises.json"), "utf8"));
const normalize = (value) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const baseNames = new Set(base.map((row) => normalize(row.name)));
const unique = candidates.filter((row) => !baseNames.has(normalize(row.name)));
const highSignal = ["pull up", "chin up", "hang", "carry", "sled", "crawl", "sprint", "battling rope", "obstacle", "climb"];
const conditioning = ["squat", "lunge", "deadlift", "push up", "plank", "jump", "step up", "balance", "row", "rope"];

const reviewedHighSignalIds = new Set([
  "4H86mXM", "5ipN0iE", "6vcvsLS", "dVeWXf2", "Dx2RIva", "fjjY3N4", "G1qWW6M",
  "gdPIyyO", "gTGciXz", "hVzPY5j", "IU4QNJ6", "J1vH2X0", "lFBTISi", "LlSe9IK",
  "N3EirIW", "p0OCXGb", "Sa8mzWc", "WFucoe6",
]);

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
  for (const row of unique.filter((candidate) => bucket(candidate) === key)) {
    const status = reviewedHighSignalIds.has(row.exerciseId) ? "reviewed" : "review_required";
    console.log(`  - ${row.exerciseId} · ${row.name} · ${status}`);
  }
}
const reviewed = unique.filter((row) => reviewedHighSignalIds.has(row.exerciseId)).length;
console.log(`\nReviewstatus: **${reviewed}/${unique.length}** Kandidaten fachlich entschieden; **${unique.length - reviewed}** bleiben blockiert.`);
console.log("Die Buckets sind Suchprioritäten, keine Freigaben. Kandidaten mit `review_required` dürfen nicht in den OCRCraft-Kern importiert werden. Jeder freigegebene Datensatz braucht eigene Sicherheits-, Alters-, Kapazitäts- und Coachingfelder.");
