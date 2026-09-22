import "server-only";

import { importHasaneyldrmExercises, type HasaneyldrmImportResult } from "./hasaneyldrm-exercises-persistence";
import { resolveExternalImportSource, recordExternalImportResult, type ExternalImportProvider } from "./external-import-source-repository";
import { createAiJsonFallbackClient } from "@/server/ai/ai-json-provider";
import { resolveAiProviderChain } from "@/server/ai/ai-provider-settings-repository";

interface ExerciseDbRecord {
  readonly exerciseId?: string;
  readonly id?: string;
  readonly name?: string;
  readonly bodyPart?: string;
  readonly equipment?: string;
  readonly target?: string;
  readonly secondaryMuscles?: readonly string[];
  readonly instructions?: readonly string[];
  readonly gifUrl?: string;
  readonly imageUrl?: string;
}

function toHasaneyldrmRecord(record: ExerciseDbRecord): Record<string, unknown> {
  const instructions = Array.isArray(record.instructions) ? record.instructions.filter(Boolean) : [];
  return {
    id: record.exerciseId ?? record.id ?? record.name,
    name: record.name ?? "Imported Exercise",
    category: record.bodyPart ?? "",
    body_part: record.bodyPart ?? "",
    equipment: record.equipment ?? "body weight",
    target: record.target ?? "",
    secondary_muscles: record.secondaryMuscles ?? [],
    instructions: { en: instructions.join(" ") },
    instruction_steps: { en: instructions },
    image: record.imageUrl,
    gif_url: record.gifUrl,
    source_provider: "exercisedb.dev",
    source_url: `https://exercisedb.dev/exercise/${record.exerciseId ?? record.id ?? "unknown"}`,
    license_label: "ExerciseDB / AscendAPI source reference; rights not verified",
    license_verified: false,
  };
}

async function fetchJson(url: string, headers: Record<string, string>): Promise<unknown> {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(60_000), cache: "no-store" });
  if (!response.ok) throw new Error(`Importquelle antwortete mit HTTP ${response.status}.`);
  return response.json() as Promise<unknown>;
}

async function fetchExerciseDb(baseUrl: string, apiKey: string | undefined, limit: number): Promise<unknown[]> {
  const headers: Record<string, string> = { accept: "application/json" };
  if (apiKey) {
    headers["x-rapidapi-key"] = apiKey;
    headers["x-rapidapi-host"] = new URL(baseUrl).host;
  }
  const payload = await fetchJson(`${baseUrl.replace(/\/$/, "")}/api/v1/exercises?page=1&limit=${Math.min(limit, 200)}`, headers);
  const records = Array.isArray(payload) ? payload : (payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown[] }).data) ? (payload as { data: unknown[] }).data : []);
  return records.map((record) => toHasaneyldrmRecord(record as ExerciseDbRecord));
}

export async function importExternalExercises(input: {
  readonly provider: ExternalImportProvider;
  readonly limit: number;
  readonly autoTranslate?: boolean;
}): Promise<HasaneyldrmImportResult> {
  const source = await resolveExternalImportSource(input.provider);
  if (!source.enabled) throw new Error("Diese Importquelle ist deaktiviert.");
  const limit = Math.max(1, Math.min(200, Math.trunc(input.limit)));
  let raw = input.provider === "exercisedb"
    ? await fetchExerciseDb(source.baseUrl, source.apiKey, limit)
    : await fetchJson(source.baseUrl, { accept: "application/json" }) as unknown[];
  raw = raw.slice(0, limit).map((record) => input.provider === "hasaneyldrm" && record && typeof record === "object"
    ? {
      ...(record as Record<string, unknown>),
      source_provider: "hasaneyldrm/exercises-dataset",
      source_url: `https://github.com/hasaneyldrm/exercises-dataset/blob/main/data/exercises.json#${String((record as { id?: unknown }).id ?? "")}`,
      license_label: "MIT for dataset metadata; Gym visual media attribution retained",
      license_verified: true,
    }
    : record);
  if (input.autoTranslate) raw = await translateMissingGerman(raw);
  const result = await importHasaneyldrmExercises(raw, limit);
  await recordExternalImportResult(input.provider, `imported=${result.imported}; skipped=${result.skipped}; requested=${limit}`);
  return result;
}

export async function testExternalImportSource(provider: ExternalImportProvider): Promise<{ readonly recordsAvailable: number; readonly sampleName: string }> {
  const source = await resolveExternalImportSource(provider);
  if (!source.enabled) throw new Error("Diese Importquelle ist deaktiviert.");
  const raw = provider === "exercisedb"
    ? await fetchExerciseDb(source.baseUrl, source.apiKey, 1)
    : await fetchJson(source.baseUrl, { accept: "application/json" }) as unknown[];
  const records = Array.isArray(raw) ? raw : [];
  const first = records[0] as { name?: unknown } | undefined;
  if (records.length === 0) throw new Error("Die Quelle hat keine verwertbaren Übungsdatensätze geliefert.");
  return { recordsAvailable: records.length, sampleName: String(first?.name ?? "unbenannter Datensatz") };
}

export async function previewExternalImportSource(provider: ExternalImportProvider, limit: number): Promise<{
  readonly recordsAvailable: number;
  readonly sampleNames: readonly string[];
  readonly instructionLanguages: readonly string[];
  readonly hasMediaReferences: number;
}> {
  const source = await resolveExternalImportSource(provider);
  if (!source.enabled) throw new Error("Diese Importquelle ist deaktiviert.");
  const requested = Math.max(1, Math.min(200, Math.trunc(limit)));
  const raw = provider === "exercisedb"
    ? await fetchExerciseDb(source.baseUrl, source.apiKey, requested)
    : await fetchJson(source.baseUrl, { accept: "application/json" }) as unknown[];
  const records = (Array.isArray(raw) ? raw : []).slice(0, requested) as Record<string, unknown>[];
  const languages = new Set<string>();
  let media = 0;
  for (const record of records) {
    const instructions = record.instructions;
    if (instructions && typeof instructions === "object") for (const locale of Object.keys(instructions as object)) languages.add(locale);
    if (record.image || record.imageUrl || record.gif_url || record.gifUrl || record.video_url) media += 1;
  }
  return {
    recordsAvailable: records.length,
    sampleNames: records.slice(0, 5).map((record) => String(record.name ?? "unbenannter Datensatz")),
    instructionLanguages: [...languages].sort(),
    hasMediaReferences: media,
  };
}

async function translateMissingGerman(records: readonly unknown[]): Promise<unknown[]> {
  const configs = await resolveAiProviderChain("exercise_draft");
  if (configs.length === 0) throw new Error("Für automatische Übersetzungen ist kein Text-AI-Provider konfiguriert.");
  const client = createAiJsonFallbackClient(configs, "exercise_draft");
  const translated: unknown[] = [];
  for (const record of records) {
    const item = record as Record<string, unknown>;
    const instructions = item.instructions as Record<string, unknown> | undefined;
    const steps = item.instruction_steps as Record<string, unknown> | undefined;
    if (typeof instructions?.de === "string" && Array.isArray(steps?.de)) {
      translated.push(record);
      continue;
    }
    const sourceTextVerified = item.license_verified === true;
    const result = await client.generateJson(
      "Translate the exercise name and instructions into natural German for a trainer. Return only JSON with nameDe, summaryDe and stepsDe (an array of at least 3 strings). Keep exercise names concise and do not add safety claims not present in the source.",
      sourceTextVerified
        ? { name: item.name, summary: instructions?.en ?? "", steps: steps?.en ?? [] }
        : { name: item.name, category: item.category, bodyPart: item.body_part, equipment: item.equipment, target: item.target },
    );
    const parsed = result as { nameDe?: unknown; summaryDe?: unknown; stepsDe?: unknown };
    const nameDe = typeof parsed.nameDe === "string" ? parsed.nameDe.trim() : String(item.name ?? "");
    const summaryDe = typeof parsed.summaryDe === "string" ? parsed.summaryDe.trim() : String(instructions?.en ?? "");
    const stepsDe = Array.isArray(parsed.stepsDe) ? parsed.stepsDe.filter((value): value is string => typeof value === "string" && value.trim().length > 0) : [];
    translated.push({ ...item, name_de: nameDe, summary_de: summaryDe, instructions: { ...(instructions ?? {}), de: summaryDe }, instruction_steps: { ...(steps ?? {}), de: stepsDe.length >= 3 ? stepsDe : [summaryDe, "Bewege dich kontrolliert.", "Kehre kontrolliert zurück."] } });
  }
  return translated;
}
