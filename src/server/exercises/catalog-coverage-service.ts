import "server-only";

import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import { buildCatalogCoverageReport, type CatalogCoverageInput, type CatalogCoverageReport } from "./catalog-coverage-core";

export async function getCatalogCoverageReport(): Promise<CatalogCoverageReport> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      SELECT e.id::VARCHAR,
        COALESCE(NULLIF(TRIM(t_de.name), ''), NULLIF(TRIM(t_en.name), ''), e.canonical_name, e.id::VARCHAR),
        EXISTS (SELECT 1 FROM exercise_translations t WHERE t.exercise_id=e.id AND t.locale='de' AND TRIM(t.name)<>''),
        EXISTS (SELECT 1 FROM exercise_translations t WHERE t.exercise_id=e.id AND t.locale='en' AND TRIM(t.name)<>''),
        COALESCE(TRIM(e.default_phase), '')<>'',
        COALESCE(TRIM(e.risk_level), '')<>'' AND e.min_age IS NOT NULL,
        EXISTS (SELECT 1 FROM exercise_training_goals g WHERE g.exercise_id=e.id),
        EXISTS (SELECT 1 FROM exercise_equipment q WHERE q.exercise_id=e.id),
        EXISTS (SELECT 1 FROM exercise_body_regions b WHERE b.exercise_id=e.id AND b.emphasis='primary'),
        (e.category='ocr-skill'
          OR EXISTS (SELECT 1 FROM exercise_tags tag WHERE tag.exercise_id=e.id AND tag.tag_id='ocr')
          OR EXISTS (SELECT 1 FROM exercise_movement_patterns p WHERE p.exercise_id=e.id AND p.movement_pattern_id IN ('climb','hang','pull','carry','drag','balance','swing'))),
        e.seed_key LIKE 'club-%',
        EXISTS (SELECT 1 FROM exercise_obstacle_guidance g WHERE g.exercise_id=e.id AND TRIM(g.equipment_configuration)<>'' AND g.clear_zone_metres>0),
        EXISTS (SELECT 1 FROM exercise_ocr_skills s WHERE s.exercise_id=e.id),
        COALESCE((
          SELECT state.dimensions_status='approved'
          FROM club_obstacle_review_state state
          WHERE state.exercise_id=e.id
        ), false)
      FROM exercises e
      LEFT JOIN exercise_translations t_de ON t_de.exercise_id=e.id AND t_de.locale='de'
      LEFT JOIN exercise_translations t_en ON t_en.exercise_id=e.id AND t_en.locale='en'
      WHERE e.archived=false
      ORDER BY COALESCE(t_de.name,t_en.name,e.canonical_name,e.id::VARCHAR)
    `);
    const rows: CatalogCoverageInput[] = reader.getRows().map((row) => ({
      id: String(row[0]),
      name: String(row[1]),
      hasGerman: Boolean(row[2]),
      hasEnglish: Boolean(row[3]),
      hasPhase: Boolean(row[4]),
      hasRiskAndAge: Boolean(row[5]),
      hasGoal: Boolean(row[6]),
      hasEquipment: Boolean(row[7]),
      hasBodyRegion: Boolean(row[8]),
      hasOcrCapability: Boolean(row[9]),
      isClubObstacle: Boolean(row[10]),
      hasClubGuidance: Boolean(row[11]),
      hasOcrSkillMapping: Boolean(row[12]),
      clubDimensionsApproved: Boolean(row[13]),
    }));
    return buildCatalogCoverageReport(rows);
  });
}
