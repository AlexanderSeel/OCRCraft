import { readFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";

const sourceRoot = join(process.cwd(), "src");
const sourceExtensions = new Set([".tsx", ".ts"]);
const forbiddenPatterns = [
  {
    name: "fester Katalogzähler in einer Vorlagenbeschreibung",
    pattern: /\b\d+\s+kuratierte\s+(?:OCRCraft-)?Startvorlagen\b/i,
  },
  {
    name: "englischer Legacy-Debugtext",
    pattern: />\s*Copy Coordinates\s*</,
  },
];

const files = await collectSourceFiles(sourceRoot);
const violations = [];

for (const file of files) {
  const content = await readFile(file, "utf8");
  for (const { name, pattern } of forbiddenPatterns) {
    for (const match of content.matchAll(new RegExp(pattern.source, pattern.flags.replace("g", "") + "g"))) {
      const line = content.slice(0, match.index).split("\n").length;
      violations.push(`${relative(process.cwd(), file)}:${line} ${name}`);
    }
  }
}

if (violations.length > 0) {
  console.error("UI-Review-Gate fehlgeschlagen:");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exitCode = 1;
} else {
  console.log(`UI-Review-Gate bestanden: ${files.length} Quelldateien geprüft.`);
}

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await collectSourceFiles(path));
    else if (sourceExtensions.has(entry.name.slice(entry.name.lastIndexOf(".")))) result.push(path);
  }
  return result;
}
