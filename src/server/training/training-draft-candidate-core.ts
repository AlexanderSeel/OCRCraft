import type { DuckDBConnection } from "@duckdb/node-api";
import type { ExerciseCategory } from "@/domain/exercise/model";
import type { TrainingDraftExerciseCandidate } from "@/domain/training/draft";
import type {
  Audience,
  ExerciseEquipmentRequirement,
  RiskLevel,
  TrainingLocation,
  TrainingPhaseKind,
} from "@/domain/training/model";

export interface TrainingDraftCandidateQueryOptions {
  readonly audience: Audience;
  readonly minAge?: number;
  readonly locale: "de" | "en";
  readonly location?: TrainingLocation;
}

export async function runTrainingDraftCandidateQuery(
  connection: DuckDBConnection,
  { audience, minAge, locale, location = "mixed" }: TrainingDraftCandidateQueryOptions,
): Promise<readonly TrainingDraftExerciseCandidate[]> {
  const reader = await connection.runAndReadAll(
    `
    SELECT
      e.id::VARCHAR,
      t.name,
      COALESCE(e.category, 'general'),
      e.default_phase,
      e.risk_level,
      e.min_age,
      COALESCE((
        SELECT string_agg(ebr.body_region_id, ' | ')
        FROM exercise_body_regions ebr
        WHERE ebr.exercise_id=e.id
      ), ''),
      COALESCE((
        SELECT string_agg(
          CASE WHEN $locale='de' THEN eq.name_de ELSE COALESCE(eq.name_en, eq.name_de) END,
          ' | '
        )
        FROM exercise_equipment ee
        JOIN equipment eq ON eq.id=ee.equipment_id
        WHERE ee.exercise_id=e.id
      ), ''),
      COALESCE((
        SELECT string_agg(et.tag_id, ' | ')
        FROM exercise_tags et
        WHERE et.exercise_id=e.id
      ), ''),
      COALESCE((
        SELECT string_agg(emp.movement_pattern_id, ' | ')
        FROM exercise_movement_patterns emp
        WHERE emp.exercise_id=e.id
      ), ''),
      e.default_duration_seconds,
      trim(concat_ws(' ',
        COALESCE(d.purpose, ''),
        COALESCE(d.quality_criteria, ''),
        COALESCE((
          SELECT string_agg(s.instruction, ' ' ORDER BY s.step_order)
          FROM exercise_execution_steps s
          WHERE s.exercise_id=e.id AND s.locale=$locale
        ), '')
      )),
      trim(concat_ws(' ',
        COALESCE(t.summary, ''),
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
          SELECT string_agg(concat_ws(' ', m.mistake, m.correction), ' ' ORDER BY m.mistake_order)
          FROM exercise_common_mistakes m
          WHERE m.exercise_id=e.id AND m.locale=$locale
        ), '')
      )),
      d.level_1,
      d.level_2,
      d.level_3,
      COALESCE(d.station_capacity, e.station_capacity, 1),
      d.setup_seconds,
      d.transition_seconds
    FROM exercises e
    JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale=$locale
    LEFT JOIN exercise_details d ON d.exercise_id=e.id AND d.locale=$locale
    WHERE e.archived=false
      AND ($minAge IS NULL OR e.min_age IS NULL OR e.min_age <= $minAge)
      AND (
        $audience='mixed'
        OR ($audience='kids' AND COALESCE(e.suitable_for_kids, true))
        OR ($audience='youth' AND COALESCE(e.suitable_for_youth, true))
        OR ($audience='adults' AND COALESCE(e.suitable_for_adults, true))
      )
      AND (
        $location='mixed'
        OR ($location='indoor' AND COALESCE(e.indoor_suitable, true))
        OR ($location='outdoor' AND COALESCE(e.outdoor_suitable, true))
      )
    ORDER BY t.name
    `,
    {
      locale,
      audience,
      location,
      minAge: minAge ?? null,
    },
  );

  const rows = reader.getRows();
  if (rows.length === 0) return [];

  const equipmentReader = await connection.runAndReadAll(
    `
    SELECT ee.exercise_id::VARCHAR,eq.id::VARCHAR,
      CASE WHEN $locale='de' THEN eq.name_de ELSE COALESCE(eq.name_en,eq.name_de) END,
      ee.quantity_required
    FROM exercise_equipment ee
    JOIN equipment eq ON eq.id=ee.equipment_id
    WHERE list_contains(string_split($exerciseIds, ','), ee.exercise_id::VARCHAR)
    ORDER BY ee.exercise_id::VARCHAR,eq.id::VARCHAR
    `,
    { locale, exerciseIds: rows.map((row) => String(row[0])).join(",") },
  );
  const equipmentByExercise = new Map<string, ExerciseEquipmentRequirement[]>();
  for (const row of equipmentReader.getRows()) {
    const exerciseId = String(row[0]);
    const requirements = equipmentByExercise.get(exerciseId) ?? [];
    requirements.push({
      equipmentId: String(row[1]),
      name: String(row[2]),
      quantityPerStation: Number(row[3]),
    });
    equipmentByExercise.set(exerciseId, requirements);
  }

  return rows.map((row) => ({
    id: String(row[0]),
    name: String(row[1]),
    category: String(row[2]) as ExerciseCategory,
    defaultPhase: row[3] == null ? null : String(row[3]) as TrainingPhaseKind,
    riskLevel: String(row[4]) as RiskLevel,
    minAge: row[5] == null ? null : Number(row[5]),
    bodyRegions: String(row[6] ?? "").split(" | ").filter(Boolean),
    equipment: String(row[7] ?? "").split(" | ").filter(Boolean),
    equipmentRequirements: equipmentByExercise.get(String(row[0])) ?? [],
    tags: String(row[8] ?? "").split(" | ").filter(Boolean),
    movementPatterns: String(row[9] ?? "").split(" | ").filter(Boolean),
    defaultDurationSeconds: row[10] == null ? null : Number(row[10]),
    instructions: row[11] == null ? undefined : String(row[11]),
    planningText: row[12] == null ? undefined : String(row[12]),
    level1: row[13] == null ? undefined : String(row[13]),
    level2: row[14] == null ? undefined : String(row[14]),
    level3: row[15] == null ? undefined : String(row[15]),
    stationCapacity: Number(row[16]),
    setupSeconds: row[17] == null ? null : Number(row[17]),
    transitionSeconds: row[18] == null ? null : Number(row[18]),
  }));
}
