import type { DuckDBConnection } from "@duckdb/node-api";

export interface SeedCompletenessRow {
  readonly exerciseId: string;
  readonly seedKey: string;
  readonly nameDe: string;
  readonly nameEn: string;
  readonly category: string;
  readonly missingFields: readonly string[];
}

export async function runSeedCompletenessQuery(
  connection: DuckDBConnection,
  options: { readonly includeImported?: boolean } = {},
): Promise<readonly SeedCompletenessRow[]> {
  const reader = await connection.runAndReadAll(`
    SELECT e.id::VARCHAR, e.seed_key,
      COALESCE(t_de.name, ''), COALESCE(t_en.name, ''), COALESCE(e.category, ''),
      concat_ws(' · ',
        CASE WHEN COALESCE(trim(t_de.name), '') = '' THEN 'Name Deutsch' END,
        CASE WHEN COALESCE(trim(t_en.name), '') = '' THEN 'Name Englisch' END,
        CASE WHEN NOT EXISTS (SELECT 1 FROM exercise_aliases a WHERE a.exercise_id=e.id AND a.locale='de') THEN 'Alias Deutsch' END,
        CASE WHEN NOT EXISTS (SELECT 1 FROM exercise_aliases a WHERE a.exercise_id=e.id AND a.locale='en') THEN 'Alias Englisch' END,
        CASE WHEN COALESCE(trim(t_de.summary), '') = '' THEN 'Kurzbeschreibung Deutsch' END,
        CASE WHEN COALESCE(trim(t_en.summary), '') = '' THEN 'Kurzbeschreibung Englisch' END,
        CASE WHEN COALESCE(trim(d_de.purpose), '') = '' THEN 'Zweck Deutsch' END,
        CASE WHEN COALESCE(trim(d_en.purpose), '') = '' THEN 'Zweck Englisch' END,
        CASE WHEN COALESCE(trim(d_de.setup), '') = '' THEN 'Aufbau Deutsch' END,
        CASE WHEN COALESCE(trim(d_en.setup), '') = '' THEN 'Aufbau Englisch' END,
        CASE WHEN COALESCE(trim(d_de.start_position), '') = '' THEN 'Startposition Deutsch' END,
        CASE WHEN COALESCE(trim(d_en.start_position), '') = '' THEN 'Startposition Englisch' END,
        CASE WHEN (SELECT count(*) FROM exercise_execution_steps s WHERE s.exercise_id=e.id AND s.locale='de' AND trim(s.instruction)<>'') < 3 THEN 'Ausführungsschritte Deutsch' END,
        CASE WHEN (SELECT count(*) FROM exercise_execution_steps s WHERE s.exercise_id=e.id AND s.locale='en' AND trim(s.instruction)<>'') < 3 THEN 'Ausführungsschritte Englisch' END,
        CASE WHEN (SELECT count(*) FROM exercise_coaching_cues c WHERE c.exercise_id=e.id AND c.locale='de' AND trim(c.cue)<>'') < 2 THEN 'Coaching-Cues Deutsch' END,
        CASE WHEN (SELECT count(*) FROM exercise_coaching_cues c WHERE c.exercise_id=e.id AND c.locale='en' AND trim(c.cue)<>'') < 2 THEN 'Coaching-Cues Englisch' END,
        CASE WHEN (SELECT count(*) FROM exercise_common_mistakes m WHERE m.exercise_id=e.id AND m.locale='de' AND trim(m.mistake)<>'' AND trim(m.correction)<>'') < 1 THEN 'Fehlerkorrektur Deutsch' END,
        CASE WHEN (SELECT count(*) FROM exercise_common_mistakes m WHERE m.exercise_id=e.id AND m.locale='en' AND trim(m.mistake)<>'' AND trim(m.correction)<>'') < 1 THEN 'Fehlerkorrektur Englisch' END,
        CASE WHEN COALESCE(trim(e.category), '') = '' THEN 'Hauptkategorie' END,
        CASE WHEN COALESCE(trim(e.default_phase), '') = '' THEN 'Trainingsphase' END,
        CASE WHEN COALESCE(trim(e.exercise_type), '') = '' OR COALESCE(trim(e.difficulty), '') = '' OR COALESCE(trim(e.risk_level), '') = '' OR e.suitable_for_kids IS NULL OR e.suitable_for_youth IS NULL OR e.suitable_for_adults IS NULL THEN 'Typ, Schwierigkeit, Risiko oder Zielgruppe' END,
        CASE WHEN NOT EXISTS (SELECT 1 FROM exercise_body_regions b WHERE b.exercise_id=e.id AND b.emphasis='primary') THEN 'Primäre Körperregion' END,
        CASE WHEN NOT EXISTS (SELECT 1 FROM exercise_movement_patterns p WHERE p.exercise_id=e.id) THEN 'Bewegungsmuster' END,
        CASE WHEN NOT (e.supports_reps OR e.supports_seconds OR e.supports_minutes OR e.supports_metres OR e.supports_rounds OR e.supports_attempts) THEN 'Dosierungsmethode' END,
        CASE WHEN e.progression_required AND (
          COALESCE(trim(d_de.level_1), '')='' OR COALESCE(trim(d_de.level_2), '')='' OR COALESCE(trim(d_de.level_3), '')=''
          OR COALESCE(trim(d_en.level_1), '')='' OR COALESCE(trim(d_en.level_2), '')='' OR COALESCE(trim(d_en.level_3), '')=''
        ) THEN 'Progressionsstufen DE/EN' END
      ) AS missing_fields
    FROM exercises e
    LEFT JOIN exercise_translations t_de ON t_de.exercise_id=e.id AND t_de.locale='de'
    LEFT JOIN exercise_translations t_en ON t_en.exercise_id=e.id AND t_en.locale='en'
    LEFT JOIN exercise_details d_de ON d_de.exercise_id=e.id AND d_de.locale='de'
    LEFT JOIN exercise_details d_en ON d_en.exercise_id=e.id AND d_en.locale='en'
    WHERE ${options.includeImported ? "TRUE" : "e.seed_key IS NOT NULL"}
    ORDER BY e.seed_key
  `);

  return reader.getRows().map((row) => ({
    exerciseId: String(row[0]),
    seedKey: String(row[1]),
    nameDe: String(row[2]),
    nameEn: String(row[3]),
    category: String(row[4]),
    missingFields: String(row[5] ?? "").split(" · ").filter(Boolean),
  }));
}
