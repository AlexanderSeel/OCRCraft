import type { DuckDBConnection } from "@duckdb/node-api";

interface PreservedSeedMediaAsset {
  readonly id: string;
  readonly seedKey: string;
  readonly mediaType: string;
  readonly sourceType: string;
  readonly provider: string | null;
  readonly model: string | null;
  readonly styleProfile: string | null;
  readonly illustrationFormat: string;
  readonly figurePresentation: string | null;
  readonly sequenceStepCount: number | null;
  readonly generationPrompt: string | null;
  readonly generatedAt: string | null;
  readonly reviewStatus: string;
  readonly generationStatus: string;
  readonly storageProvider: string;
  readonly storageKey: string | null;
  readonly storageUri: string | null;
  readonly contentType: string | null;
  readonly width: number | null;
  readonly height: number | null;
  readonly sha256: string | null;
  readonly errorMessage: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

const tablesToClear = [
  "exercise_media_assets",
  "training_items",
  "training_phases",
  "training_sessions",
  "club_groups",
  "search_documents_de",
  "search_documents_en",
  "search_index_state",
  "exercise_carry_guidance",
  "exercise_obstacle_guidance",
  "exercise_running_guidance",
  "exercise_common_mistakes",
  "exercise_coaching_cues",
  "exercise_execution_steps",
  "exercise_details",
  "exercise_equipment",
  "exercise_aliases",
  "exercise_movement_patterns",
  "exercise_training_phases",
  "exercise_training_goals",
  "exercise_tags",
  "exercise_body_regions",
  "exercise_translations",
  "exercises",
  "equipment",
  "tags",
  "movement_patterns",
  "body_regions",
  "schema_migrations",
] as const;

function withoutTransactionWrappers(sql: string): string {
  return sql
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => !/^\s*(BEGIN TRANSACTION|COMMIT);?\s*$/i.test(line))
    .join("\n");
}

async function executeScript(connection: DuckDBConnection, sql: string): Promise<void> {
  const statements = await connection.extractStatements(sql);
  for (let index = 0; index < statements.count; index += 1) {
    const statement = await statements.prepare(index);
    await statement.run();
  }
}

async function readSeedMediaAssets(connection: DuckDBConnection): Promise<readonly PreservedSeedMediaAsset[]> {
  const table = await connection.runAndReadAll(`
    SELECT count(*) FROM information_schema.tables WHERE table_name='exercise_media_assets'
  `);
  if (Number(table.getRows()[0]?.[0] ?? 0) === 0) return [];

  const reader = await connection.runAndReadAll(`
    SELECT m.id::VARCHAR, e.seed_key, m.media_type, m.source_type, m.provider, m.model,
      m.style_profile, m.illustration_format, m.figure_presentation, m.sequence_step_count,
      m.generation_prompt, m.generated_at::VARCHAR, m.review_status,
      m.generation_status, m.storage_provider, m.storage_key, m.storage_uri, m.content_type,
      m.width, m.height, m.sha256, m.error_message, m.created_at::VARCHAR, m.updated_at::VARCHAR
    FROM exercise_media_assets m
    JOIN exercises e ON e.id=m.exercise_id
    WHERE e.seed_key IS NOT NULL
    ORDER BY e.seed_key, m.created_at, m.id
  `);

  return reader.getRows().map((row) => ({
    id: String(row[0]),
    seedKey: String(row[1]),
    mediaType: String(row[2]),
    sourceType: String(row[3]),
    provider: row[4] == null ? null : String(row[4]),
    model: row[5] == null ? null : String(row[5]),
    styleProfile: row[6] == null ? null : String(row[6]),
    illustrationFormat: String(row[7]),
    figurePresentation: row[8] == null ? null : String(row[8]),
    sequenceStepCount: row[9] == null ? null : Number(row[9]),
    generationPrompt: row[10] == null ? null : String(row[10]),
    generatedAt: row[11] == null ? null : String(row[11]),
    reviewStatus: String(row[12]),
    generationStatus: String(row[13]),
    storageProvider: String(row[14]),
    storageKey: row[15] == null ? null : String(row[15]),
    storageUri: row[16] == null ? null : String(row[16]),
    contentType: row[17] == null ? null : String(row[17]),
    width: row[18] == null ? null : Number(row[18]),
    height: row[19] == null ? null : Number(row[19]),
    sha256: row[20] == null ? null : String(row[20]),
    errorMessage: row[21] == null ? null : String(row[21]),
    createdAt: String(row[22]),
    updatedAt: String(row[23]),
  }));
}

async function restoreSeedMediaAssets(
  connection: DuckDBConnection,
  assets: readonly PreservedSeedMediaAsset[],
): Promise<void> {
  for (const asset of assets) {
    const exercise = await connection.runAndReadAll(
      "SELECT id::VARCHAR FROM exercises WHERE seed_key=$seedKey LIMIT 1",
      { seedKey: asset.seedKey },
    );
    const exerciseId = exercise.getRows()[0]?.[0];
    if (exerciseId == null) throw new Error(`Cannot restore media for missing seed exercise "${asset.seedKey}".`);

    await connection.run(`
      INSERT INTO exercise_media_assets (
        id,exercise_id,media_type,source_type,provider,model,style_profile,illustration_format,
        figure_presentation,sequence_step_count,generation_prompt,
        generated_at,review_status,generation_status,storage_provider,storage_key,storage_uri,
        content_type,width,height,sha256,error_message,created_at,updated_at
      ) VALUES (
        $id,$exerciseId,$mediaType,$sourceType,$provider,$model,$styleProfile,$illustrationFormat,
        $figurePresentation,$sequenceStepCount,$generationPrompt,
        CAST($generatedAt AS TIMESTAMP),$reviewStatus,$generationStatus,$storageProvider,$storageKey,
        $storageUri,$contentType,$width,$height,$sha256,$errorMessage,
        CAST($createdAt AS TIMESTAMP),CAST($updatedAt AS TIMESTAMP)
      )
    `, {
      id: asset.id,
      exerciseId: String(exerciseId),
      mediaType: asset.mediaType,
      sourceType: asset.sourceType,
      provider: asset.provider,
      model: asset.model,
      styleProfile: asset.styleProfile,
      illustrationFormat: asset.illustrationFormat,
      figurePresentation: asset.figurePresentation,
      sequenceStepCount: asset.sequenceStepCount,
      generationPrompt: asset.generationPrompt,
      generatedAt: asset.generatedAt,
      reviewStatus: asset.reviewStatus,
      generationStatus: asset.generationStatus,
      storageProvider: asset.storageProvider,
      storageKey: asset.storageKey,
      storageUri: asset.storageUri,
      contentType: asset.contentType,
      width: asset.width,
      height: asset.height,
      sha256: asset.sha256,
      errorMessage: asset.errorMessage,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    });
  }
}

/** Clears all stored app data and restores the database from the checked-in migrations. */
export async function reseedDatabase(
  connection: DuckDBConnection,
  migrationScripts: readonly string[],
): Promise<void> {
  const preservedSeedMediaAssets = await readSeedMediaAssets(connection);
  await connection.run("BEGIN TRANSACTION");

  try {
    await connection.run("DROP VIEW IF EXISTS exercise_seed_coverage");

    for (const table of tablesToClear) {
      try {
        await connection.run(`DROP TABLE IF EXISTS ${table}`);
      } catch (error) {
        throw new Error(`Failed to drop ${table}`, { cause: error });
      }
    }

    for (const script of migrationScripts) {
      await executeScript(connection, withoutTransactionWrappers(script));
    }

    await restoreSeedMediaAssets(connection, preservedSeedMediaAssets);

    await connection.run("COMMIT");
  } catch (error) {
    try {
      await connection.run("ROLLBACK");
    } catch {
      // Keep the original migration failure as the actionable error.
    }
    throw error;
  }
}
