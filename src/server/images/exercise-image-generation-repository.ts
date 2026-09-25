import "server-only";

import { z } from "zod";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import type {
  CompleteExerciseImageGenerationRecord,
  CreateExerciseImageGenerationRecord,
  ExerciseImageGenerationContext,
  ExerciseImageGenerationRepositoryPort,
  ExerciseImageLocale,
} from "./exercise-image-types";
import { normalizeImageExecutionSteps } from "./exercise-image-generation-core";
export { normalizeImageExecutionSteps } from "./exercise-image-generation-core";

const contextSchema = z.object({
  exerciseId: z.string().uuid(),
  seedKey: z.string().nullable(),
  category: z.string().min(1),
  exerciseType: z.string().min(1),
  difficulty: z.string().min(1),
  riskLevel: z.string().min(1),
  minimumAge: z.number().int().nullable(),
  impactLevel: z.string().min(1),
  coordinationComplexity: z.string().min(1),
  spaceRequirement: z.string().min(1),
  supervision: z.string().min(1),
  suitableIndoors: z.boolean(),
  suitableOutdoors: z.boolean(),
  bodyRegions: z.array(z.object({ emphasis: z.string(), labelDe: z.string(), labelEn: z.string() })),
  movementPatterns: z.array(z.object({ labelDe: z.string(), labelEn: z.string() })),
  equipment: z.array(z.object({ nameDe: z.string(), nameEn: z.string(), quantity: z.number().int() })),
  localized: z.object({
    de: z.object({
      name: z.string().min(1), summary: z.string(), purpose: z.string(), setup: z.string(), startPosition: z.string(),
      finishReset: z.string(), breathingCue: z.string(), tempoCue: z.string(), safetyNotes: z.string(), qualityCriteria: z.string(),
      prerequisites: z.string(), fallbackExercise: z.string(), executionSteps: z.array(z.string().min(1)).min(3).max(7), coachingCues: z.array(z.string()),
      commonMistakes: z.array(z.object({ mistake: z.string(), correction: z.string() })), specializedGuidance: z.array(z.string()),
    }),
    en: z.object({
      name: z.string().min(1), summary: z.string(), purpose: z.string(), setup: z.string(), startPosition: z.string(),
      finishReset: z.string(), breathingCue: z.string(), tempoCue: z.string(), safetyNotes: z.string(), qualityCriteria: z.string(),
      prerequisites: z.string(), fallbackExercise: z.string(), executionSteps: z.array(z.string().min(1)).min(3).max(7), coachingCues: z.array(z.string()),
      commonMistakes: z.array(z.object({ mistake: z.string(), correction: z.string() })), specializedGuidance: z.array(z.string()),
    }),
  }),
});

let exerciseImageWriteQueue: Promise<void> = Promise.resolve();

function serializeExerciseImageWrite<T>(operation: () => Promise<T>): Promise<T> {
  const result = exerciseImageWriteQueue.then(operation);
  exerciseImageWriteQueue = result.then(() => undefined, () => undefined);
  return result;
}

export class ExerciseImageGenerationRepository implements ExerciseImageGenerationRepositoryPort {
  async markAbandonedGenerationsFailed(): Promise<number> {
    await ensureDatabaseReady();
    return serializeExerciseImageWrite(() => withDuckDbConnection(async (connection) => {
      const reader = await connection.runAndReadAll(`
        UPDATE exercise_media_assets
        SET generation_status='failed', error_message='Generation process ended before the image was completed; safe to retry.',
          updated_at=current_timestamp
        WHERE generation_status='generating'
        RETURNING id
      `);
      return reader.getRows().length;
    }));
  }

  async listSeedExercisesMissingImage(
    includeSeedKeys: readonly string[] = [],
  ): Promise<readonly { readonly exerciseId: string; readonly seedKey: string }[]> {
    await ensureDatabaseReady();

    return withDuckDbConnection(async (connection) => {
      const seedKeys = [...new Set(includeSeedKeys.map((value) => value.trim()).filter(Boolean))];
      const parameters: Record<string, string> = {};
      const seedKeyClause = seedKeys.length
        ? seedKeys.map((seedKey, index) => {
          const parameterName = `seedKey${index}`;
          parameters[parameterName] = seedKey;
          return `$${parameterName}`;
        }).join(",")
        : "";
      const reader = await connection.runAndReadAll(`
        SELECT e.id::VARCHAR, e.seed_key
        FROM exercises e
        WHERE e.archived=false AND e.seed_key IS NOT NULL
          AND (
            NOT EXISTS (
              SELECT 1 FROM exercise_media_assets m
              WHERE m.exercise_id=e.id AND m.generation_status='generated'
            )
            ${seedKeyClause ? `OR (
              e.seed_key IN (${seedKeyClause})
              AND NOT EXISTS (
                SELECT 1 FROM exercise_media_assets approved_media
                WHERE approved_media.exercise_id=e.id
                  AND approved_media.generation_status='generated'
                  AND approved_media.review_status='approved'
              )
            )` : ""}
          )
        ORDER BY e.seed_key
      `, parameters);
      return reader.getRows().map((row) => ({ exerciseId: String(row[0]), seedKey: String(row[1]) }));
    });
  }

  async getContext(identifier: string): Promise<ExerciseImageGenerationContext> {
    await ensureDatabaseReady();

    return withDuckDbConnection(async (connection) => {
      const exerciseReader = await connection.runAndReadAll(`
        SELECT id::VARCHAR, seed_key, category, exercise_type, difficulty, risk_level, min_age,
          impact_level, coordination_complexity, space_requirement, supervision,
          indoor_suitable, outdoor_suitable
        FROM exercises
        WHERE archived=false AND (id::VARCHAR=$identifier OR seed_key=$identifier)
        LIMIT 1
      `, { identifier });
      const exercise = exerciseReader.getRows()[0];
      if (!exercise) throw new Error(`No active exercise found for "${identifier}".`);
      const exerciseId = String(exercise[0]);

      const detailReader = await connection.runAndReadAll(`
        SELECT t.locale, t.name, t.summary, d.purpose, d.setup, d.start_position, d.finish_reset,
          d.breathing_cue, d.tempo_cue, d.safety_notes, d.quality_criteria, d.prerequisites,
          d.fallback_exercise
        FROM exercise_translations t
        JOIN exercise_details d ON d.exercise_id=t.exercise_id AND d.locale=t.locale
        WHERE t.exercise_id=$exerciseId AND t.locale IN ('de','en')
        ORDER BY t.locale
      `, { exerciseId });
      const localizedRows = detailReader.getRows();
      if (localizedRows.length !== 2) {
        throw new Error("Exercise image generation requires both German and English structured exercise details.");
      }

      const stepRows = await connection.runAndReadAll(`SELECT locale, instruction FROM exercise_execution_steps WHERE exercise_id=$exerciseId ORDER BY locale, step_order`, { exerciseId });
      const cueRows = await connection.runAndReadAll(`SELECT locale, cue FROM exercise_coaching_cues WHERE exercise_id=$exerciseId ORDER BY locale, cue_order`, { exerciseId });
      const mistakeRows = await connection.runAndReadAll(`SELECT locale, mistake, correction FROM exercise_common_mistakes WHERE exercise_id=$exerciseId ORDER BY locale, mistake_order`, { exerciseId });
      const bodyRows = await connection.runAndReadAll(`
        SELECT b.emphasis, r.label_de, r.label_en FROM exercise_body_regions b
        JOIN body_regions r ON r.id=b.body_region_id WHERE b.exercise_id=$exerciseId ORDER BY b.emphasis, r.id
      `, { exerciseId });
      const movementRows = await connection.runAndReadAll(`
        SELECT m.label_de, m.label_en FROM exercise_movement_patterns x
        JOIN movement_patterns m ON m.id=x.movement_pattern_id WHERE x.exercise_id=$exerciseId ORDER BY m.id
      `, { exerciseId });
      const equipmentRows = await connection.runAndReadAll(`
        SELECT COALESCE(q.name_de,''), COALESCE(q.name_en,q.name_de), x.quantity_required
        FROM exercise_equipment x JOIN equipment q ON q.id=x.equipment_id WHERE x.exercise_id=$exerciseId ORDER BY q.seed_key
      `, { exerciseId });

      const specializedGuidance: Record<ExerciseImageLocale, string[]> = { de: [], en: [] };
      const runningRows = await connection.runAndReadAll(`
        SELECT running_kind,intensity_de,intensity_en,technique_focus_de,technique_focus_en
        FROM exercise_running_guidance WHERE exercise_id=$exerciseId
      `, { exerciseId });
      for (const row of runningRows.getRows()) {
        specializedGuidance.de.push(`Laufart: ${String(row[0])}; Intensität: ${String(row[1])}; Technikfokus: ${String(row[3])}`);
        specializedGuidance.en.push(`Running type: ${String(row[0])}; intensity: ${String(row[2])}; technique focus: ${String(row[4])}`);
      }

      const obstacleRows = await connection.runAndReadAll(`
        SELECT locale,equipment_configuration,approach,execution,exit_reset FROM exercise_obstacle_guidance
        WHERE exercise_id=$exerciseId ORDER BY locale
      `, { exerciseId });
      for (const row of obstacleRows.getRows()) {
        const locale = String(row[0]) as ExerciseImageLocale;
        if (locale === "de" || locale === "en") specializedGuidance[locale].push(`Obstacle configuration: ${String(row[1])}; approach: ${String(row[2])}; execution: ${String(row[3])}; exit: ${String(row[4])}`);
      }

      const carryRows = await connection.runAndReadAll(`
        SELECT locale,load_guidance,route_setup,lifting_setup,movement_cue,turning_cue,finish_reset
        FROM exercise_carry_guidance WHERE exercise_id=$exerciseId ORDER BY locale
      `, { exerciseId });
      for (const row of carryRows.getRows()) {
        const locale = String(row[0]) as ExerciseImageLocale;
        if (locale === "de" || locale === "en") specializedGuidance[locale].push(`Load: ${String(row[1])}; route: ${String(row[2])}; lifting setup: ${String(row[3])}; movement: ${String(row[4])}; turn: ${String(row[5])}; reset: ${String(row[6])}`);
      }

      const localized = Object.fromEntries(localizedRows.map((row) => {
        const locale = String(row[0]) as ExerciseImageLocale;
        const rowsForLocale = (rows: readonly (readonly unknown[])[]) => rows.filter((item) => String(item[0]) === locale);
        return [locale, {
          name: String(row[1]), summary: String(row[2] ?? ""), purpose: String(row[3] ?? ""), setup: String(row[4] ?? ""),
          startPosition: String(row[5] ?? ""), finishReset: String(row[6] ?? ""), breathingCue: String(row[7] ?? ""), tempoCue: String(row[8] ?? ""),
          safetyNotes: String(row[9] ?? ""), qualityCriteria: String(row[10] ?? ""), prerequisites: String(row[11] ?? ""), fallbackExercise: String(row[12] ?? ""),
          executionSteps: normalizeImageExecutionSteps(rowsForLocale(stepRows.getRows()).map((item) => String(item[1]))),
          coachingCues: rowsForLocale(cueRows.getRows()).map((item) => String(item[1])),
          commonMistakes: rowsForLocale(mistakeRows.getRows()).map((item) => ({ mistake: String(item[1]), correction: String(item[2]) })),
          specializedGuidance: specializedGuidance[locale],
        }];
      }));

      return contextSchema.parse({
        exerciseId, seedKey: exercise[1] == null ? null : String(exercise[1]), category: String(exercise[2]),
        exerciseType: String(exercise[3] ?? "drill"), difficulty: String(exercise[4] ?? "beginner"), riskLevel: String(exercise[5]),
        minimumAge: exercise[6] == null ? null : Number(exercise[6]), impactLevel: String(exercise[7] ?? "low"),
        coordinationComplexity: String(exercise[8] ?? "simple"), spaceRequirement: String(exercise[9] ?? "medium"),
        supervision: String(exercise[10] ?? "normal"), suitableIndoors: Boolean(exercise[11]), suitableOutdoors: Boolean(exercise[12]),
        bodyRegions: bodyRows.getRows().map((row) => ({ emphasis: String(row[0]), labelDe: String(row[1]), labelEn: String(row[2]) })),
        movementPatterns: movementRows.getRows().map((row) => ({ labelDe: String(row[0]), labelEn: String(row[1]) })),
        equipment: equipmentRows.getRows().map((row) => ({ nameDe: String(row[0]), nameEn: String(row[1]), quantity: Number(row[2]) })),
        localized,
      });
    });
  }

  async createGeneratingRecord(input: CreateExerciseImageGenerationRecord): Promise<string> {
    await ensureDatabaseReady();
    return serializeExerciseImageWrite(() => withDuckDbConnection(async (connection) => {
      const reader = await connection.runAndReadAll(`
        INSERT INTO exercise_media_assets (
          exercise_id,media_type,source_type,provider,model,style_profile,illustration_format,
          figure_presentation,sequence_step_count,generation_prompt,
          review_status,generation_status,storage_provider
        ) VALUES ($exerciseId,'illustration','ai_generated','openai','gpt-image-2',$styleProfile,
          $illustrationFormat,$figurePresentation,$sequenceStepCount,$generationPrompt,'pending','generating',$storageProvider)
        RETURNING id::VARCHAR
      `, {
        exerciseId: input.exerciseId,
        styleProfile: input.styleProfile,
        illustrationFormat: input.illustrationFormat,
        figurePresentation: input.figurePresentation,
        sequenceStepCount: input.sequenceStepCount,
        generationPrompt: input.generationPrompt,
        storageProvider: input.storageProvider,
      });
      const assetId = reader.getRows()[0]?.[0];
      if (assetId == null) throw new Error("Could not create the exercise image generation record.");
      return String(assetId);
    }));
  }

  async markGenerated(input: CompleteExerciseImageGenerationRecord): Promise<void> {
    await ensureDatabaseReady();
    await serializeExerciseImageWrite(() => withDuckDbConnection(async (connection) => {
      const reader = await connection.runAndReadAll(`
        UPDATE exercise_media_assets SET generation_status='generated', generated_at=current_timestamp,
          storage_provider=$storageProvider, storage_key=$storageKey, storage_uri=$storageUri,
          content_type=$contentType, width=$width, height=$height, sha256=$sha256,
          error_message=NULL, updated_at=current_timestamp
        WHERE id=$assetId
      `, {
        assetId: input.assetId,
        storageProvider: input.storedImage.storageProvider,
        storageKey: input.storedImage.storageKey,
        storageUri: input.storedImage.storageUri,
        contentType: input.contentType,
        width: input.width,
        height: input.height,
        sha256: input.sha256,
      });
      if (reader.getRows().length !== 1) throw new Error("Exercise image generation record was not found while completing the generation.");
    }));
  }

  async markFailed(assetId: string, errorMessage: string): Promise<void> {
    await ensureDatabaseReady();
    await serializeExerciseImageWrite(() => withDuckDbConnection(async (connection) => {
      await connection.run(`
        UPDATE exercise_media_assets SET generation_status='failed', error_message=$errorMessage,
          updated_at=current_timestamp WHERE id=$assetId
      `, { assetId, errorMessage: errorMessage.slice(0, 1000) });
    }));
  }
}
