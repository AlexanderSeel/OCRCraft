import type { DuckDBConnection } from "@duckdb/node-api";
import type {
  ExerciseCoordinationComplexity,
  ExerciseDifficulty,
  ExerciseImpactLevel,
  ExerciseTrainingGoal,
  ExerciseType,
} from "@/domain/exercise/classification";
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
      e.exercise_type,
      e.difficulty,
      e.impact_level,
      e.coordination_complexity,
      COALESCE((
        SELECT string_agg(etg.goal, ' | ' ORDER BY etg.goal)
        FROM exercise_training_goals etg
        WHERE etg.exercise_id=e.id
      ), ''),
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
        ), ''),
        CASE WHEN $location='outdoor' THEN COALESCE(d.outdoor_variant, '') ELSE '' END
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
        CASE WHEN $location='outdoor' THEN COALESCE(d.outdoor_variant, '') ELSE '' END,
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

  const exerciseIds = rows.map((row) => String(row[0])).join(",");
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
    { locale, exerciseIds },
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

  // A reviewed/enriched outdoor variant has its own equipment requirements.
  // For outdoor planning those requirements replace the original gym equipment;
  // for indoor/mixed planning the canonical exercise equipment stays unchanged.
  if (location === "outdoor") {
    const outdoorEquipmentReader = await connection.runAndReadAll(
      `
      SELECT ove.exercise_id::VARCHAR,eq.id::VARCHAR,
        CASE WHEN $locale='de' THEN eq.name_de ELSE COALESCE(eq.name_en,eq.name_de) END,
        ove.quantity_required
      FROM exercise_outdoor_variant_equipment ove
      JOIN equipment eq ON eq.id=ove.equipment_id
      WHERE list_contains(string_split($exerciseIds, ','), ove.exercise_id::VARCHAR)
      ORDER BY ove.exercise_id::VARCHAR,eq.id::VARCHAR
      `,
      { locale, exerciseIds },
    );
    const outdoorByExercise = new Map<string, ExerciseEquipmentRequirement[]>();
    for (const row of outdoorEquipmentReader.getRows()) {
      const exerciseId = String(row[0]);
      const requirements = outdoorByExercise.get(exerciseId) ?? [];
      requirements.push({
        equipmentId: String(row[1]),
        name: String(row[2]),
        quantityPerStation: Number(row[3]),
      });
      outdoorByExercise.set(exerciseId, requirements);
    }
    for (const [exerciseId, requirements] of outdoorByExercise) {
      if (requirements.length > 0) equipmentByExercise.set(exerciseId, requirements);
    }
  }

  return rows.map((row) => {
    const id = String(row[0]);
    const equipmentRequirements = equipmentByExercise.get(id) ?? [];
    return {
      id,
      name: String(row[1]),
      category: String(row[2]) as ExerciseCategory,
      defaultPhase: row[3] == null ? null : String(row[3]) as TrainingPhaseKind,
      riskLevel: String(row[4]) as RiskLevel,
      minAge: row[5] == null ? null : Number(row[5]),
      exerciseType: row[6] == null ? undefined : String(row[6]) as ExerciseType,
      difficulty: row[7] == null ? undefined : String(row[7]) as ExerciseDifficulty,
      impactLevel: row[8] == null ? undefined : String(row[8]) as ExerciseImpactLevel,
      coordinationComplexity: row[9] == null ? undefined : String(row[9]) as ExerciseCoordinationComplexity,
      trainingGoals: String(row[10] ?? "").split(" | ").filter(Boolean) as ExerciseTrainingGoal[],
      bodyRegions: String(row[11] ?? "").split(" | ").filter(Boolean),
      equipment: equipmentRequirements.map((requirement) => requirement.name),
      equipmentRequirements,
      tags: String(row[13] ?? "").split(" | ").filter(Boolean),
      movementPatterns: String(row[14] ?? "").split(" | ").filter(Boolean),
      defaultDurationSeconds: row[15] == null ? null : Number(row[15]),
      instructions: row[16] == null ? undefined : String(row[16]),
      planningText: row[17] == null ? undefined : String(row[17]),
      level1: row[18] == null ? undefined : String(row[18]),
      level2: row[19] == null ? undefined : String(row[19]),
      level3: row[20] == null ? undefined : String(row[20]),
      stationCapacity: Number(row[21]),
      setupSeconds: row[22] == null ? null : Number(row[22]),
      transitionSeconds: row[23] == null ? null : Number(row[23]),
    };
  });
}
