import type { DuckDBConnection } from "@duckdb/node-api";

export type SearchLocale = "de" | "en";

function configForLocale(locale: SearchLocale) {
  return locale === "de"
    ? {
        table: "search_documents_de",
        equipmentLabel: "eq.name_de",
        bodyRegionLabel: "br.label_de",
        tagLabel: "tag.label_de",
        movementLabel: "mp.label_de",
      }
    : {
        table: "search_documents_en",
        equipmentLabel: "COALESCE(eq.name_en, eq.name_de)",
        bodyRegionLabel: "br.label_en",
        tagLabel: "tag.label_en",
        movementLabel: "mp.label_en",
      };
}

/**
 * Rebuilds the denormalized exercise documents from the current source tables.
 * The DuckDB FTS index itself is rebuilt separately because FTS indices do not
 * track source-table mutations automatically.
 */
export async function refreshExerciseSearchDocuments(
  connection: DuckDBConnection,
  locale: SearchLocale,
): Promise<void> {
  const config = configForLocale(locale);

  await connection.run(`DELETE FROM ${config.table} WHERE entity_type='exercise'`);
  await connection.run(
    `
    INSERT INTO ${config.table} (
      document_id, entity_type, entity_id, title, aliases, summary,
      tags, body_regions, equipment, instructions, updated_at
    )
    SELECT
      'exercise:' || e.id::VARCHAR,
      'exercise',
      e.id::VARCHAR,
      t.name,
      COALESCE((
        SELECT string_agg(a.alias, ' ')
        FROM exercise_aliases a
        WHERE a.exercise_id=e.id AND a.locale=$locale
      ), ''),
      COALESCE(t.summary, ''),
      trim(concat_ws(' ',
        COALESCE(e.category, 'general'),
        COALESCE(e.exercise_type, ''),
        COALESCE(e.difficulty, ''),
        COALESCE(e.impact_level, ''),
        COALESCE(e.coordination_complexity, ''),
        COALESCE((
          SELECT string_agg(et.tag_id || ' ' || ${config.tagLabel}, ' ')
          FROM exercise_tags et
          JOIN tags tag ON tag.id=et.tag_id
          WHERE et.exercise_id=e.id
        ), ''),
        COALESCE((
          SELECT string_agg(emp.movement_pattern_id || ' ' || ${config.movementLabel}, ' ')
          FROM exercise_movement_patterns emp
          JOIN movement_patterns mp ON mp.id=emp.movement_pattern_id
          WHERE emp.exercise_id=e.id
        ), '')
      )),
      COALESCE((
        SELECT string_agg(ebr.body_region_id || ' ' || ${config.bodyRegionLabel}, ' ')
        FROM exercise_body_regions ebr
        JOIN body_regions br ON br.id=ebr.body_region_id
        WHERE ebr.exercise_id=e.id
      ), ''),
      COALESCE((
        SELECT string_agg(${config.equipmentLabel}, ' ')
        FROM exercise_equipment ee
        JOIN equipment eq ON eq.id=ee.equipment_id
        WHERE ee.exercise_id=e.id
      ), ''),
      trim(concat_ws(' ',
        COALESCE(t.instructions, ''),
        COALESCE(t.coaching_cues, ''),
        COALESCE(t.common_mistakes, ''),
        COALESCE(d.purpose, ''),
        COALESCE(d.setup, ''),
        COALESCE(d.start_position, ''),
        COALESCE(d.finish_reset, ''),
        COALESCE(d.breathing_cue, ''),
        COALESCE(d.tempo_cue, ''),
        COALESCE(d.safety_notes, ''),
        COALESCE(d.quality_criteria, ''),
        COALESCE(d.beginner_prescription, ''),
        COALESCE(d.standard_prescription, ''),
        COALESCE(d.advanced_prescription, ''),
        COALESCE(d.work_rest_guidance, ''),
        COALESCE(d.level_1, ''),
        COALESCE(d.level_2, ''),
        COALESCE(d.level_3, ''),
        COALESCE(d.child_youth_variant, ''),
        COALESCE(d.prerequisites, ''),
        COALESCE(d.fallback_exercise, ''),
        COALESCE((
          SELECT string_agg(s.instruction, ' ' ORDER BY s.step_order)
          FROM exercise_execution_steps s
          WHERE s.exercise_id=e.id AND s.locale=$locale
        ), ''),
        COALESCE((
          SELECT string_agg(c.cue, ' ' ORDER BY c.cue_order)
          FROM exercise_coaching_cues c
          WHERE c.exercise_id=e.id AND c.locale=$locale
        ), ''),
        COALESCE((
          SELECT string_agg(m.mistake || ' ' || m.correction, ' ' ORDER BY m.mistake_order)
          FROM exercise_common_mistakes m
          WHERE m.exercise_id=e.id AND m.locale=$locale
        ), '')
      )),
      current_timestamp
    FROM exercises e
    JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale=$locale
    LEFT JOIN exercise_details d ON d.exercise_id=e.id AND d.locale=$locale
    WHERE e.archived=false
    `,
    { locale },
  );
}
