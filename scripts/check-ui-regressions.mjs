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
const requiredPatterns = [
  {
    file: join(sourceRoot, "components", "navigation", "breadcrumbs.tsx"),
    name: "Breadcrumbs benötigen ein zugängliches Nav-Label",
    pattern: /<nav\s+aria-label=/,
  },
  {
    file: join(sourceRoot, "components", "navigation", "breadcrumbs.tsx"),
    name: "Breadcrumbs benötigen eine aktuelle Seite",
    pattern: /aria-current="page"/,
  },
  {
    file: join(sourceRoot, "components", "ui", "feedback.tsx"),
    name: "Alerts benötigen Live-Regionen",
    pattern: /aria-live=/,
  },
  {
    file: join(sourceRoot, "components", "ui", "feedback.tsx"),
    name: "Feedback-Komponenten benötigen semantische Rollen",
    pattern: /role=\{tone === "danger" \? "alert" : "status"\}/,
  },
  {
    file: join(sourceRoot, "components", "ui", "card.tsx"),
    name: "Cards müssen semantische Elementtypen unterstützen",
    pattern: /as\?: "article" \| "div" \| "section"/,
  },
  {
    file: join(sourceRoot, "components", "ui", "form.tsx"),
    name: "Interaktive Buttons benötigen Touch-Ziel und sichtbaren Fokus",
    pattern: /buttonBaseClass\s*=\s*[\s\S]*min-h-11[\s\S]*focus-visible:outline-none/,
  },
  {
    file: join(sourceRoot, "components", "ui", "form.tsx"),
    name: "Formularfelder müssen Fehler semantisch ankündigen",
    pattern: /(?=[\s\S]*role=\"alert\")(?=[\s\S]*aria-invalid:)/,
  },
  {
    file: join(sourceRoot, "components", "ui", "dialog.tsx"),
    name: "Dialoge müssen Escape schließen und Fokus zurückgeben",
    pattern: /event\.key === "Escape"[\s\S]*previousActive\?\.focus\(\)/,
  },
  {
    file: join(sourceRoot, "components", "ui", "dialog.tsx"),
    name: "Dialoge müssen den Fokus innerhalb des Panels halten",
    pattern: /event\.key !== "Tab"[\s\S]*event\.preventDefault\(\)[\s\S]*last\.focus\(\)/,
  },
  {
    file: join(sourceRoot, "components", "navigation", "primary-navigation.tsx"),
    name: "Mobile Navigation benötigt Landmarke und ausreichend große Links",
    pattern: /aria-label=\{dictionary\.mobileNavigation\}[\s\S]*lg:hidden[\s\S]*min-h-10/,
  },
  {
    file: join(sourceRoot, "app", "globals.css"),
    name: "Reduzierte Bewegung muss global berücksichtigt werden",
    pattern: /@media \(prefers-reduced-motion: reduce\)/,
  },
];

const files = await collectSourceFiles(sourceRoot);
const violations = [];

for (const { file, name, pattern } of requiredPatterns) {
  const content = await readFile(file, "utf8");
  if (!pattern.test(content)) {
    violations.push(`${relative(process.cwd(), file)} ${name}`);
  }
}

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
