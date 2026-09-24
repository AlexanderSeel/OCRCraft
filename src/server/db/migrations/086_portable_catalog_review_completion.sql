BEGIN TRANSACTION;

-- Keep studio-only imports visible and filterable without changing their
-- movement type. "Fitnessstudio" is an environment/source facet, not an
-- exercise movement classification.
INSERT OR IGNORE INTO tags (id,label_de,label_en)
VALUES ('fitnessstudio','Fitnessstudio','Gym');

INSERT OR IGNORE INTO exercise_tags (exercise_id,tag_id)
SELECT r.exercise_id,'fitnessstudio'
FROM exercise_environment_reviews r
WHERE r.disposition='blocked';

UPDATE exercises
SET archived=true,
    outdoor_suitable=false,
    updated_at=current_timestamp
WHERE id IN (
  SELECT exercise_id
  FROM exercise_environment_reviews
  WHERE disposition='blocked'
);

-- Complete the review ledger for the curated active catalogue. Unknown or
-- custom equipment is intentionally not guessed: it remains visible to the
-- later audit workflow instead of being silently declared portable.
INSERT OR IGNORE INTO exercise_environment_reviews (
  exercise_id,disposition,reason,replacement_equipment
)
SELECT
  e.id,
  'portable',
  CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM exercise_equipment ee WHERE ee.exercise_id=e.id
    )
      THEN 'Eigengewichts-, Lauf- oder Mobilitätsübung ohne verpflichtendes Equipment.'
    WHEN EXISTS (
      SELECT 1
      FROM exercise_equipment ee
      JOIN equipment eq ON eq.id=ee.equipment_id
      WHERE ee.exercise_id=e.id AND eq.seed_key IN ('pullup-bar','monkey-bars','balance-beam','wall','cargo-net')
    )
      THEN 'Freigegebene OCR-/Multirig-/Stationsübung mit dokumentiertem stationärem Equipment.'
    ELSE 'Equipment besteht ausschließlich aus freigegebenem portablem Hallen-/Outdoor-Material.'
  END,
  COALESCE((
    SELECT string_agg(eq.seed_key, ', ' ORDER BY eq.seed_key)
    FROM exercise_equipment ee
    JOIN equipment eq ON eq.id=ee.equipment_id
    WHERE ee.exercise_id=e.id
  ), '')
FROM exercises e
WHERE e.archived=false
  AND NOT EXISTS (
    SELECT 1 FROM exercise_environment_reviews r WHERE r.exercise_id=e.id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM exercise_equipment ee
    LEFT JOIN equipment eq ON eq.id=ee.equipment_id
    WHERE ee.exercise_id=e.id
      AND (eq.id IS NULL OR eq.seed_key IS NULL OR eq.seed_key NOT IN ('cones','mini-hurdles','agility-ladder','box','pullup-bar','monkey-bars','rings','rope','kettlebell','sandbag','atlas-ball','bucket','sled','tire','medicine-ball','spear-trainer','balance-beam','resistance-band','mat','wall','cargo-net'))
  );

INSERT OR IGNORE INTO schema_migrations (version,name)
VALUES (86,'portable_catalog_review_completion');

COMMIT;
