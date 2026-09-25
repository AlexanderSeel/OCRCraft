BEGIN TRANSACTION;

-- Seed exercises are original OCRCraft catalog content. Record that provenance
-- explicitly so completeness review does not confuse missing source metadata
-- with missing coaching or safety content.
INSERT INTO exercise_source_references (
  exercise_id,provider,title,source_url,source_type,license_label,notes
)
SELECT
  e.id,
  'OCRCraft',
  'OCRCraft Seed Catalog v1.0',
  'ocrcraft://seed-catalog/' || e.seed_key,
  'trainer_authored',
  'OCRCraft original content',
  'Canonical OCRCraft seed entry; DE/EN exercise guidance is maintained in the application catalog.'
FROM exercises e
WHERE e.seed_key IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM exercise_source_references r WHERE r.exercise_id=e.id
  );

INSERT INTO schema_migrations (version,name)
VALUES (88,'seed_catalog_provenance');

COMMIT;
