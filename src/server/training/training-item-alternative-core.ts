import type { DuckDBConnection } from "@duckdb/node-api";

export const TRAINING_ALTERNATIVE_MODES = ["easier", "harder", "equipment"] as const;
export type TrainingAlternativeMode = (typeof TRAINING_ALTERNATIVE_MODES)[number];

export interface TrainingItemAlternative {
  readonly exerciseId: string;
  readonly name: string;
  readonly category: string;
  readonly difficulty: string;
  readonly riskLevel: string;
  readonly equipment: readonly string[];
  readonly movementOverlap: number;
  readonly bodyRegionOverlap: number;
  readonly score: number;
  readonly reason: string;
}

const DIFFICULTY_SQL = "CASE COALESCE(e.difficulty,'beginner') WHEN 'advanced' THEN 3 WHEN 'intermediate' THEN 2 ELSE 1 END";

export async function listTrainingItemAlternativesCore(
  connection: DuckDBConnection,
  sessionId: string,
  itemId: string,
  mode: TrainingAlternativeMode,
  limit = 12,
): Promise<readonly TrainingItemAlternative[]> {
  const currentReader = await connection.runAndReadAll(
    `
    SELECT
      e.id::VARCHAR,
      COALESCE(e.category,'general'),
      ${DIFFICULTY_SQL} AS difficulty_rank,
      (SELECT count(*) FROM exercise_equipment ee WHERE ee.exercise_id=e.id) AS equipment_count,
      s.locale
    FROM training_items i
    JOIN training_phases p ON p.id=i.training_phase_id
    JOIN training_sessions s ON s.id=p.training_session_id
    JOIN exercises e ON e.id=i.exercise_id
    WHERE i.id=$itemId::UUID AND s.id=$sessionId::UUID
    `,
    { sessionId, itemId },
  );
  const current = currentReader.getRows()[0];
  if (!current) return [];

  const currentExerciseId = String(current[0]);
  const currentCategory = String(current[1]);
  const currentDifficulty = Number(current[2]);
  const currentEquipmentCount = Number(current[3]);
  const locale = String(current[4]);

  const reader = await connection.runAndReadAll(
    `
    SELECT
      e.id::VARCHAR,
      t.name,
      COALESCE(e.category,'general'),
      COALESCE(e.difficulty,'beginner'),
      e.risk_level,
      COALESCE((
        SELECT string_agg(CASE WHEN $locale='de' THEN eq.name_de ELSE COALESCE(eq.name_en,eq.name_de) END, ' | ' ORDER BY eq.name_de)
        FROM exercise_equipment ee
        JOIN equipment eq ON eq.id=ee.equipment_id
        WHERE ee.exercise_id=e.id
      ), ''),
      (
        SELECT count(*)
        FROM exercise_movement_patterns candidate
        WHERE candidate.exercise_id=e.id
          AND candidate.movement_pattern_id IN (
            SELECT source.movement_pattern_id
            FROM exercise_movement_patterns source
            WHERE source.exercise_id=$currentExerciseId::UUID
          )
      ) AS movement_overlap,
      (
        SELECT count(*)
        FROM exercise_body_regions candidate
        WHERE candidate.exercise_id=e.id
          AND candidate.body_region_id IN (
            SELECT source.body_region_id
            FROM exercise_body_regions source
            WHERE source.exercise_id=$currentExerciseId::UUID
          )
      ) AS body_overlap,
      (SELECT count(*) FROM exercise_equipment ee WHERE ee.exercise_id=e.id) AS equipment_count,
      ${DIFFICULTY_SQL} AS difficulty_rank
    FROM exercises e
    JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale=$locale
    WHERE e.archived=false AND e.id<>$currentExerciseId::UUID
    ORDER BY
      (
        CASE WHEN COALESCE(e.category,'general')=$currentCategory THEN 45 ELSE 0 END
        + movement_overlap * 30
        + body_overlap * 18
        + CASE
            WHEN $mode='easier' AND difficulty_rank < $currentDifficulty THEN 55
            WHEN $mode='easier' AND difficulty_rank = $currentDifficulty THEN 12
            WHEN $mode='harder' AND difficulty_rank > $currentDifficulty THEN 55
            WHEN $mode='harder' AND difficulty_rank = $currentDifficulty THEN 12
            WHEN $mode='equipment' AND equipment_count = 0 THEN 55
            WHEN $mode='equipment' AND equipment_count < $currentEquipmentCount THEN 40
            ELSE 0
          END
        - CASE
            WHEN $mode='easier' AND difficulty_rank > $currentDifficulty THEN 45
            WHEN $mode='harder' AND difficulty_rank < $currentDifficulty THEN 45
            WHEN $mode='equipment' AND equipment_count > $currentEquipmentCount THEN 30
            ELSE 0
          END
      ) DESC,
      movement_overlap DESC,
      body_overlap DESC,
      t.name
    LIMIT $limit
    `,
    {
      locale,
      currentExerciseId,
      currentCategory,
      currentDifficulty,
      currentEquipmentCount,
      mode,
      limit: Math.max(1, Math.min(limit, 30)),
    },
  );

  return reader.getRows().map((row) => {
    const equipment = String(row[5] ?? "").split(" | ").filter(Boolean);
    const movementOverlap = Number(row[6]);
    const bodyRegionOverlap = Number(row[7]);
    const equipmentCount = Number(row[8]);
    const difficultyRank = Number(row[9]);
    const sameCategory = String(row[2]) === currentCategory;
    const score =
      (sameCategory ? 45 : 0)
      + movementOverlap * 30
      + bodyRegionOverlap * 18
      + modeBoost(mode, difficultyRank, currentDifficulty, equipmentCount, currentEquipmentCount);

    return {
      exerciseId: String(row[0]),
      name: String(row[1]),
      category: String(row[2]),
      difficulty: String(row[3]),
      riskLevel: String(row[4]),
      equipment,
      movementOverlap,
      bodyRegionOverlap,
      score,
      reason: alternativeReason(
        mode,
        difficultyRank,
        currentDifficulty,
        equipmentCount,
        currentEquipmentCount,
        movementOverlap,
        bodyRegionOverlap,
        sameCategory,
      ),
    };
  });
}

function modeBoost(
  mode: TrainingAlternativeMode,
  difficulty: number,
  currentDifficulty: number,
  equipmentCount: number,
  currentEquipmentCount: number,
): number {
  if (mode === "easier") {
    if (difficulty < currentDifficulty) return 55;
    if (difficulty === currentDifficulty) return 12;
    return -45;
  }
  if (mode === "harder") {
    if (difficulty > currentDifficulty) return 55;
    if (difficulty === currentDifficulty) return 12;
    return -45;
  }
  if (equipmentCount === 0) return 55;
  if (equipmentCount < currentEquipmentCount) return 40;
  if (equipmentCount > currentEquipmentCount) return -30;
  return 0;
}

function alternativeReason(
  mode: TrainingAlternativeMode,
  difficulty: number,
  currentDifficulty: number,
  equipmentCount: number,
  currentEquipmentCount: number,
  movementOverlap: number,
  bodyOverlap: number,
  sameCategory: boolean,
): string {
  const matches = [
    movementOverlap > 0 ? `${movementOverlap} gemeinsame Bewegungsmuster` : null,
    bodyOverlap > 0 ? `${bodyOverlap} gemeinsame Körperregionen` : null,
    sameCategory ? "gleicher Trainingsbereich" : null,
  ].filter(Boolean);

  let primary: string;
  if (mode === "easier") {
    primary = difficulty < currentDifficulty ? "niedrigere Schwierigkeitsstufe" : "ähnliche Schwierigkeitsstufe";
  } else if (mode === "harder") {
    primary = difficulty > currentDifficulty ? "höhere Schwierigkeitsstufe" : "ähnliche Schwierigkeitsstufe";
  } else {
    primary = equipmentCount === 0
      ? "ohne Equipment"
      : equipmentCount < currentEquipmentCount
        ? "weniger Equipment-Arten"
        : "ähnlicher Equipment-Bedarf";
  }

  return [primary, ...matches].join(" · ");
}
