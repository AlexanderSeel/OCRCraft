import "server-only";

import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";

export interface TrainingExerciseMistake {
  readonly mistake: string;
  readonly correction: string;
}

export interface TrainingExerciseGuidance {
  readonly exerciseId: string;
  readonly summary: string | null;
  readonly purpose: string | null;
  readonly setup: string | null;
  readonly startPosition: string | null;
  readonly finishReset: string | null;
  readonly breathingCue: string | null;
  readonly tempoCue: string | null;
  readonly safetyNotes: string | null;
  readonly qualityCriteria: string | null;
  readonly beginnerPrescription: string | null;
  readonly standardPrescription: string | null;
  readonly advancedPrescription: string | null;
  readonly workRestGuidance: string | null;
  readonly level1: string | null;
  readonly level2: string | null;
  readonly level3: string | null;
  readonly childYouthVariant: string | null;
  readonly prerequisites: string | null;
  readonly fallbackExercise: string | null;
  readonly paceGuidance: string | null;
  readonly heartRateZone: string | null;
  readonly difficulty: string | null;
  readonly supervision: string | null;
  readonly spaceRequirement: string | null;
  readonly setupSeconds: number | null;
  readonly transitionSeconds: number | null;
  readonly stationCapacity: number | null;
  readonly maxSimultaneousParticipants: number | null;
  readonly surfaceRequirements: string | null;
  readonly weatherTerrain: string | null;
  readonly obstacleConfiguration: string | null;
  readonly clubObstacleHeightCm: number | null;
  readonly clubObstacleSpanCm: number | null;
  readonly clubObstacleReachCm: number | null;
  readonly executionSteps: readonly string[];
  readonly coachingCues: readonly string[];
  readonly commonMistakes: readonly TrainingExerciseMistake[];
}

export type TrainingExerciseGuidanceMap = Readonly<Record<string, TrainingExerciseGuidance>>;

function textOrNull(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text || null;
}

function numberOrNull(value: unknown): number | null {
  if (value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export async function getTrainingExerciseGuidanceMap(
  exerciseIds: readonly string[],
  locale: "de" | "en",
): Promise<TrainingExerciseGuidanceMap> {
  const uniqueIds = [...new Set(exerciseIds.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length === 0) return {};

  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const idList = uniqueIds.join(",");
    const baseReader = await connection.runAndReadAll(
      `
      SELECT
        e.id::VARCHAR,
        t.summary,
        d.purpose,
        d.setup,
        d.start_position,
        d.finish_reset,
        d.breathing_cue,
        d.tempo_cue,
        d.safety_notes,
        d.quality_criteria,
        d.beginner_prescription,
        d.standard_prescription,
        d.advanced_prescription,
        d.work_rest_guidance,
        d.level_1,
        d.level_2,
        d.level_3,
        d.child_youth_variant,
        d.prerequisites,
        d.fallback_exercise,
        d.pace_guidance,
        d.heart_rate_zone,
        d.difficulty,
        d.supervision,
        d.space_requirement,
        d.setup_seconds,
        d.transition_seconds,
        d.station_capacity,
        e.max_simultaneous_participants,
        e.surface_requirements,
        e.weather_terrain,
        e.obstacle_configuration
        ,e.club_obstacle_height_cm, e.club_obstacle_span_cm, e.club_obstacle_reach_cm
      FROM exercises e
      LEFT JOIN exercise_translations t
        ON t.exercise_id=e.id AND t.locale=$locale
      LEFT JOIN exercise_details d
        ON d.exercise_id=e.id AND d.locale=$locale
      WHERE list_contains(string_split($exerciseIds, ','), e.id::VARCHAR)
      `,
      { exerciseIds: idList, locale },
    );

    const result: Record<string, TrainingExerciseGuidance & {
      executionSteps: string[];
      coachingCues: string[];
      commonMistakes: TrainingExerciseMistake[];
    }> = {};

    for (const row of baseReader.getRows()) {
      const exerciseId = String(row[0]);
      result[exerciseId] = {
        exerciseId,
        summary: textOrNull(row[1]),
        purpose: textOrNull(row[2]),
        setup: textOrNull(row[3]),
        startPosition: textOrNull(row[4]),
        finishReset: textOrNull(row[5]),
        breathingCue: textOrNull(row[6]),
        tempoCue: textOrNull(row[7]),
        safetyNotes: textOrNull(row[8]),
        qualityCriteria: textOrNull(row[9]),
        beginnerPrescription: textOrNull(row[10]),
        standardPrescription: textOrNull(row[11]),
        advancedPrescription: textOrNull(row[12]),
        workRestGuidance: textOrNull(row[13]),
        level1: textOrNull(row[14]),
        level2: textOrNull(row[15]),
        level3: textOrNull(row[16]),
        childYouthVariant: textOrNull(row[17]),
        prerequisites: textOrNull(row[18]),
        fallbackExercise: textOrNull(row[19]),
        paceGuidance: textOrNull(row[20]),
        heartRateZone: textOrNull(row[21]),
        difficulty: textOrNull(row[22]),
        supervision: textOrNull(row[23]),
        spaceRequirement: textOrNull(row[24]),
        setupSeconds: numberOrNull(row[25]),
        transitionSeconds: numberOrNull(row[26]),
        stationCapacity: numberOrNull(row[27]),
        maxSimultaneousParticipants: numberOrNull(row[28]),
        surfaceRequirements: textOrNull(row[29]),
        weatherTerrain: textOrNull(row[30]),
        obstacleConfiguration: textOrNull(row[31]),
        clubObstacleHeightCm: numberOrNull(row[32]),
        clubObstacleSpanCm: numberOrNull(row[33]),
        clubObstacleReachCm: numberOrNull(row[34]),
        executionSteps: [],
        coachingCues: [],
        commonMistakes: [],
      };
    }

    const stepsReader = await connection.runAndReadAll(
      `
      SELECT exercise_id::VARCHAR, instruction
      FROM exercise_execution_steps
      WHERE locale=$locale
        AND list_contains(string_split($exerciseIds, ','), exercise_id::VARCHAR)
      ORDER BY exercise_id::VARCHAR, step_order
      `,
      { exerciseIds: idList, locale },
    );
    for (const row of stepsReader.getRows()) {
      const guidance = result[String(row[0])];
      const value = textOrNull(row[1]);
      if (guidance && value) guidance.executionSteps.push(value);
    }

    const cuesReader = await connection.runAndReadAll(
      `
      SELECT exercise_id::VARCHAR, cue
      FROM exercise_coaching_cues
      WHERE locale=$locale
        AND list_contains(string_split($exerciseIds, ','), exercise_id::VARCHAR)
      ORDER BY exercise_id::VARCHAR, cue_order
      `,
      { exerciseIds: idList, locale },
    );
    for (const row of cuesReader.getRows()) {
      const guidance = result[String(row[0])];
      const value = textOrNull(row[1]);
      if (guidance && value) guidance.coachingCues.push(value);
    }

    const mistakesReader = await connection.runAndReadAll(
      `
      SELECT exercise_id::VARCHAR, mistake, correction
      FROM exercise_common_mistakes
      WHERE locale=$locale
        AND list_contains(string_split($exerciseIds, ','), exercise_id::VARCHAR)
      ORDER BY exercise_id::VARCHAR, mistake_order
      `,
      { exerciseIds: idList, locale },
    );
    for (const row of mistakesReader.getRows()) {
      const guidance = result[String(row[0])];
      const mistake = textOrNull(row[1]);
      const correction = textOrNull(row[2]);
      if (guidance && mistake && correction) guidance.commonMistakes.push({ mistake, correction });
    }

    return result;
  });
}
