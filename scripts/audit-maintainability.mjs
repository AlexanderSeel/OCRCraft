import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const sourceRoot = join(root, "src");
const files = await collectFiles(sourceRoot, new Set([".ts", ".tsx"]));
const uiFiles = files.filter((file) => {
  const rel = normalized(file);
  return rel.startsWith("src/app/") || rel.startsWith("src/components/");
});
const corpusEntries = await Promise.all(files.map(async (file) => [file, await readFile(file, "utf8")]));
const corpus = corpusEntries.map(([, content]) => content).join("\n");

const classOccurrences = new Map();
for (const [file, content] of corpusEntries.filter(([file]) => uiFiles.includes(file))) {
  for (const match of content.matchAll(/className="([^"]{35,})"/g)) {
    const className = match[1].trim().replace(/\s+/g, " ");
    const list = classOccurrences.get(className) ?? [];
    list.push(normalized(file));
    classOccurrences.set(className, list);
  }
}

const duplicateClasses = [...classOccurrences.entries()]
  .map(([className, occurrences]) => ({
    className,
    occurrences,
    uniqueFiles: [...new Set(occurrences)],
  }))
  .filter((item) => item.uniqueFiles.length >= 2)
  .sort((left, right) => right.occurrences.length - left.occurrences.length)
  .slice(0, 30);

const exportedSymbols = [];
for (const [file, content] of corpusEntries) {
  const rel = normalized(file);
  if (/\.(?:test|integration\.test)\.[tj]sx?$/.test(rel)) continue;
  for (const match of content.matchAll(/export\s+(?:async\s+)?(?:function|const|class|interface|type)\s+([A-Za-z_$][\w$]*)/g)) {
    const symbol = match[1];
    if (symbol === "metadata" || symbol === "dynamic" || symbol === "revalidate") continue;
    exportedSymbols.push({ file: rel, symbol });
  }
}

const likelyUnusedExports = exportedSymbols
  .filter(({ symbol }) => {
    const escaped = symbol.replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&");
    const count = [...corpus.matchAll(new RegExp("\\b" + escaped + "\\b", "g"))].length;
    return count <= 1;
  })
  .slice(0, 80);

const rawButtons = corpusEntries
  .filter(([file, content]) => {
    const rel = normalized(file);
    return (rel.startsWith("src/app/") || rel.startsWith("src/components/"))
      && /<button\b[^>]*className=/.test(content);
  })
  .map(([file]) => normalized(file));

const report = {
  scannedSourceFiles: files.length,
  scannedUiFiles: uiFiles.length,
  duplicateStaticClassGroups: duplicateClasses.length,
  rawButtonFiles: rawButtons.length,
  likelyUnusedExportCount: likelyUnusedExports.length,
  duplicateClasses,
  rawButtonFilesList: rawButtons,
  likelyUnusedExports,
};

console.log("MAINTAINABILITY_INVENTORY_BEGIN");
console.log(JSON.stringify(report, null, 2));
console.log("MAINTAINABILITY_INVENTORY_END");

function normalized(file) {
  return relative(root, file).replaceAll("\\", "/");
}

async function collectFiles(directory, extensions) {
  const result = [];
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await collectFiles(file, extensions));
    else if (extensions.has(extname(entry.name))) result.push(file);
  }
  return result;
}
