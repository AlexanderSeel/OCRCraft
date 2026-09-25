import path from "node:path";
import { DuckDBInstance } from "@duckdb/node-api";

const databasePath = process.env.OCRCRAFT_QUALITY_DB_PATH
  ?? path.join(process.cwd(), "data", "ocrcraft.initial.duckdb");

const instance = await DuckDBInstance.create(databasePath, { access_mode: "READ_ONLY" });
const connection = await instance.connect();

try {
  const movement = await rows(`
    SELECT e.seed_key,COALESCE(t.name,e.canonical_name),e.category
    FROM exercises e
    LEFT JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='de'
    WHERE e.seed_key IS NOT NULL
      AND e.archived=false
      AND NOT EXISTS (SELECT 1 FROM exercise_movement_patterns p WHERE p.exercise_id=e.id)
    ORDER BY e.seed_key
  `);

  const missingImages = await rows(`
    SELECT e.id::VARCHAR,e.seed_key,COALESCE(t.name,e.canonical_name),e.category
    FROM exercises e
    LEFT JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='de'
    WHERE e.archived=false
      AND NOT EXISTS (
        SELECT 1
        FROM exercise_media_assets m
        WHERE m.exercise_id=e.id
          AND m.media_type IN ('image','illustration')
          AND m.generation_status='generated'
          AND m.review_status<>'rejected'
          AND (
            m.source_type<>'external_reference'
            OR (
              COALESCE(m.rights_status,'unreviewed')='approved'
              AND COALESCE(trim(m.license_label),'')<>''
              AND COALESCE(trim(m.source_reference),'')<>''
              AND (COALESCE(m.consent_required,false)=false OR COALESCE(m.consent_confirmed,false)=true)
            )
          )
      )
    ORDER BY COALESCE(e.seed_key,''),COALESCE(t.name,e.canonical_name)
  `);

  const outdoorBlocked = await rows(`
    SELECT
      e.seed_key,
      COALESCE(t.name,e.canonical_name),
      r.disposition,
      r.review_status,
      r.reason,
      COALESCE(r.replacement_equipment,''),
      COALESCE((
        SELECT string_agg(COALESCE(eq.seed_key,eq.name_en,eq.name_de), ', ' ORDER BY COALESCE(eq.seed_key,eq.name_en,eq.name_de))
        FROM exercise_equipment ee
        JOIN equipment eq ON eq.id=ee.equipment_id
        WHERE ee.exercise_id=e.id
      ),'')
    FROM exercise_environment_reviews r
    JOIN exercises e ON e.id=r.exercise_id
    LEFT JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='de'
    WHERE e.archived=false
      AND (
        r.disposition='blocked'
        OR COALESCE(r.review_status,'catalog')='pending'
      )
    ORDER BY r.disposition,COALESCE(t.name,e.canonical_name)
  `);

  const clubObstacleOpen = await rows(`
    SELECT
      e.seed_key,
      COALESCE(t.name,e.canonical_name),
      COALESCE(g.equipment_configuration,''),
      COALESCE(g.clear_zone_metres,0),
      COALESCE((
        SELECT string_agg(sr.provider || ':' || sr.source_identifier, ', ' ORDER BY sr.provider, sr.source_identifier)
        FROM exercise_source_references sr
        WHERE sr.exercise_id=e.id
      ),'')
    FROM exercises e
    JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='de'
    LEFT JOIN exercise_obstacle_guidance g ON g.exercise_id=e.id AND g.locale='de'
    WHERE e.seed_key LIKE 'club-%'
    ORDER BY e.seed_key
  `);

  const payload = {
    movementPatternGaps: movement,
    missingUsableImages: missingImages,
    outdoorBlockedOrPending: outdoorBlocked,
    clubObstacleSnapshot: clubObstacleOpen,
  };

  console.log("DATA_QUALITY_SNAPSHOT_BEGIN");
  console.log(JSON.stringify(payload, null, 2));
  console.log("DATA_QUALITY_SNAPSHOT_END");
  console.log(
    "Data quality snapshot: "
      + movement.length + " movement gaps, "
      + missingImages.length + " exercises without usable images, "
      + outdoorBlocked.length + " blocked/pending outdoor reviews, "
      + clubObstacleOpen.length + " club obstacle rows.",
  );
} finally {
  connection.closeSync();
  instance.closeSync();
}

async function rows(sql) {
  const reader = await connection.runAndReadAll(sql);
  return reader.getRows().map((row) => row.map((value) => value == null ? null : String(value)));
}
