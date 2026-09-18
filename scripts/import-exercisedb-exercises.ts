import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { importHasaneyldrmExercises } from "../src/server/exercises/import/hasaneyldrm-exercises-persistence";
import { refreshDuplicateReviewTasks } from "../src/server/exercises/duplicate-review-service";

interface ExerciseDbRecord { exerciseId: string; name: string; gifUrl?: string; bodyParts?: string[]; equipments?: string[]; targetMuscles?: string[]; secondaryMuscles?: string[]; instructions?: string[]; }

async function fetchAll(): Promise<ExerciseDbRecord[]> {
  const result: ExerciseDbRecord[] = []; let after: string | undefined;
  do {
    const url = new URL("https://oss.exercisedb.dev/api/v1/exercises"); url.searchParams.set("limit", "25"); if (after) url.searchParams.set("after", after);
    let response: Response | undefined;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      response = await fetch(url);
      if (response.status !== 429) break;
      const retryAfter = Number(response.headers.get("retry-after") ?? "5");
      const waitMs = Math.max(2_000, Math.min(30_000, retryAfter * 1_000 * (attempt + 1)));
      console.log(`ExerciseDB Rate Limit, warte ${Math.round(waitMs / 1000)}s ...`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
    if (!response?.ok) throw new Error(`ExerciseDB HTTP ${response?.status ?? "unknown"}`);
    const payload = await response.json() as { data?: ExerciseDbRecord[]; meta?: { hasNextPage?: boolean; nextCursor?: string } };
    result.push(...(payload.data ?? [])); after = payload.meta?.hasNextPage ? payload.meta.nextCursor : undefined;
    console.log(`ExerciseDB geladen: ${result.length}`);
  } while (after);
  return result;
}

function toImportRecord(record: ExerciseDbRecord) {
  const steps = (record.instructions ?? []).map((step) => step.replace(/^Step:\s*\d+\s*/i, "").trim()).filter(Boolean);
  const verifiedLicenseLabel = process.env.OCRCRAFT_EXERCISEDB_LICENSE_LABEL?.trim() || undefined;
  const licenseVerified = Boolean(verifiedLicenseLabel) && process.env.OCRCRAFT_EXERCISEDB_LICENSE_VERIFIED === "1";
  return { id: record.exerciseId, name: record.name, category: (record.bodyParts?.[0] ?? "strength").toLowerCase(), body_part: (record.bodyParts?.[0] ?? ""), equipment: (record.equipments ?? []).join(","), target: (record.targetMuscles ?? []).join(","), secondary_muscles: record.secondaryMuscles ?? [], instruction_steps: { en: steps }, instructions: { en: steps.join(" ") }, gif_url: record.gifUrl, source_provider: "exercisedb.dev", source_url: `https://oss.exercisedb.dev/docs#${record.exerciseId}`, license_label: verifiedLicenseLabel, license_verified: licenseVerified };
}

async function main() {
  if (!process.env.OCRCRAFT_EXERCISEDB_LICENSE_LABEL?.trim() || process.env.OCRCRAFT_EXERCISEDB_LICENSE_VERIFIED !== "1") {
    console.warn("Keine ausdrücklich verifizierte ExerciseDB-Lizenz konfiguriert: externe Instruktionstexte und Medien werden nur als Quelle referenziert und nicht übernommen.");
  }
  const cachePath = path.join(process.cwd(), "data", "exercisedb-exercises.json");
  let records: ExerciseDbRecord[];
  if (process.argv.includes("--refresh") || process.env.OCRCRAFT_EXERCISEDB_USE_CACHE !== "1") {
    records = await fetchAll();
    await writeFile(cachePath, JSON.stringify(records, null, 2));
  } else {
    records = JSON.parse(await readFile(cachePath, "utf8")) as ExerciseDbRecord[];
  }
  const result = await importHasaneyldrmExercises(records.map(toImportRecord));
  const duplicateTasks = await refreshDuplicateReviewTasks();
  console.log(JSON.stringify({ fetched: records.length, ...result, duplicateTasks }));
}

main().catch((error) => { console.error("ExerciseDB import failed:", error); process.exitCode = 1; });
