import { readFile } from "node:fs/promises";
import path from "node:path";
import { DuckDBInstance } from "@duckdb/node-api";
import { describe, expect, it } from "vitest";
import { runSeedCompletenessQuery } from "../exercises/seed-completeness-core";
import { reseedDatabase } from "./reseed-database";

const migrationFiles = [
  "001_initial.sql",
  "002_exercise_catalog.sql",
  "003_seed_exercise_catalog.sql",
  "004_exercise_details.sql",
  "005_running_seed_guidance.sql",
  "006_obstacle_seed_guidance.sql",
  "007_grip_rig_seed_guidance.sql",
  "008_carry_lift_seed_guidance.sql",
  "009_warmup_seed_enrichment.sql",
  "010_exercise_media_assets.sql",
  "011_muscle_regions.sql",
  "012_seed_movement_patterns.sql",
  "013_foundational_strength_seed_cohort.sql",
  "014_seed_cross_locale_aliases.sql",
  "015_movement_teamwork_seed_cohort.sql",
  "016_exercise_image_sequences.sql",
  "017_exercise_training_phases.sql",
  "018_exercise_training_goals.sql",
  "019_exercise_movement_classification.sql",
  "020_ocr_transfer_tags.sql",
  "021_muscle_relationships.sql",
  "022_detailed_body_regions.sql",
  "025_seed_alias_completeness.sql",
  "026_external_media_licensing.sql",
  "027_exercise_source_references.sql",
  "028_seed_quality_expansion.sql",
] as const;

async function runSqlScript(connection: Awaited<ReturnType<InstanceType<typeof DuckDBInstance>["connect"]>>, sql: string) {
  const statements = await connection.extractStatements(sql);
  for (let index = 0; index < statements.count; index += 1) {
    const statement = await statements.prepare(index);
    await statement.run();
  }
}

async function scalar(connection: Awaited<ReturnType<InstanceType<typeof DuckDBInstance>["connect"]>>, sql: string): Promise<number> {
  const reader = await connection.runAndReadAll(sql);
  return Number(reader.getRows()[0]?.[0] ?? 0);
}

describe("initial exercise catalog", () => {
  it("creates a broad bilingual OCR and running seed database", async () => {
    const instance = await DuckDBInstance.create(":memory:");
    const connection = await instance.connect();

    try {
      for (const fileName of migrationFiles) {
        const sql = await readFile(
          path.join(process.cwd(), "src", "server", "db", "migrations", fileName),
          "utf8",
        );
        await runSqlScript(connection, sql);
      }

      const total = await scalar(connection, "SELECT count(*) FROM exercises WHERE seed_key IS NOT NULL");
      const completenessRows = await runSeedCompletenessQuery(connection);
      const running = await scalar(connection, "SELECT count(*) FROM exercises WHERE category='running'");
      const movementTeamworkCohort = await scalar(connection, `
        SELECT count(*) FROM exercises WHERE seed_key IN (
          'partner-mirror-movement','cooperative-cone-collect','quiet-landing-practice'
        )
      `);
      const unsafeLandingDefaults = await scalar(connection, `
        SELECT count(*) FROM exercises e JOIN exercise_details d ON d.exercise_id=e.id AND d.locale='de'
        WHERE e.seed_key='quiet-landing-practice' AND (
          e.risk_level<>'low' OR e.impact_level<>'moderate' OR e.min_age<>8 OR e.supervision<>'increased'
          OR e.station_capacity<>1 OR d.setup NOT LIKE '%keine Boxen%' OR d.prerequisites=''
        )
      `);
      const coneEquipmentQuantity = await scalar(connection, `
        SELECT count(*) FROM exercises e JOIN exercise_equipment x ON x.exercise_id=e.id
        JOIN equipment q ON q.id=x.equipment_id
        WHERE e.seed_key='cooperative-cone-collect' AND q.seed_key='cones' AND x.quantity_required=6
      `);
      const categories = await scalar(connection, "SELECT count(DISTINCT category) FROM exercises WHERE seed_key IS NOT NULL");
      const sampleExerciseResult = await connection.runAndReadAll("SELECT id::VARCHAR FROM exercises WHERE seed_key='easy-jog'");
      const sampleExerciseId = String(sampleExerciseResult.getRows()[0]?.[0]);
      await connection.run(`
        INSERT INTO exercise_media_assets (
          exercise_id,media_type,source_type,provider,model,style_profile,illustration_format,
          figure_presentation,sequence_step_count,generation_prompt,generation_status,storage_provider
        ) VALUES ($exerciseId,'illustration','ai_generated','openai','gpt-image-2',
          'ocrcraft-exercise-illustration-v2','exercise_sequence','adult_woman',3,
          'Three-step movement sequence test prompt','generating','filesystem')
      `, { exerciseId: sampleExerciseId });
      const persistedImageMetadata = await connection.runAndReadAll(`
        SELECT source_type,provider,model,style_profile,illustration_format,figure_presentation,
          sequence_step_count,generation_prompt,review_status,generation_status
        FROM exercise_media_assets WHERE exercise_id=$exerciseId
      `, { exerciseId: sampleExerciseId });
      const translations = await scalar(connection, "SELECT count(*) FROM exercise_translations");
      const missingCanonicalNames = await scalar(connection, `
        SELECT count(*) FROM exercises e
        WHERE e.seed_key IS NOT NULL AND (
          NOT EXISTS (SELECT 1 FROM exercise_translations t WHERE t.exercise_id=e.id AND t.locale='de' AND length(trim(t.name)) > 0)
          OR NOT EXISTS (SELECT 1 FROM exercise_translations t WHERE t.exercise_id=e.id AND t.locale='en' AND length(trim(t.name)) > 0)
        )
      `);
      const missingCrossLocaleAliases = await scalar(connection, `
        SELECT count(*) FROM exercises e
        JOIN exercise_translations de ON de.exercise_id=e.id AND de.locale='de'
        JOIN exercise_translations en ON en.exercise_id=e.id AND en.locale='en'
        WHERE e.seed_key IS NOT NULL
          AND lower(trim(de.name)) <> lower(trim(en.name))
          AND (
            NOT EXISTS (SELECT 1 FROM exercise_aliases a WHERE a.exercise_id=e.id AND a.locale='de' AND lower(trim(a.alias))=lower(trim(en.name)))
            OR NOT EXISTS (SELECT 1 FROM exercise_aliases a WHERE a.exercise_id=e.id AND a.locale='en' AND lower(trim(a.alias))=lower(trim(de.name)))
          )
      `);
      const missingCrossLocaleSearchTerms = await scalar(connection, `
        SELECT count(*) FROM exercises e
        JOIN exercise_translations de ON de.exercise_id=e.id AND de.locale='de'
        JOIN exercise_translations en ON en.exercise_id=e.id AND en.locale='en'
        LEFT JOIN search_documents_de sd ON sd.entity_id=e.id::VARCHAR AND sd.entity_type='exercise'
        LEFT JOIN search_documents_en se ON se.entity_id=e.id::VARCHAR AND se.entity_type='exercise'
        WHERE e.seed_key IS NOT NULL
          AND lower(trim(de.name)) <> lower(trim(en.name))
          AND (
            position(lower(trim(en.name)) IN lower(COALESCE(sd.aliases,'')))=0
            OR position(lower(trim(de.name)) IN lower(COALESCE(se.aliases,'')))=0
          )
      `);
      const germanSearchDocs = await scalar(connection, "SELECT count(*) FROM search_documents_de WHERE entity_type='exercise'");
      const englishSearchDocs = await scalar(connection, "SELECT count(*) FROM search_documents_en WHERE entity_type='exercise'");
      const duplicateKeys = await scalar(connection, "SELECT count(*) FROM (SELECT seed_key FROM exercises WHERE seed_key IS NOT NULL GROUP BY seed_key HAVING count(*) > 1)");
      const missingSummariesOrPurposes = await scalar(connection, `
        SELECT count(*) FROM exercises e
        CROSS JOIN (VALUES ('de'),('en')) l(locale)
        LEFT JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale=l.locale
        LEFT JOIN exercise_details d ON d.exercise_id=e.id AND d.locale=l.locale
        WHERE e.seed_key IS NOT NULL AND (COALESCE(trim(t.summary),'')='' OR COALESCE(trim(d.purpose),'')='')
      `);
      const detailRows = await scalar(connection, "SELECT count(*) FROM exercise_details d JOIN exercises e ON e.id=d.exercise_id WHERE e.seed_key IS NOT NULL");
      const detailGaps = await scalar(connection, "SELECT count(*) FROM exercise_details WHERE purpose='' OR setup='' OR start_position='' OR finish_reset='' OR breathing_cue='' OR tempo_cue='' OR safety_notes='' OR quality_criteria='' OR level_1='' OR level_2='' OR level_3='' OR child_youth_variant='' OR prerequisites='' OR fallback_exercise=''");
      const shortExecution = await scalar(connection, "SELECT count(*) FROM exercises e WHERE e.seed_key IS NOT NULL AND (SELECT count(*) FROM exercise_execution_steps s WHERE s.exercise_id=e.id AND s.locale='de') < 3");
      const incompleteExecutionLocales = await scalar(connection, `
        SELECT count(*) FROM exercises e
        CROSS JOIN (VALUES ('de'),('en')) l(locale)
        WHERE e.seed_key IS NOT NULL AND (
          (SELECT count(*) FROM exercise_execution_steps s WHERE s.exercise_id=e.id AND s.locale=l.locale) < 3
          OR EXISTS (SELECT 1 FROM exercise_execution_steps s WHERE s.exercise_id=e.id AND s.locale=l.locale AND trim(s.instruction)='')
        )
      `);
      const missingCoachingCues = await scalar(connection, `
        SELECT count(*) FROM exercises e
        CROSS JOIN (VALUES ('de'),('en')) l(locale)
        WHERE e.seed_key IS NOT NULL AND (SELECT count(*) FROM exercise_coaching_cues c WHERE c.exercise_id=e.id AND c.locale=l.locale) < 2
      `);
      const missingMistakeCorrections = await scalar(connection, `
        SELECT count(*) FROM exercises e
        CROSS JOIN (VALUES ('de'),('en')) l(locale)
        WHERE e.seed_key IS NOT NULL AND (SELECT count(*) FROM exercise_common_mistakes m WHERE m.exercise_id=e.id AND m.locale=l.locale) < 1
      `);
      const missingCoreClassification = await scalar(connection, `
        SELECT count(*) FROM exercises e
        WHERE e.seed_key IS NOT NULL AND (
          COALESCE(trim(e.category),'')='' OR COALESCE(trim(e.default_phase),'')=''
          OR COALESCE(trim(e.exercise_type),'')='' OR COALESCE(trim(e.difficulty),'')=''
          OR COALESCE(trim(e.risk_level),'')='' OR e.suitable_for_kids IS NULL
          OR e.suitable_for_youth IS NULL OR e.suitable_for_adults IS NULL
          OR NOT EXISTS (SELECT 1 FROM exercise_body_regions b WHERE b.exercise_id=e.id AND b.emphasis='primary')
          OR NOT EXISTS (SELECT 1 FROM exercise_movement_patterns m WHERE m.exercise_id=e.id)
          OR NOT (e.supports_reps OR e.supports_seconds OR e.supports_minutes OR e.supports_metres OR e.supports_rounds OR e.supports_attempts)
        )
      `);
      const missingMovementRows = await connection.runAndReadAll(`
        SELECT e.seed_key,e.category FROM exercises e
        WHERE e.seed_key IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM exercise_movement_patterns m WHERE m.exercise_id=e.id)
        ORDER BY e.seed_key
      `);
      const missingProgressionLevels = await scalar(connection, `
        SELECT count(*) FROM exercises e
        CROSS JOIN (VALUES ('de'),('en')) l(locale)
        LEFT JOIN exercise_details d ON d.exercise_id=e.id AND d.locale=l.locale
        WHERE e.seed_key IS NOT NULL AND e.progression_required
          AND (d.exercise_id IS NULL OR trim(d.level_1)='' OR trim(d.level_2)='' OR trim(d.level_3)='')
      `);
      const invalidLogisticsMetadata = await scalar(connection, `
        SELECT count(*) FROM exercises e
        LEFT JOIN exercise_details d ON d.exercise_id=e.id AND d.locale='de'
        WHERE e.seed_key IS NOT NULL AND (
          e.setup_seconds IS NULL OR e.setup_seconds < 0 OR e.transition_seconds IS NULL OR e.transition_seconds < 0
          OR COALESCE(d.station_capacity,e.station_capacity,0) < 1
        )
      `);
      const runningGaps = await scalar(connection, "SELECT count(*) FROM exercises e JOIN exercise_details d ON d.exercise_id=e.id AND d.locale='de' WHERE e.seed_key IS NOT NULL AND e.category='running' AND (d.work_rest_guidance='' OR d.purpose='' OR d.tempo_cue='')");
      const obstacleGaps = await scalar(connection, "SELECT count(*) FROM exercises e JOIN exercise_details d ON d.exercise_id=e.id AND d.locale='de' WHERE e.seed_key IS NOT NULL AND e.category IN ('ocr-skill','grip-rig') AND (d.prerequisites='' OR d.fallback_exercise='' OR d.supervision='normal')");
      const runningGuidance = await scalar(connection, "SELECT count(*) FROM exercise_running_guidance");
      const runningGuidanceGaps = await scalar(connection, "SELECT count(*) FROM exercises e JOIN exercise_running_guidance g ON g.exercise_id=e.id WHERE e.category='running' AND e.seed_key IS NOT NULL AND (g.intensity_rpe_min < 1 OR g.intensity_rpe_max > 10 OR g.intensity_de='' OR g.intensity_en='' OR g.technique_focus_de='' OR g.technique_focus_en='')");
      const runningStepGaps = await scalar(connection, "SELECT count(*) FROM exercises e WHERE e.category='running' AND e.seed_key IS NOT NULL AND (SELECT count(*) FROM exercise_execution_steps s WHERE s.exercise_id=e.id AND s.locale='de') <> 3");
      const unclassifiedRunning = await scalar(connection, "SELECT count(*) FROM exercises e LEFT JOIN exercise_running_guidance g ON g.exercise_id=e.id WHERE e.category='running' AND e.seed_key IS NOT NULL AND g.exercise_id IS NULL");
      const runningKinds = await scalar(connection, "SELECT count(DISTINCT g.running_kind) FROM exercise_running_guidance g");
      const obstaclesAndRig = await scalar(connection, "SELECT count(*) FROM exercises WHERE seed_key IS NOT NULL AND category IN ('ocr-skill','grip-rig')");
      const obstacleGuidance = await scalar(connection, "SELECT count(*) FROM exercise_obstacle_guidance g JOIN exercises e ON e.id=g.exercise_id WHERE e.seed_key IS NOT NULL");
      const obstacleGuidanceGaps = await scalar(connection, "SELECT count(*) FROM exercise_obstacle_guidance WHERE equipment_configuration='' OR prerequisites='' OR approach='' OR execution='' OR exit_reset='' OR fallback_exercise='' OR station_capacity <> 1 OR clear_zone_metres <= 0");
      const obstacleSteps = await scalar(connection, "SELECT count(*) FROM exercise_obstacle_guidance g WHERE (SELECT count(*) FROM exercise_execution_steps s WHERE s.exercise_id=g.exercise_id AND s.locale=g.locale) <> 3");
      const carryExercises = await scalar(connection, "SELECT count(*) FROM exercises WHERE seed_key IS NOT NULL AND category='carry-lift'");
      const carryGuidance = await scalar(connection, "SELECT count(*) FROM exercise_carry_guidance g JOIN exercises e ON e.id=g.exercise_id WHERE e.seed_key IS NOT NULL");
      const carryGuidanceGaps = await scalar(connection, "SELECT count(*) FROM exercise_carry_guidance WHERE load_guidance='' OR route_setup='' OR lifting_setup='' OR movement_cue='' OR turning_cue='' OR finish_reset='' OR fallback_exercise='' OR intensity_rpe_min < 1 OR intensity_rpe_max > 10 OR station_capacity < 1 OR route_length_metres < 1");
      const carrySteps = await scalar(connection, "SELECT count(*) FROM exercise_carry_guidance g WHERE (SELECT count(*) FROM exercise_execution_steps s WHERE s.exercise_id=g.exercise_id AND s.locale=g.locale) <> 3");

      expect(total).toBeGreaterThan(0);
      expect(movementTeamworkCohort).toBe(3);
      expect(unsafeLandingDefaults).toBe(0);
      expect(coneEquipmentQuantity).toBe(1);
      expect(completenessRows).toHaveLength(total);
      expect(running).toBeGreaterThanOrEqual(25);
      expect(categories).toBeGreaterThanOrEqual(11);
      expect(translations).toBe(total * 2);
      expect(missingCanonicalNames).toBe(0);
      expect(missingCrossLocaleAliases).toBe(0);
      expect(missingCrossLocaleSearchTerms).toBe(0);
      expect(await scalar(connection, "SELECT count(*) FROM search_index_state WHERE locale IN ('de','en') AND status='dirty'")).toBe(2);
      expect(germanSearchDocs).toBe(total);
      expect(englishSearchDocs).toBe(total);
      expect(duplicateKeys).toBe(0);
      expect(missingSummariesOrPurposes).toBe(0);
      expect(detailRows).toBe(total * 2);
      expect(detailGaps).toBe(0);
      expect(shortExecution).toBe(0);
      expect(incompleteExecutionLocales).toBe(0);
      expect(missingCoachingCues).toBe(0);
      expect(missingMistakeCorrections).toBe(0);
      expect(missingMovementRows.getRows()).toEqual([]);
      expect(missingCoreClassification).toBe(0);
      expect(missingProgressionLevels).toBe(0);
      expect(invalidLogisticsMetadata).toBe(0);
      expect(runningGaps).toBe(0);
      expect(obstacleGaps).toBe(0);
      expect(runningGuidance).toBe(running);
      expect(runningGuidanceGaps).toBe(0);
      expect(runningStepGaps).toBe(0);
      expect(unclassifiedRunning).toBe(0);
      expect(runningKinds).toBeGreaterThanOrEqual(5);
      expect(obstacleGuidance).toBe(obstaclesAndRig * 2);
      expect(obstacleGuidanceGaps).toBe(0);
      expect(obstacleSteps).toBe(0);
      expect(carryGuidance).toBe(carryExercises * 2);
      expect(carryGuidanceGaps).toBe(0);
      expect(carrySteps).toBe(0);

      const warmupRows = await scalar(connection, `
        SELECT count(*) FROM exercises e
        JOIN exercise_translations t ON t.exercise_id=e.id
        JOIN exercise_details d ON d.exercise_id=e.id AND d.locale=t.locale
        WHERE e.category='warmup' AND e.seed_key IS NOT NULL
          AND length(t.summary) >= 40
          AND length(d.purpose) >= 50
          AND length(d.setup) >= 45
          AND length(d.start_position) >= 40
          AND length(d.safety_notes) >= 50
          AND length(d.quality_criteria) >= 50
      `);
      const warmups = await scalar(connection, "SELECT count(*) * 2 FROM exercises WHERE category='warmup' AND seed_key IS NOT NULL");
      const weakWarmupText = await scalar(connection, `
        SELECT count(*) FROM exercises e
        JOIN exercise_translations t ON t.exercise_id=e.id
        WHERE e.category='warmup' AND e.seed_key IS NOT NULL
          AND (t.summary LIKE '%Warm-up drill%' OR t.summary LIKE '%Aufwärmübung zur Vorbereitung%')
      `);
      const genericWarmupSteps = await scalar(connection, `
        SELECT count(*) FROM exercise_execution_steps s
        JOIN exercises e ON e.id=s.exercise_id
        WHERE e.category='warmup' AND (s.instruction LIKE '%brief demonstration%' OR s.instruction LIKE '%kurze Demonstration%')
      `);
      const genericWarmupCues = await scalar(connection, `
        SELECT count(*) FROM exercise_coaching_cues c
        JOIN exercises e ON e.id=c.exercise_id
        WHERE e.category='warmup' AND c.cue IN ('Ruhig starten','Start smoothly','Sauber vor schnell','Quality before speed','Atme weiter','Keep breathing')
      `);
      const genericWarmupMistakes = await scalar(connection, `
        SELECT count(*) FROM exercise_common_mistakes m
        JOIN exercises e ON e.id=m.exercise_id
        WHERE e.category='warmup' AND (m.mistake LIKE '%Tempo wird zu hoch%' OR m.mistake LIKE '%Pace gets too fast%')
      `);
      const incompleteWarmupSteps = await scalar(connection, `
        SELECT count(*) FROM exercises e WHERE e.category='warmup' AND e.seed_key IS NOT NULL
          AND (SELECT count(*) FROM exercise_execution_steps s WHERE s.exercise_id=e.id) <> 6
      `);
      const incompleteWarmupCues = await scalar(connection, `
        SELECT count(*) FROM exercises e WHERE e.category='warmup' AND e.seed_key IS NOT NULL
          AND (SELECT count(*) FROM exercise_coaching_cues c WHERE c.exercise_id=e.id) < 4
      `);
      const incompleteWarmupCorrections = await scalar(connection, `
        SELECT count(*) FROM exercises e WHERE e.category='warmup' AND e.seed_key IS NOT NULL
          AND (SELECT count(*) FROM exercise_common_mistakes m WHERE m.exercise_id=e.id) < 4
      `);
      const incompleteWarmupMovementMetadata = await scalar(connection, `
        SELECT count(*) FROM exercises e WHERE e.category='warmup' AND e.seed_key IS NOT NULL
          AND ((SELECT count(*) FROM exercise_body_regions b WHERE b.exercise_id=e.id AND b.emphasis='primary') = 0
            OR (SELECT count(*) FROM exercise_movement_patterns m WHERE m.exercise_id=e.id) = 0)
      `);
      const staleWarmupSearchDocs = await scalar(connection, `
        SELECT count(*) FROM exercises e
        JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='de'
        JOIN exercise_details d ON d.exercise_id=e.id AND d.locale='de'
        JOIN search_documents_de s ON s.entity_id=e.id::VARCHAR
        WHERE e.category='warmup' AND e.seed_key IS NOT NULL
          AND (s.summary <> t.summary OR s.instructions NOT LIKE '%' || d.purpose || '%')
      `);
      const staleEnglishWarmupSearchDocs = await scalar(connection, `
        SELECT count(*) FROM exercises e
        JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='en'
        JOIN exercise_details d ON d.exercise_id=e.id AND d.locale='en'
        JOIN search_documents_en s ON s.entity_id=e.id::VARCHAR
        WHERE e.category='warmup' AND e.seed_key IS NOT NULL
          AND (s.summary <> t.summary OR s.instructions NOT LIKE '%' || d.purpose || '%')
      `);
      const incompleteWarmupDosage = await scalar(connection, `
        SELECT count(*) FROM exercises e JOIN exercise_details d ON d.exercise_id=e.id
        WHERE e.category='warmup' AND e.seed_key IS NOT NULL
          AND (d.beginner_prescription='' OR d.standard_prescription='' OR d.advanced_prescription=''
            OR d.level_1='' OR d.level_2='' OR d.level_3='' OR d.child_youth_variant='')
      `);

      expect(warmupRows).toBe(warmups);
      expect(weakWarmupText).toBe(0);
      expect(genericWarmupSteps).toBe(0);
      expect(genericWarmupCues).toBe(0);
      expect(genericWarmupMistakes).toBe(0);
      expect(incompleteWarmupSteps).toBe(0);
      expect(incompleteWarmupCues).toBe(0);
      expect(incompleteWarmupCorrections).toBe(0);
      expect(incompleteWarmupMovementMetadata).toBe(0);
      expect(staleWarmupSearchDocs).toBe(0);
      expect(staleEnglishWarmupSearchDocs).toBe(0);
      expect(incompleteWarmupDosage).toBe(0);
      expect(await scalar(connection, "SELECT count(*) FROM information_schema.tables WHERE table_name='exercise_media_assets'")).toBe(1);
      expect(persistedImageMetadata.getRows()[0]).toEqual([
        "ai_generated", "openai", "gpt-image-2", "ocrcraft-exercise-illustration-v2", "exercise_sequence",
        "adult_woman", 3, "Three-step movement sequence test prompt", "pending", "generating",
      ]);
    } finally {
      connection.closeSync();
    }
  });

  it("re-seeds the entire database and rolls back if rebuilding fails", async () => {
    const instance = await DuckDBInstance.create(":memory:");
    const connection = await instance.connect();

    try {
      const scripts = await Promise.all(migrationFiles.map((fileName) =>
        readFile(path.join(process.cwd(), "src", "server", "db", "migrations", fileName), "utf8"),
      ));
      for (const script of scripts) await runSqlScript(connection, script);

      await connection.run("INSERT INTO club_groups (name, audience) VALUES ('Eigene Gruppe', 'adults')");
      await connection.run("INSERT INTO training_sessions (title, total_duration_minutes) VALUES ('Eigene Einheit', 60)");
      const customExercise = await connection.runAndReadAll("INSERT INTO exercises (canonical_name, category) VALUES ('Eigene Übung', 'general') RETURNING id::VARCHAR");
      const customExerciseId = String(customExercise.getRows()[0]?.[0]);
      await connection.run(`
        INSERT INTO exercise_media_assets (
          exercise_id,media_type,source_type,provider,model,style_profile,generation_prompt,
          generation_status,storage_provider
        ) VALUES ($exerciseId,'illustration','ai_generated','openai','gpt-image-2',
          'ocrcraft-exercise-illustration-v1','Test prompt','generating','filesystem')
      `, { exerciseId: customExerciseId });
      const seedExercise = await connection.runAndReadAll("SELECT id::VARCHAR FROM exercises WHERE seed_key='easy-jog'");
      const seedExerciseId = String(seedExercise.getRows()[0]?.[0]);
      await connection.run(`
        INSERT INTO exercise_media_assets (
          exercise_id,media_type,source_type,provider,model,style_profile,illustration_format,
          figure_presentation,sequence_step_count,generation_prompt,generated_at,
          review_status,generation_status,storage_provider,storage_key,storage_uri,content_type,width,height,sha256
        ) VALUES (
          $exerciseId,'illustration','ai_generated','openai','gpt-image-2','ocrcraft-exercise-illustration-v2',
          'exercise_sequence','adult_man',3,'Seed sequence test prompt',current_timestamp,
          'pending','generated','filesystem','old-exercise-id/test-image.png',
          '/generated/exercises/old-exercise-id/test-image.png','image/png',1536,1024,repeat('a',64)
        )
      `, { exerciseId: seedExerciseId });

      await reseedDatabase(connection, scripts);

      const seedCount = await scalar(connection, "SELECT count(*) FROM exercises WHERE seed_key IS NOT NULL");
      expect(seedCount).toBeGreaterThanOrEqual(140);
      expect(await scalar(connection, `
        SELECT count(*) FROM exercises e
        WHERE e.seed_key IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM exercise_training_phases p WHERE p.exercise_id=e.id)
      `)).toBe(0);
      expect(await scalar(connection, `
        SELECT count(*) FROM exercises e
        WHERE e.seed_key IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM exercise_body_regions b WHERE b.exercise_id=e.id AND b.emphasis='secondary')
      `)).toBeGreaterThan(0);
      expect(await scalar(connection, `
        SELECT count(*) FROM exercises e
        WHERE e.seed_key IS NOT NULL AND e.category IN ('running','ocr-skill','grip-rig')
          AND NOT EXISTS (
            SELECT 1 FROM exercise_tags t
            WHERE t.exercise_id=e.id AND t.tag_id IN ('running','obstacle','grip','rope','wall','transition','trail')
          )
      `)).toBe(0);
      expect(await scalar(connection, `
        SELECT count(*) FROM exercises
        WHERE seed_key IS NOT NULL AND (laterality IS NULL OR movement_plane IS NULL)
      `)).toBe(0);
      expect(await scalar(connection, `
        SELECT count(*) FROM exercises e
        WHERE e.seed_key IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM exercise_training_goals g WHERE g.exercise_id=e.id)
      `)).toBe(0);
      expect(await scalar(connection, "SELECT count(*) FROM club_groups")).toBe(0);
      expect(await scalar(connection, "SELECT count(*) FROM training_sessions")).toBe(0);
      expect(await scalar(connection, "SELECT count(*) FROM exercises WHERE canonical_name='Eigene Übung'")).toBe(0);
      expect(await scalar(connection, "SELECT count(*) FROM exercise_media_assets")).toBe(1);
      const restoredMedia = await connection.runAndReadAll(`
        SELECT e.seed_key,m.storage_uri,m.generation_status,m.review_status,
          m.style_profile,m.illustration_format,m.figure_presentation,m.sequence_step_count
        FROM exercise_media_assets m JOIN exercises e ON e.id=m.exercise_id
      `);
      expect(restoredMedia.getRows()[0]).toEqual([
        "easy-jog", "/generated/exercises/old-exercise-id/test-image.png", "generated", "pending",
        "ocrcraft-exercise-illustration-v2", "exercise_sequence", "adult_man", 3,
      ]);
      expect(await scalar(connection, "SELECT count(*) FROM schema_migrations")).toBe(migrationFiles.length);

      await expect(reseedDatabase(connection, [...scripts.slice(0, -1), "INSERT INTO no_such_table VALUES (1)"]))
        .rejects.toThrow();
      expect(await scalar(connection, "SELECT count(*) FROM exercises WHERE seed_key IS NOT NULL")).toBe(seedCount);
      expect(await scalar(connection, "SELECT count(*) FROM exercise_media_assets")).toBe(1);
      expect(await scalar(connection, "SELECT count(*) FROM schema_migrations")).toBe(migrationFiles.length);
    } finally {
      connection.closeSync();
    }
  });
});
