import "server-only";

import ExcelJS from "exceljs";
import JSZip from "jszip";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { listExercises } from "@/server/exercises/exercise-repository";
import { persistTrainingDraft, type TrainingSessionDetail } from "./training-session-repository";
import { validateTrainingSession, type TrainingValidationIssue } from "@/domain/training/validation";
import type { TrainingDraft } from "@/domain/training/draft";
import {
  TRAINING_PHASE_LABELS,
  type ExerciseReference,
  type TrainingPhaseKind,
  type TrainingSession,
} from "@/domain/training/model";

const TEMPLATE_PATH = path.join(process.cwd(), "public", "templates", "Trainingsplanung_Vorlage.xlsx");
const HEADERS = ["Zeit", "Bezeichnung der Übung", "Begründung bzw. Ziel/Zweck", "Beschreibung der Übung", "Bild der Übung", "Aufstellung der TN", "Notwendiges Material"] as const;

async function excelJsCompatibleBytes(input: Uint8Array): Promise<Buffer> {
  const zip = await JSZip.loadAsync(input as never);
  const xmlFiles = Object.values(zip.files).filter((file) => file.name.endsWith(".xml"));
  await Promise.all(xmlFiles.map(async (file) => {
    const xml = await file.async("string");
    // The supplied template uses a prefixed default spreadsheet namespace.
    // ExcelJS 4.x expects the same XML with unprefixed element names.
    zip.file(file.name, xml.replaceAll("xmlns:x=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"", "").replaceAll(/<\/?x:/g, (tag) => tag.replace("x:", "")));
  }));
  return await zip.generateAsync({ type: "nodebuffer" });
}

export interface ImportedTrainingResult {
  readonly sessionId: string;
  readonly matchedExercises: number;
  readonly phaseCount: number;
}

interface ImportedRow {
  readonly rowNumber: number;
  readonly name: string;
  readonly purpose: string;
  readonly instructions: string;
  readonly arrangement: string;
  readonly material: string;
  readonly startMinute: number | null;
  readonly phase: TrainingPhaseKind;
  readonly mainPartIndex: number;
  readonly mainPartTitle: string;
}

function cellText(row: ExcelJS.Row, column: number): string {
  const value = row.getCell(column).value;
  if (value == null) return "";
  if (typeof value === "object" && "text" in value) return String(value.text ?? "").trim();
  return String(value).trim();
}

function phaseFromText(value: string): TrainingPhaseKind | null {
  const normalized = value.toLocaleLowerCase("de-DE");
  if (/cool[- ]?down|cooldown|stretching|regeneration/.test(normalized)) return "cooldown";
  if (/hauptteil|zirkel|main part/.test(normalized)) return "main";
  if (/aufwärm|warm[- ]?up|mobilisation|aktivierung/.test(normalized)) return "warmup";
  return null;
}

function parseStartMinute(value: string): number | null {
  const match = value.match(/^\s*(\d+(?:[.,]\d+)?)\s*\/+/);
  if (!match) return null;
  const minute = Number(match[1].replace(",", "."));
  return Number.isFinite(minute) ? Math.max(0, minute) : null;
}

function phaseHeader(value: string): { readonly phase: TrainingPhaseKind; readonly title: string } | null {
  const phase = phaseFromText(value);
  if (!phase) return null;
  const title = value.replace(/\s+/g, " ").trim();
  return { phase, title: title || TRAINING_PHASE_LABELS[phase] };
}

function worksheetHasData(worksheet: ExcelJS.Worksheet): boolean {
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    let hasValue = false;
    worksheet.getRow(rowNumber).eachCell({ includeEmpty: false }, (cell) => {
      if (cell.value != null && String(cell.value).trim() !== "") hasValue = true;
    });
    if (hasValue) return true;
  }
  return false;
}

function copyStyle(source: ExcelJS.Cell, target: ExcelJS.Cell): void {
  target.style = { ...source.style };
  target.alignment = { ...source.alignment };
  target.border = { ...source.border };
  target.fill = { ...source.fill };
  target.font = { ...source.font };
}

export async function exportTrainingWorkbook(session: TrainingSessionDetail): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await excelJsCompatibleBytes(await readFile(TEMPLATE_PATH)) as never);
  const worksheet = workbook.getWorksheet("Trainingsvorlage") ?? workbook.worksheets[0] ?? workbook.addWorksheet("Trainingsvorlage");
  const templateRow = worksheet.getRow(2);
  const headerRow = worksheet.getRow(1);
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) worksheet.getRow(rowNumber).values = [];
  let nextRowNumber = 2;
  const appendRow = (values: readonly unknown[]): ExcelJS.Row => {
    const row = worksheet.getRow(nextRowNumber);
    row.values = values as ExcelJS.CellValue[];
    nextRowNumber += 1;
    return row;
  };
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.autoFilter = { from: "A1", to: "G1" };
  worksheet.columns = [
    { key: "time", width: 12 }, { key: "name", width: 30 }, { key: "purpose", width: 38 },
    { key: "instructions", width: 72 }, { key: "image", width: 28 }, { key: "arrangement", width: 30 }, { key: "material", width: 38 },
  ];
  HEADERS.forEach((header, index) => { headerRow.getCell(index + 1).value = header; });

  const totalMinutes = Math.max(1, session.totalDurationMinutes);
  let elapsed = 0;
  let lastPhase: TrainingPhaseKind | null = null;
  let lastMainPart = 0;
  for (const phase of session.phases) {
    const phaseRow = appendRow([null, TRAINING_PHASE_LABELS[phase.kind], null, null, null, null, null]);
    worksheet.mergeCells(`A${phaseRow.number}:G${phaseRow.number}`);
    phaseRow.height = 24;
    const phaseCell = phaseRow.getCell(1);
    phaseCell.value = TRAINING_PHASE_LABELS[phase.kind];
    phaseCell.font = { name: "Aptos", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
    phaseCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } };
    phaseCell.alignment = { vertical: "middle", horizontal: "left" };
    lastPhase = phase.kind;
    for (const item of phase.items) {
      if (phase.kind === "main" && (item.mainPartIndex ?? 1) !== lastMainPart) {
        lastMainPart = item.mainPartIndex ?? 1;
        const subRow = appendRow([null, item.mainPartTitle || `Hauptteil ${lastMainPart}`, null, null, null, null, null]);
        worksheet.mergeCells(`A${subRow.number}:G${subRow.number}`);
        subRow.height = 20;
        subRow.getCell(1).value = item.mainPartTitle || `Hauptteil ${lastMainPart}`;
        subRow.getCell(1).font = { name: "Aptos", size: 11, bold: true, color: { argb: "FF334155" } };
        subRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
      }
      const row = appendRow([
        `${elapsed}/${totalMinutes}`,
        item.exerciseName,
        [item.format ? `Format: ${item.format}` : "", item.levelLabel ? `Level: ${item.levelLabel}` : ""].filter(Boolean).join(" · "),
        item.instructions ?? "",
        null,
        phase.kind === "main" ? item.mainPartTitle || `Hauptteil ${item.mainPartIndex ?? 1}` : phase.title,
        item.format ? `Format: ${item.format}` : "",
      ]);
      row.height = 72;
      row.eachCell({ includeEmpty: true }, (cell, index) => {
        copyStyle(templateRow.getCell(index), cell);
        cell.alignment = { ...(cell.alignment ?? {}), vertical: "top", wrapText: true };
      });
      elapsed += Math.max(1, Math.round(item.durationMinutes));
    }
  }
  void lastPhase;
  workbook.creator = "OCRCraft";
  workbook.subject = "OCRCraft Trainingsplanung";
  workbook.title = session.title;
  return new Uint8Array(await workbook.xlsx.writeBuffer()).buffer as ArrayBuffer;
}

async function parseTrainingWorkbook(buffer: Uint8Array): Promise<{ readonly title: string; readonly rows: readonly ImportedRow[] }> {
  const workbook = new ExcelJS.Workbook();
  // ExcelJS ships a pre-Node-24 Buffer declaration; the runtime value is a
  // regular Node Buffer and is safe at this third-party boundary.
  await workbook.xlsx.load(await excelJsCompatibleBytes(buffer) as never);
  const preferredWorksheet = workbook.getWorksheet("Trainingsvorlage");
  const worksheet = preferredWorksheet && worksheetHasData(preferredWorksheet)
    ? preferredWorksheet
    : workbook.worksheets.find(worksheetHasData);
  if (!worksheet) throw new Error("Die Datei enthält kein Trainingsblatt.");
  const header = HEADERS.map((_, index) => cellText(worksheet.getRow(1), index + 1));
  if (header[0] !== HEADERS[0] || header[1] !== HEADERS[1] || header[3] !== HEADERS[3]) {
    throw new Error("Die Excel-Datei entspricht nicht der Trainingsplanung-Vorlage.");
  }

  const rows: ImportedRow[] = [];
  let phase: TrainingPhaseKind = "warmup";
  let mainPartIndex = 1;
  let mainPartTitle = "Hauptteil";
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const values = Array.from({ length: 7 }, (_, index) => cellText(row, index + 1));
    if (values.every((value) => !value)) continue;
    const combined = values.slice(0, 4).join(" ");
    const heading = phaseHeader(values[1]) ?? phaseHeader(combined);
    if (heading && (!values[0] || !values[3] || values[1].toLocaleLowerCase("de-DE").includes(heading.phase === "main" ? "hauptteil" : heading.phase === "cooldown" ? "cool" : "aufwärm"))) {
      phase = heading.phase;
      if (phase === "main") {
        const indexMatch = heading.title.match(/(?:hauptteil|part)\s*(\d+)/i);
        mainPartIndex = indexMatch ? Number(indexMatch[1]) : Math.max(1, mainPartIndex);
        mainPartTitle = heading.title;
      }
      continue;
    }
    if (!values[1]) continue;
    const itemMainPart = phase === "main" ? Math.max(1, Number(values[1].match(/(?:station|teil|part)\s*(\d+)/i)?.[1] ?? mainPartIndex)) : 0;
    if (phase === "main" && itemMainPart !== mainPartIndex) {
      mainPartIndex = itemMainPart;
      mainPartTitle = `Hauptteil ${mainPartIndex}`;
    }
    rows.push({ rowNumber, name: values[1], purpose: values[2], instructions: values[3], arrangement: values[5], material: values[6], startMinute: parseStartMinute(values[0]), phase, mainPartIndex, mainPartTitle });
  }
  if (!rows.length) throw new Error("Das Trainingsblatt enthält keine Übungszeilen.");
  return { title: workbook.title?.trim() || "Importiertes Training", rows };
}

function exerciseReference(item: Awaited<ReturnType<typeof listExercises>>[number]): ExerciseReference {
  return { id: item.id, name: item.name, riskLevel: item.riskLevel, bodyRegions: [], equipment: item.equipment, stationCapacity: 1, minimumAge: item.minAge, suitableForAudience: true };
}

export async function importTrainingWorkbook(buffer: Uint8Array, title?: string): Promise<ImportedTrainingResult> {
  const parsed = await parseTrainingWorkbook(buffer);
  const uniqueNames = [...new Set(parsed.rows.map((row) => row.name.toLocaleLowerCase("de-DE")))];
  const matches = new Map<string, Awaited<ReturnType<typeof listExercises>>[number]>();
  for (const name of uniqueNames) {
    const original = parsed.rows.find((row) => row.name.toLocaleLowerCase("de-DE") === name)?.name ?? name;
    const candidates = await listExercises({ query: original, locale: "de", limit: 40 });
    const exact = candidates.find((candidate) => candidate.name.toLocaleLowerCase("de-DE") === name);
    if (exact) matches.set(name, exact);
  }
  const missing = parsed.rows.filter((row) => !matches.has(row.name.toLocaleLowerCase("de-DE")));
  if (missing.length) {
    const examples = [...new Set(missing.map((row) => `${row.name} (Zeile ${row.rowNumber})`))].slice(0, 8);
    throw new Error(`Übungen nicht im OCRCraft-Katalog gefunden: ${examples.join(", ")}${missing.length > examples.length ? " …" : ""}`);
  }

  const phaseRows = new Map<TrainingPhaseKind, ImportedRow[]>();
  for (const row of parsed.rows) phaseRows.set(row.phase, [...(phaseRows.get(row.phase) ?? []), row]);
  for (const required of ["warmup", "main", "cooldown"] as const) if (!phaseRows.has(required)) throw new Error(`Pflichtabschnitt fehlt: ${TRAINING_PHASE_LABELS[required]}.`);
  const totalMinutes = parsed.rows.reduce((sum, row, index) => {
    const next = parsed.rows[index + 1]?.startMinute;
    if (row.startMinute != null && next != null && next > row.startMinute) return sum + Math.min(240, Math.max(1, Math.round(next - row.startMinute)));
    return sum + 1;
  }, 0);
  const sessionId = randomUUID();
  const phases = (["warmup", "main", "cooldown"] as const).map((kind) => ({
    id: randomUUID(), kind, title: TRAINING_PHASE_LABELS[kind], sortOrder: kind === "warmup" ? 0 : kind === "main" ? 1 : 2,
    items: (phaseRows.get(kind) ?? []).map((row, index) => ({
      id: randomUUID(), exercise: exerciseReference(matches.get(row.name.toLocaleLowerCase("de-DE"))!), durationMinutes: row.startMinute != null ? Math.max(1, Math.round((parsed.rows.find((candidate) => candidate.startMinute != null && candidate.startMinute > row.startMinute!)?.startMinute ?? row.startMinute + 1) - row.startMinute)) : 1,
      format: row.material.match(/^Format:\s*(\S+)/i)?.[1] as TrainingSession["phases"][number]["items"][number]["format"] ?? undefined,
      instructions: row.instructions || row.purpose || undefined, levelLabel: undefined, mainPartIndex: kind === "main" ? row.mainPartIndex : undefined, mainPartTitle: kind === "main" ? row.mainPartTitle : undefined,
    })),
  }));
  const session: TrainingSession = { id: sessionId, title: title?.trim() || parsed.title, group: { id: "imported", name: "Importierte Gruppe", audience: "adults", participantCount: 1 }, totalDurationMinutes: totalMinutes, focus: [], phases };
  const validationIssues = validateTrainingSession(session);
  const blocking = validationIssues.filter((issue: TrainingValidationIssue) => issue.severity === "error");
  if (blocking.length) throw new Error(`Importierte Einheit ist fachlich nicht speicherbar: ${blocking.map((issue) => issue.message).join(" ")}`);
  const draft: TrainingDraft = { source: "deterministic", session, validationIssues, warnings: validationIssues.filter((issue) => issue.severity === "warning").map((issue) => issue.message) };
  const persistedId = await persistTrainingDraft(draft, { title: session.title, source: "manual", notes: "Excel-Import aus Trainingsplanung-Vorlage" });
  return { sessionId: persistedId, matchedExercises: matches.size, phaseCount: phases.length };
}
