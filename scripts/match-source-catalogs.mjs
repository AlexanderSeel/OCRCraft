import { readFile } from "node:fs/promises";
import { join } from "node:path";

const left = JSON.parse(await readFile(join(process.cwd(), "data", "hasaneyldrm-exercises.json"), "utf8"));
const right = JSON.parse(await readFile(join(process.cwd(), "data", "exercisedb-exercises.json"), "utf8"));
const threshold = 0.7;

function normalize(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function tokens(value) {
  return new Set(normalize(value).split(/\s+/).filter(Boolean));
}

function tokenDice(a, b) {
  if (!a.size || !b.size) return 0;
  let overlap = 0;
  for (const token of a) if (b.has(token)) overlap += 1;
  return (2 * overlap) / (a.size + b.size);
}

function editRatio(a, b) {
  if (a === b) return 1;
  if (!a || !b) return 0;
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const saved = previous[j];
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = saved;
    }
  }
  return 1 - previous[b.length] / Math.max(a.length, b.length);
}

function similarity(a, b) {
  const leftName = normalize(a.name);
  const rightName = normalize(b.name);
  if (leftName === rightName) return 1;
  return Math.max(tokenDice(tokens(leftName), tokens(rightName)), editRatio(leftName, rightName));
}

function filledness(row) {
  const fields = [
    row.name,
    row.category ?? row.bodyParts?.[0],
    row.body_part,
    row.equipment ?? row.equipments?.join(","),
    row.target ?? row.targetMuscles?.join(","),
    row.secondary_muscles ?? row.secondaryMuscles?.join(","),
    row.instructions,
    row.instruction_steps,
    row.image ?? row.gif_url ?? row.gifUrl,
  ];
  return fields.reduce((score, field) => {
    if (Array.isArray(field)) return score + (field.length > 0 ? 1 : 0);
    if (field && typeof field === "object") return score + (Object.keys(field).length > 0 ? 1 : 0);
    return score + (String(field ?? "").trim() ? 1 : 0);
  }, 0);
}

const matches = [];
for (const source of left) {
  let best = null;
  for (const candidate of right) {
    const score = similarity(source, candidate);
    if (!best || score > best.score || (score === best.score && filledness(candidate) > filledness(best.candidate))) {
      best = { candidate, score };
    }
  }
  if (best && best.score >= threshold) {
    matches.push({ source, candidate: best.candidate, score: best.score });
  }
}

const exact = matches.filter((match) => match.score === 1);
const fuzzy = matches.filter((match) => match.score < 1);
const sourceWins = matches.filter((match) => filledness(match.source) > filledness(match.candidate)).length;
const candidateWins = matches.length - sourceWins;

console.log("# Quellen-Matching-Audit\n");
console.log(`Schwelle: **${threshold.toFixed(2)}** · Vergleich: normalisierte Namen, Token-Dice und Edit-Distanz.\n`);
console.log(`- geprüfte hasaneyldrm-Datensätze: **${left.length}**`);
console.log(`- Matches ab Schwelle: **${matches.length}**`);
console.log(`- davon exakte Namensmatches: **${exact.length}**`);
console.log(`- davon fuzzy Matches: **${fuzzy.length}**`);
console.log(`- reichhaltiger auf hasaneyldrm-Seite: **${sourceWins}**`);
console.log(`- reichhaltiger auf ExerciseDB-Seite: **${candidateWins}**`);
console.log("\n## Prüfhinweis\n");
console.log("Die Matchliste ist eine Kandidatenliste, keine automatische Lösch- oder Überschreibaktion. Quellen-IDs, Quell-URLs und Reviewstatus müssen beim kanonischen Mapping erhalten bleiben.\n");
console.log("## Niedrigste akzeptierte Matches\n");
for (const match of [...matches].sort((a, b) => a.score - b.score).slice(0, 25)) {
  console.log(`- ${match.score.toFixed(3)} · ${match.source.name} → ${match.candidate.name} · Füllstand ${filledness(match.source)}/${filledness(match.candidate)}`);
}
