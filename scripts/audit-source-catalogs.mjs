import { readFile } from "node:fs/promises";
import { join } from "node:path";

const sources = [
  { file: "data/hasaneyldrm-exercises.json", label: "hasaneyldrm" },
  { file: "data/exercisedb-exercises.json", label: "ExerciseDB" },
];

const normalize = (value) => String(value ?? "")
  .normalize("NFKC")
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, " ")
  .trim();

const records = [];
for (const source of sources) {
  const file = join(process.cwd(), source.file);
  const rows = JSON.parse(await readFile(file, "utf8"));
  records.push({ ...source, rows });
}

function countBy(rows, selector) {
  const counts = new Map();
  for (const row of rows) {
    const key = selector(row) || "(leer)";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function duplicateNames(rows) {
  return countBy(rows, (row) => normalize(row.name)).filter(([, count]) => count > 1);
}

function missingCounts(rows) {
  return {
    id: rows.filter((row) => !String(row.id ?? row.exerciseId ?? "").trim()).length,
    name: rows.filter((row) => !String(row.name ?? "").trim()).length,
    category: rows.filter((row) => !String(row.category ?? row.bodyParts?.[0] ?? "").trim()).length,
    instructions: rows.filter((row) => {
      const instructions = row.instructions;
      const hasObject = instructions && typeof instructions === "object" && Object.keys(instructions).length > 0;
      const hasText = typeof instructions === "string" && instructions.trim().length > 0;
      return !hasObject && !hasText && !(Array.isArray(row.instruction_steps) && row.instruction_steps.length > 0) && !(Array.isArray(instructions) && instructions.length > 0);
    }).length,
    media: rows.filter((row) => !String(row.image ?? row.gif_url ?? row.gifUrl ?? "").trim()).length,
    explicitlyVerifiedLicense: rows.filter((row) => row.license_verified !== true || !String(row.license_label ?? "").trim()).length,
  };
}

const [first, second] = records;
const firstNames = new Set(first.rows.map((row) => normalize(row.name)));
const secondNames = new Set(second.rows.map((row) => normalize(row.name)));
const overlap = [...firstNames].filter((name) => name && secondNames.has(name)).length;

console.log("# Quellenkatalog-Audit\n");
console.log(`Generiert: ${new Date().toISOString()}\n`);
console.log("## Zusammenfassung\n");
console.log(`- ${first.label}: **${first.rows.length}** Datensätze, **${new Set(first.rows.map((row) => normalize(row.name))).size}** normalisierte Namen`);
console.log(`- ${second.label}: **${second.rows.length}** Datensätze, **${new Set(second.rows.map((row) => normalize(row.name))).size}** normalisierte Namen`);
console.log(`- Quellenüberlappung nach normalisiertem Namen: **${overlap}** Namen`);
console.log("- Rohdaten bleiben unverändert; dieser Audit ist eine Entscheidungsgrundlage für Review und Migration.\n");

for (const source of records) {
  console.log(`## ${source.label}\n`);
  console.log(`Datensätze: **${source.rows.length}**\n`);
  console.log("### Kategorien\n");
  for (const [category, count] of countBy(source.rows, (row) => row.category ?? row.bodyParts?.[0] ?? "(leer)")) {
    console.log(`- ${category}: ${count}`);
  }
  console.log("\n### Fehlende oder ungeklärte Felder\n");
  for (const [field, count] of Object.entries(missingCounts(source.rows))) {
    console.log(`- ${field}: ${count}`);
  }
  console.log("\n### Exakte Namensduplikate innerhalb der Quelle\n");
  const duplicates = duplicateNames(source.rows);
  if (duplicates.length === 0) console.log("- keine");
  else for (const [name, count] of duplicates) console.log(`- ${name}: ${count}`);
  console.log();
}
