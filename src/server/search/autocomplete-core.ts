import type { DuckDBConnection } from "@duckdb/node-api";
import type { SearchLocale } from "./exercise-search-documents";
import { normalizeSearchRankingWeights, type SearchRankingWeights } from "./search-profile-core";

export interface ExerciseAutocompleteItem {
  readonly id: string;
  readonly label: string;
  readonly category: string;
  readonly matchedAlias: string | null;
  readonly matchedContext: string | null;
}

function goalLabelSql(locale: SearchLocale): string {
  return locale === "de"
    ? `CASE etg.goal
        WHEN 'strength' THEN 'Kraft'
        WHEN 'strength_endurance' THEN 'Kraftausdauer'
        WHEN 'endurance' THEN 'Ausdauer'
        WHEN 'speed' THEN 'Schnelligkeit'
        WHEN 'coordination' THEN 'Koordination'
        WHEN 'balance' THEN 'Balance'
        WHEN 'mobility' THEN 'Mobilität'
        WHEN 'grip' THEN 'Griffkraft'
        WHEN 'ocr_technique' THEN 'OCR-Technik'
        WHEN 'recovery' THEN 'Regeneration'
        WHEN 'teamwork' THEN 'Teamwork'
        ELSE etg.goal END`
    : `CASE etg.goal
        WHEN 'strength' THEN 'Strength'
        WHEN 'strength_endurance' THEN 'Strength Endurance'
        WHEN 'endurance' THEN 'Endurance'
        WHEN 'speed' THEN 'Speed'
        WHEN 'coordination' THEN 'Coordination'
        WHEN 'balance' THEN 'Balance'
        WHEN 'mobility' THEN 'Mobility'
        WHEN 'grip' THEN 'Grip'
        WHEN 'ocr_technique' THEN 'OCR Technique'
        WHEN 'recovery' THEN 'Recovery'
        WHEN 'teamwork' THEN 'Teamwork'
        ELSE etg.goal END`;
}

export async function runExerciseAutocomplete(
  connection: DuckDBConnection,
  query: string,
  locale: SearchLocale,
  limit: number,
  rankingWeights?: Partial<SearchRankingWeights>,
): Promise<readonly ExerciseAutocompleteItem[]> {
  const goalLabel = goalLabelSql(locale);
  const weights = normalizeSearchRankingWeights(rankingWeights);
  const reader = await connection.runAndReadAll(
    `
    SELECT
      e.id::VARCHAR,
      t.name,
      COALESCE(e.category, 'general'),
      (
        SELECT a.alias
        FROM exercise_aliases a
        WHERE a.exercise_id=e.id
          AND a.locale=$locale
          AND a.alias ILIKE '%' || $query || '%'
        ORDER BY CASE WHEN a.alias ILIKE $query || '%' THEN 0 ELSE 1 END, length(a.alias)
        LIMIT 1
      ) AS matched_alias,
      COALESCE(
        CASE WHEN COALESCE(e.category, 'general') ILIKE '%' || $query || '%' THEN COALESCE(e.category, 'general') END,
        (
          SELECT ${goalLabel}
          FROM exercise_training_goals etg
          WHERE etg.exercise_id=e.id
            AND (etg.goal ILIKE '%' || $query || '%' OR (${goalLabel}) ILIKE '%' || $query || '%')
          ORDER BY length(${goalLabel})
          LIMIT 1
        ),
        (
          SELECT CASE WHEN $locale='de' THEN tag.label_de ELSE tag.label_en END
          FROM exercise_tags et
          JOIN tags tag ON tag.id=et.tag_id
          WHERE et.exercise_id=e.id
            AND (
              et.tag_id ILIKE '%' || $query || '%'
              OR (CASE WHEN $locale='de' THEN tag.label_de ELSE tag.label_en END) ILIKE '%' || $query || '%'
            )
          ORDER BY length(CASE WHEN $locale='de' THEN tag.label_de ELSE tag.label_en END)
          LIMIT 1
        ),
        (
          SELECT CASE WHEN $locale='de' THEN mp.label_de ELSE mp.label_en END
          FROM exercise_movement_patterns emp
          JOIN movement_patterns mp ON mp.id=emp.movement_pattern_id
          WHERE emp.exercise_id=e.id
            AND (
              emp.movement_pattern_id ILIKE '%' || $query || '%'
              OR (CASE WHEN $locale='de' THEN mp.label_de ELSE mp.label_en END) ILIKE '%' || $query || '%'
            )
          ORDER BY length(CASE WHEN $locale='de' THEN mp.label_de ELSE mp.label_en END)
          LIMIT 1
        ),
        (
          SELECT CASE WHEN $locale='de' THEN eq.name_de ELSE COALESCE(eq.name_en, eq.name_de) END
          FROM exercise_equipment ee
          JOIN equipment eq ON eq.id=ee.equipment_id
          WHERE ee.exercise_id=e.id
            AND (CASE WHEN $locale='de' THEN eq.name_de ELSE COALESCE(eq.name_en, eq.name_de) END) ILIKE '%' || $query || '%'
          ORDER BY length(CASE WHEN $locale='de' THEN eq.name_de ELSE COALESCE(eq.name_en, eq.name_de) END)
          LIMIT 1
        ),
        (
          SELECT CASE WHEN $locale='de' THEN br.label_de ELSE br.label_en END
          FROM exercise_body_regions ebr
          JOIN body_regions br ON br.id=ebr.body_region_id
          WHERE ebr.exercise_id=e.id
            AND (
              ebr.body_region_id ILIKE '%' || $query || '%'
              OR (CASE WHEN $locale='de' THEN br.label_de ELSE br.label_en END) ILIKE '%' || $query || '%'
            )
          ORDER BY length(CASE WHEN $locale='de' THEN br.label_de ELSE br.label_en END)
          LIMIT 1
        )
      ) AS matched_context,
      (
        CASE WHEN COALESCE(t.summary,'') ILIKE '%' || $query || '%' THEN $summaryWeight ELSE 0 END
        + CASE WHEN COALESCE(e.category,'general') ILIKE '%' || $query || '%' THEN $taxonomyWeight ELSE 0 END
        + CASE WHEN EXISTS (
          SELECT 1 FROM exercise_aliases a
          WHERE a.exercise_id=e.id AND a.locale=$locale AND a.alias ILIKE '%' || $query || '%'
        ) THEN $aliasWeight ELSE 0 END
        + CASE WHEN EXISTS (
          SELECT 1 FROM exercise_training_goals etg
          WHERE etg.exercise_id=e.id
            AND (etg.goal ILIKE '%' || $query || '%' OR (${goalLabel}) ILIKE '%' || $query || '%')
        ) OR EXISTS (
          SELECT 1 FROM exercise_tags et JOIN tags tag ON tag.id=et.tag_id
          WHERE et.exercise_id=e.id
            AND (et.tag_id ILIKE '%' || $query || '%'
              OR (CASE WHEN $locale='de' THEN tag.label_de ELSE tag.label_en END) ILIKE '%' || $query || '%')
        ) OR EXISTS (
          SELECT 1 FROM exercise_movement_patterns emp JOIN movement_patterns mp ON mp.id=emp.movement_pattern_id
          WHERE emp.exercise_id=e.id
            AND (emp.movement_pattern_id ILIKE '%' || $query || '%'
              OR (CASE WHEN $locale='de' THEN mp.label_de ELSE mp.label_en END) ILIKE '%' || $query || '%')
        ) THEN $taxonomyWeight ELSE 0 END
        + CASE WHEN EXISTS (
          SELECT 1 FROM exercise_equipment ee JOIN equipment eq ON eq.id=ee.equipment_id
          WHERE ee.exercise_id=e.id
            AND (CASE WHEN $locale='de' THEN eq.name_de ELSE COALESCE(eq.name_en,eq.name_de) END) ILIKE '%' || $query || '%'
        ) THEN $equipmentWeight ELSE 0 END
        + CASE WHEN EXISTS (
          SELECT 1 FROM exercise_body_regions ebr JOIN body_regions br ON br.id=ebr.body_region_id
          WHERE ebr.exercise_id=e.id
            AND (ebr.body_region_id ILIKE '%' || $query || '%'
              OR (CASE WHEN $locale='de' THEN br.label_de ELSE br.label_en END) ILIKE '%' || $query || '%')
        ) THEN $bodyRegionsWeight ELSE 0 END
      ) AS weighted_context
    FROM exercises e
    JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale=$locale
    WHERE e.archived=false
      AND (
        t.name ILIKE '%' || $query || '%'
        OR COALESCE(t.summary, '') ILIKE '%' || $query || '%'
        OR COALESCE(e.category, 'general') ILIKE '%' || $query || '%'
        OR EXISTS (
          SELECT 1 FROM exercise_aliases a
          WHERE a.exercise_id=e.id
            AND a.locale=$locale
            AND a.alias ILIKE '%' || $query || '%'
        )
        OR EXISTS (
          SELECT 1 FROM exercise_training_goals etg
          WHERE etg.exercise_id=e.id
            AND (etg.goal ILIKE '%' || $query || '%' OR (${goalLabel}) ILIKE '%' || $query || '%')
        )
        OR EXISTS (
          SELECT 1 FROM exercise_tags et
          JOIN tags tag ON tag.id=et.tag_id
          WHERE et.exercise_id=e.id
            AND (
              et.tag_id ILIKE '%' || $query || '%'
              OR (CASE WHEN $locale='de' THEN tag.label_de ELSE tag.label_en END) ILIKE '%' || $query || '%'
            )
        )
        OR EXISTS (
          SELECT 1 FROM exercise_movement_patterns emp
          JOIN movement_patterns mp ON mp.id=emp.movement_pattern_id
          WHERE emp.exercise_id=e.id
            AND (
              emp.movement_pattern_id ILIKE '%' || $query || '%'
              OR (CASE WHEN $locale='de' THEN mp.label_de ELSE mp.label_en END) ILIKE '%' || $query || '%'
            )
        )
        OR EXISTS (
          SELECT 1 FROM exercise_equipment ee
          JOIN equipment eq ON eq.id=ee.equipment_id
          WHERE ee.exercise_id=e.id
            AND (CASE WHEN $locale='de' THEN eq.name_de ELSE COALESCE(eq.name_en, eq.name_de) END) ILIKE '%' || $query || '%'
        )
        OR EXISTS (
          SELECT 1 FROM exercise_body_regions ebr
          JOIN body_regions br ON br.id=ebr.body_region_id
          WHERE ebr.exercise_id=e.id
            AND (
              ebr.body_region_id ILIKE '%' || $query || '%'
              OR (CASE WHEN $locale='de' THEN br.label_de ELSE br.label_en END) ILIKE '%' || $query || '%'
            )
        )
      )
    ORDER BY
      CASE
        WHEN lower(t.name)=lower($query) THEN $exactWeight
        WHEN t.name ILIKE $query || '%' THEN $prefixWeight
        WHEN EXISTS (
          SELECT 1 FROM exercise_aliases a
          WHERE a.exercise_id=e.id AND a.locale=$locale AND a.alias ILIKE $query || '%'
        ) THEN $aliasWeight
        ELSE 0
      END DESC,
      weighted_context DESC,
      length(t.name),
      t.name
    LIMIT $limit
    `,
    {
      locale,
      query,
      limit,
      exactWeight: weights.exact,
      prefixWeight: weights.prefix,
      aliasWeight: weights.alias,
      summaryWeight: weights.summary,
      taxonomyWeight: weights.taxonomy,
      bodyRegionsWeight: weights.bodyRegions,
      equipmentWeight: weights.equipment,
    },
  );

  return reader.getRows().map((row) => ({
    id: String(row[0]),
    label: String(row[1]),
    category: String(row[2]),
    matchedAlias: row[3] == null ? null : String(row[3]),
    matchedContext: row[4] == null ? null : String(row[4]),
  }));
}
