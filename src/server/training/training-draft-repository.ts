import "server-only";

import type { ExerciseCategory } from "@/domain/exercise/model";
import type { TrainingDraftExerciseCandidate } from "@/domain/training/draft";
import type { Audience, RiskLevel, TrainingPhaseKind } from "@/domain/training/model";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";

interface ListTrainingDraftCandidatesOptions {
  readonly audience: Audience;
  readonly minAge?: number;
  readonly locale?: "de" | "en";
}

export async function listTrainingDraftCandidates({
  audience,
  minAge,
  locale = "de",
}: ListTrainingDraftCandidatesOptions): Promise<readonly TrainingDraftExerciseCandidate[]> {
  await ensureDatabaseReady();

  return withDuckDbConnection(async (connection) => {
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
        d.level_1,
        d.level_2,
        d.level_3
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
      ORDER BY t.name
      `,
      {
        locale,
        audience,
        minAge: minAge ?? null,
      },
    );

    return reader.getRows().map((row) => ({
      id: String(row[0]),
      name: String(row[1]),
      category: String(row[2]) as ExerciseCategory,
      defaultPhase: row[3] == null ? null : String(row[3]) as TrainingPhaseKind,
      riskLevel: String(row[4]) as RiskLevel,
      minAge: row[5] == null ? null : Number(row[5]),
      bodyRegions: String(row[6] ?? "").split(" | ").filter(Boolean),
      equipment: String(row[7] ?? "").split(" | ").filter(Boolean),
      tags: String(row[8] ?? "").split(" | ").filter(Boolean),
      defaultDurationSeconds: row[9] == null ? null : Number(row[9]),
      instructions: row[10] == null ? undefined : String(row[10]),
      level1: row[11] == null ? undefined : String(row[11]),
      level2: row[12] == null ? undefined : String(row[12]),
      level3: row[13] == null ? undefined : String(row[13]),
    }));
  });
}
