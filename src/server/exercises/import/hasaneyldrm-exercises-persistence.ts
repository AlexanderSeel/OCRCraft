import "server-only";

import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import type { DuckDBConnection } from "@duckdb/node-api";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import { adaptHasaneyldrmExercises, type ExerciseImportDraft, type HasaneyldrmExercise } from "./hasaneyldrm-exercises-adapter";

export interface HasaneyldrmImportResult {
  readonly imported: number;
  readonly skipped: number;
  readonly sourceIds: readonly string[];
}

const bodyRegionAliases: Readonly<Record<string, string>> = {
  "upper arms": "upper-arms", "lower arms": "forearms-grip", "upper legs": "quadriceps",
  "lower legs": "calves", back: "upper-back", waist: "core", chest: "chest",
  shoulders: "shoulders", neck: "neck", cardio: "full-body", "hip flexors": "hips",
  glutes: "glutes", hamstrings: "hamstrings", quadriceps: "quadriceps", abs: "abs",
  abdominals: "abs", biceps: "biceps", triceps: "triceps", calves: "calves",
  forearms: "forearms-grip", lats: "lats", "lower back": "lower-back",
};

const categoryMap: Readonly<Record<string, string>> = {
  cardio: "running", mobility: "mobility", stretching: "cooldown", warmup: "warmup",
};

function slug(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function textList(value: string | string[]): string[] {
  return (Array.isArray(value) ? value : value.split(/[,;|]/)).map((item) => item.trim().toLowerCase()).filter(Boolean);
}

function externalMediaUrl(value: string | undefined): string | null {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/${value.replace(/^\/+/, "")}`;
}

async function ensureExternalMedia(connection: DuckDBConnection, exerciseId: string, draft: ExerciseImportDraft): Promise<void> {
  const imageUrl = externalMediaUrl(draft.mediaReference.image);
  if (!imageUrl) return;
  const existing = await connection.runAndReadAll("SELECT 1 FROM exercise_media_assets WHERE exercise_id=$id AND source_type='external_reference' LIMIT 1", { id: exerciseId });
  if (existing.getRows().length) return;
  await connection.run(`INSERT INTO exercise_media_assets (exercise_id,media_type,source_type,provider,illustration_format,review_status,generation_status,storage_provider,storage_key,storage_uri,content_type,width,height,sha256,generated_at,license_label,source_reference,usage_note) VALUES ($id,'image','external_reference','gym-visual','legacy_triptych','pending','generated','s3',$key,$uri,'image/jpeg',180,180,$sha,current_timestamp,$license,$source,$usage)`, { id: exerciseId, key: `external/hasaneyldrm/${draft.sourceRecordId}.jpg`, uri: imageUrl, sha: createHash("sha256").update(imageUrl).digest("hex"), license: draft.mediaReference.licenseLabel, source: draft.sourceReference, usage: "Vorlage für spätere KI-Ersetzung; Gym-Visual-Lizenz beachten." });
}

function mappedRegions(record: HasaneyldrmExercise, draft: ExerciseImportDraft): string[] {
  const values = [record.body_part, record.muscle_group, record.target, ...textList(record.secondary_muscles)];
  const mapped = values.map((value) => bodyRegionAliases[value] ?? (value.includes("glute") ? "glutes" : value.includes("quad") ? "quadriceps" : value.includes("hamstring") ? "hamstrings" : undefined)).filter((value): value is string => Boolean(value));
  return [...new Set([...draft.bodyRegionIds, ...mapped])];
}

function detailText(locale: "de" | "en", draft: ExerciseImportDraft, step: string): Record<string, string | number> {
  const pending = locale === "de" ? "Deutsche Übersetzung ausstehend. " : "";
  const prefix = locale === "de" ? "[Übersetzung erforderlich] " : "";
  return {
    purpose: `${pending}${prefix}Imported exercise from the reviewed external dataset.`,
    setup: `${pending}${prefix}Check the equipment, clear the training area and follow the original English instructions.`,
    startPosition: `${pending}${prefix}Use a stable, pain-free starting position appropriate for the exercise.`,
    finishReset: `${pending}${prefix}Return under control and reset the equipment.`,
    breathingCue: `${pending}${prefix}Breathe steadily and do not hold your breath.`,
    tempoCue: `${pending}${prefix}Move with control and stop if technique breaks down.`,
    safetyNotes: `${pending}${prefix}Stop for pain, dizziness or loss of control and ask the trainer for a regression.`,
    qualityCriteria: `${pending}${prefix}The movement stays controlled through a pain-free range.`,
    beginnerPrescription: locale === "de" ? "Übersetzung ausstehend: 2 Runden mit 6–8 Wiederholungen." : "2 rounds of 6–8 controlled repetitions.",
    standardPrescription: locale === "de" ? "Übersetzung ausstehend: 3 Runden mit 8–12 Wiederholungen." : "3 rounds of 8–12 controlled repetitions.",
    advancedPrescription: locale === "de" ? "Übersetzung ausstehend: 3–4 Runden mit 10–15 Wiederholungen." : "3–4 rounds of 10–15 controlled repetitions.",
    workRestGuidance: locale === "de" ? "Übersetzung ausstehend: 30–60 Sekunden Pause." : "Rest 30–60 seconds and recover fully for technical work.",
    level1: locale === "de" ? "Übersetzung ausstehend: Bewegungsweg verkürzen oder Last reduzieren." : "Shorten the range of motion or reduce the load.",
    level2: locale === "de" ? "Übersetzung ausstehend: Standardausführung kontrolliert ausführen." : "Perform the standard version with control.",
    level3: locale === "de" ? "Übersetzung ausstehend: Nur eine Schwierigkeit zugleich steigern." : "Increase only one challenge at a time.",
    childYouthVariant: locale === "de" ? "Übersetzung ausstehend: Leichte Variante mit direkter Trainererklärung." : "Use a light variant with direct trainer instruction.",
    prerequisites: locale === "de" ? "Übersetzung ausstehend: Grundbewegung schmerzfrei beherrschen." : "Perform the basic movement without pain.",
    fallbackExercise: locale === "de" ? "Übersetzung ausstehend: Kontrollierte Variante ohne zusätzliches Gewicht." : "Use a controlled bodyweight variation if equipment is unavailable.",
    difficulty: "beginner", supervision: "normal", spaceRequirement: "medium", setupSeconds: 60, transitionSeconds: 30, stationCapacity: 4,
    step,
  };
}

async function persistDraft(connection: DuckDBConnection, record: HasaneyldrmExercise, draft: ExerciseImportDraft): Promise<"imported" | "skipped"> {
  const sourceUrl = draft.sourceReference;
  const existing = await connection.runAndReadAll("SELECT exercise_id FROM exercise_source_references WHERE source_url=$sourceUrl LIMIT 1", { sourceUrl });
  if (existing.getRows()[0]?.[0]) {
    await ensureExternalMedia(connection, String(existing.getRows()[0][0]), draft);
    return "skipped";
  }

  const category = categoryMap[record.category.toLowerCase()] ?? "strength";
  const exercise = await connection.runAndReadAll(`
    INSERT INTO exercises (canonical_name,category,default_phase,risk_level,indoor,outdoor,archived,min_age,exercise_type,difficulty,impact_level,coordination_complexity,space_requirement,setup_seconds,transition_seconds,station_capacity,suitable_for_kids,suitable_for_youth,suitable_for_adults)
    VALUES ($name,$category,'main','low',true,true,false,NULL,'strength','beginner','low','simple','medium',60,30,4,true,true,true)
    RETURNING id::VARCHAR
  `, { name: draft.nameEn, category });
  const exerciseId = String(exercise.getRows()[0][0]);
  const deName = draft.nameEn;
  const enSummary = draft.summaryEn;
  const deSummary = `Deutsche Übersetzung ausstehend. ${draft.summaryEn}`;
  await connection.run("INSERT INTO exercise_translations (exercise_id,locale,name,summary,instructions) VALUES ($id,'en',$name,$summary,$summary),($id,'de',$deName,$deSummary,$deSummary)", { id: exerciseId, name: draft.nameEn, summary: enSummary, deName, deSummary });
  await connection.run("INSERT INTO exercise_aliases VALUES ($id,'en',$name),($id,'de',$name)", { id: exerciseId, name: draft.nameEn });

  const details = [
    ["en", detailText("en", draft, draft.executionStepsEn.join(" "))],
    ["de", detailText("de", draft, draft.executionStepsEn.map((step) => `[Übersetzung erforderlich] ${step}`).join(" "))],
  ] as const;
  for (const [locale, item] of details) {
    const parameters = {
      id: exerciseId, locale, purpose: item.purpose, setup: item.setup, startPosition: item.startPosition,
      finishReset: item.finishReset, breathingCue: item.breathingCue, tempoCue: item.tempoCue,
      safetyNotes: item.safetyNotes, qualityCriteria: item.qualityCriteria,
      beginnerPrescription: item.beginnerPrescription, standardPrescription: item.standardPrescription,
      advancedPrescription: item.advancedPrescription, workRestGuidance: item.workRestGuidance,
      level1: item.level1, level2: item.level2, level3: item.level3, childYouthVariant: item.childYouthVariant,
      prerequisites: item.prerequisites, fallbackExercise: item.fallbackExercise, difficulty: item.difficulty,
      supervision: item.supervision, spaceRequirement: item.spaceRequirement, setupSeconds: item.setupSeconds,
      transitionSeconds: item.transitionSeconds, stationCapacity: item.stationCapacity,
    };
    await connection.run(`INSERT INTO exercise_details (exercise_id,locale,purpose,setup,start_position,finish_reset,breathing_cue,tempo_cue,safety_notes,quality_criteria,beginner_prescription,standard_prescription,advanced_prescription,work_rest_guidance,level_1,level_2,level_3,child_youth_variant,prerequisites,fallback_exercise,difficulty,supervision,space_requirement,setup_seconds,transition_seconds,station_capacity) VALUES ($id,$locale,$purpose,$setup,$startPosition,$finishReset,$breathingCue,$tempoCue,$safetyNotes,$qualityCriteria,$beginnerPrescription,$standardPrescription,$advancedPrescription,$workRestGuidance,$level1,$level2,$level3,$childYouthVariant,$prerequisites,$fallbackExercise,$difficulty,$supervision,$spaceRequirement,$setupSeconds,$transitionSeconds,$stationCapacity)`, parameters);
  }
  for (const locale of ["en", "de"] as const) {
    const steps = locale === "en" ? draft.executionStepsEn : draft.executionStepsEn.map((step) => `[Übersetzung erforderlich] ${step}`);
    for (const [index, instruction] of steps.entries()) await connection.run("INSERT INTO exercise_execution_steps VALUES ($id,$locale,$order,$instruction)", { id: exerciseId, locale, order: index + 1, instruction });
    const cues = [
      locale === "de" ? "Übersetzung ausstehend: ruhig und kontrolliert bewegen." : "Move calmly and under control.",
      locale === "de" ? "Übersetzung ausstehend: Atmung weiterführen." : "Keep breathing.",
    ];
    for (const [index, cue] of cues.entries()) await connection.run("INSERT INTO exercise_coaching_cues VALUES ($id,$locale,$order,$cue)", { id: exerciseId, locale, order: index + 1, cue });
    await connection.run("INSERT INTO exercise_common_mistakes VALUES ($id,$locale,1,$mistake,$correction)", { id: exerciseId, locale, mistake: locale === "de" ? "Übersetzung ausstehend: zu schnell oder mit Schwung." : "Moving too quickly or using momentum.", correction: locale === "de" ? "Tempo reduzieren und Bewegungsweg kontrollieren." : "Slow down and control the range of motion." });
  }

  for (const region of mappedRegions(record, draft)) {
    const exists = await connection.runAndReadAll("SELECT 1 FROM body_regions WHERE id=$region", { region });
    if (exists.getRows().length) await connection.run("INSERT OR IGNORE INTO exercise_body_regions VALUES ($id,$region,'primary')", { id: exerciseId, region });
  }
  for (const equipmentName of draft.equipmentSeedKeys) {
    const key = `external-${slug(equipmentName)}`;
    await connection.run("INSERT OR IGNORE INTO equipment (seed_key,name_de,name_en) VALUES ($key,$de,$en)", { key, de: equipmentName, en: equipmentName });
    const equipment = await connection.runAndReadAll("SELECT id::VARCHAR FROM equipment WHERE seed_key=$key", { key });
    if (equipment.getRows()[0]?.[0]) await connection.run("INSERT OR IGNORE INTO exercise_equipment VALUES ($id,$equipment,1)", { id: exerciseId, equipment: String(equipment.getRows()[0][0]) });
  }
  await connection.run("INSERT INTO exercise_source_references (exercise_id,provider,title,source_url,source_type,license_label,notes) VALUES ($id,$provider,$title,$sourceUrl,'dataset',$license,$notes)", { id: exerciseId, provider: draft.sourceMetadata.provider, title: draft.sourceMetadata.title, sourceUrl, license: draft.mediaReference.licenseLabel, notes: `source_record_id=${draft.sourceRecordId}; media_usage=${draft.mediaReference.usage}; image=${draft.mediaReference.image ?? ""}; gif=${draft.mediaReference.gif ?? ""}` });
  await ensureExternalMedia(connection, exerciseId, draft);
  for (const locale of ["de", "en"] as const) await connection.run(`INSERT OR REPLACE INTO search_documents_${locale} (document_id,entity_type,entity_id,title,aliases,summary,tags,body_regions,equipment,instructions) VALUES ($documentId,'exercise',$id,$title,$title,$summary,'external-import',$regions,$equipment,$instructions)`, { documentId: `exercise:${exerciseId}`, id: exerciseId, title: locale === "de" ? deName : draft.nameEn, summary: locale === "de" ? deSummary : enSummary, regions: draft.bodyRegionIds.join(" "), equipment: draft.equipmentSeedKeys.join(" "), instructions: draft.executionStepsEn.join(" ") });
  await connection.run("UPDATE search_index_state SET status='dirty',last_error=NULL WHERE locale IN ('de','en')");
  return "imported";
}

export async function importHasaneyldrmExercises(input: unknown, limit?: number, skipReady = false): Promise<HasaneyldrmImportResult> {
  if (!skipReady) await ensureDatabaseReady();
  const records = adaptHasaneyldrmExercises(input).slice(0, limit ?? Number.POSITIVE_INFINITY);
  const rawRecords = Array.isArray(input) ? input.slice(0, limit ?? Number.POSITIVE_INFINITY) as HasaneyldrmExercise[] : [];
  const result: { imported: number; skipped: number; sourceIds: string[] } = { imported: 0, skipped: 0, sourceIds: [] };
  const chunkSize = 25;
  for (let offset = 0; offset < records.length; offset += chunkSize) {
    const draftChunk = records.slice(offset, offset + chunkSize);
    const rawChunk = rawRecords.slice(offset, offset + chunkSize);
    const chunkResult = await withDuckDbConnection(async (connection) => {
      await connection.run("BEGIN TRANSACTION");
      try {
        let imported = 0; let skipped = 0; const sourceIds: string[] = [];
        for (const [index, draft] of draftChunk.entries()) {
          const persisted = await persistDraft(connection, rawChunk[index], draft);
          if (persisted === "imported") imported += 1; else skipped += 1;
          sourceIds.push(draft.sourceRecordId);
        }
        await connection.run("COMMIT");
        return { imported, skipped, sourceIds };
      } catch (error) { await connection.run("ROLLBACK"); throw error; }
    });
    result.imported += chunkResult.imported;
    result.skipped += chunkResult.skipped;
    result.sourceIds.push(...chunkResult.sourceIds);
  }
  return result;
}

/** Imports the checked-in metadata catalogue after migrations on a fresh DB. */
export async function seedBundledHasaneyldrmExercises(): Promise<HasaneyldrmImportResult | null> {
  if (process.env.OCRCRAFT_AUTO_IMPORT_EXTERNAL_EXERCISES === "false") return null;
  try {
    const file = await readFile(path.join(process.cwd(), "data", "hasaneyldrm-exercises.json"), "utf8");
    return importHasaneyldrmExercises(JSON.parse(file) as unknown, undefined, true);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}
