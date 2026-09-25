import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const sourceRoot = join(root, "src");
const scriptRoot = join(root, "scripts");
const violations = [];

const sourceFiles = await collectFiles(sourceRoot, new Set([".ts", ".tsx"]));
const scriptFiles = await collectFiles(scriptRoot, new Set([".js", ".mjs", ".ts", ".tsx"]));
const allCodeFiles = [...sourceFiles, ...scriptFiles];

for (const file of sourceFiles) {
  const content = await readFile(file, "utf8");
  const rel = relative(root, file).replaceAll("\\", "/");

  if ((rel.startsWith("src/app/") || rel.startsWith("src/components/"))
      && /(?:@\/server\/db\/duckdb|@duckdb\/node-api|withDuckDbConnection|openDuckDbConnection|DuckDBInstance)/.test(content)) {
    violations.push(rel + ": UI/application route must not access DuckDB directly; use a server service/repository boundary.");
  }

  if (rel.startsWith("src/domain/")
      && /(?:from\s+["'](?:react|next(?:\/[^"']*)?|server-only|@\/server\/[^"']*)["']|require\(["'](?:react|next|server-only|@\/server\/))/m.test(content)) {
    violations.push(rel + ": domain code must stay framework- and server-infrastructure-free.");
  }

  if (rel.startsWith("src/components/")
      && /from\s+["']@\/server\/db\//.test(content)) {
    violations.push(rel + ": React components must not import database modules.");
  }
}

const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const runtimeDependencies = Object.keys(packageJson.dependencies ?? {});
const codeCorpus = (await Promise.all(allCodeFiles.map((file) => readFile(file, "utf8")))).join("\n");
const configCorpus = [
  await safeRead(join(root, "next.config.ts")),
  await safeRead(join(root, "next.config.mjs")),
  await safeRead(join(root, "postcss.config.mjs")),
  await safeRead(join(root, "playwright.config.ts")),
].join("\n");
const dependencyCorpus = codeCorpus + "\n" + configCorpus;

const frameworkRuntime = new Set(["next", "react", "react-dom"]);
for (const dependency of runtimeDependencies) {
  if (frameworkRuntime.has(dependency)) continue;
  const escaped = dependency.replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&");
  const importPattern = new RegExp(
    "(?:from\\s+[\"']" + escaped + "(?:/[^\"']*)?[\"']|import\\s+[\"']" + escaped + "(?:/[^\"']*)?[\"']|import\\([\"']" + escaped + "(?:/[^\"']*)?[\"']|require\\([\"']" + escaped + "(?:/[^\"']*)?[\"'])",
  );
  if (!importPattern.test(dependencyCorpus)) {
    violations.push('package.json: runtime dependency "' + dependency + '" has no import in src/, scripts/ or runtime config.');
  }
}

const requiredScripts = [
  "lint",
  "check:ui",
  "check:architecture",
  "typecheck",
  "test",
  "build",
  "test:e2e",
];
for (const name of requiredScripts) {
  if (!packageJson.scripts?.[name]) violations.push('package.json: required validation script "' + name + '" is missing.');
}

const readme = await readFile(join(root, "README.md"), "utf8");
for (const command of ["npm run check:ui", "npm run check:architecture", "npm run typecheck", "npm test", "npm run lint", "npm run build", "npm run test:e2e"]) {
  if (!readme.includes(command)) violations.push('README.md: validation command "' + command + '" is not documented.');
}

if (violations.length) {
  console.error("Architecture/dependency gate failed:");
  for (const violation of violations) console.error("- " + violation);
  process.exitCode = 1;
} else {
  console.log("Architecture/dependency gate passed: " + sourceFiles.length + " source files and " + runtimeDependencies.length + " runtime dependencies checked.");
}

async function safeRead(file) {
  try { return await readFile(file, "utf8"); } catch { return ""; }
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
