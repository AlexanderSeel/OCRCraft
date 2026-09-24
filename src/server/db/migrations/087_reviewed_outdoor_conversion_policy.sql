BEGIN TRANSACTION;

-- Converted import variants are safe only after an explicit trainer/admin
-- review. Portable aliases are normalized; ambiguous generic machines are
-- blocked instead of receiving heuristic substitutions.
ALTER TABLE exercise_environment_reviews
  ADD COLUMN IF NOT EXISTS review_status VARCHAR DEFAULT 'catalog';
ALTER TABLE exercise_environment_reviews
  ADD COLUMN IF NOT EXISTS reviewed_by UUID;

UPDATE exercise_environment_reviews
SET review_status='pending',
    reviewed_by=NULL
WHERE disposition='converted';

INSERT OR IGNORE INTO exercise_equipment (exercise_id,equipment_id,quantity_required)
SELECT ee.exercise_id,replacement.id,ee.quantity_required
FROM exercise_equipment ee
JOIN equipment source ON source.id=ee.equipment_id
JOIN equipment replacement ON replacement.seed_key=CASE source.seed_key
  WHEN 'external-box' THEN 'box'
  WHEN 'external-mat' THEN 'mat'
  ELSE NULL
END
WHERE source.seed_key IN ('external-box','external-mat');

DELETE FROM exercise_equipment
WHERE equipment_id IN (
  SELECT id FROM equipment
  WHERE seed_key IN ('external-box','external-mat','external-bodyweight')
);

UPDATE exercise_environment_reviews
SET disposition='blocked',
    reason='Generische Maschinenabhängigkeit ohne eindeutig freigegebene Bewegungs-/Widerstandslinie; manuelle Fachprüfung erforderlich.',
    replacement_equipment='',
    review_status='pending',
    reviewed_by=NULL,
    reviewed_at=current_timestamp
WHERE exercise_id IN (
  SELECT ee.exercise_id
  FROM exercise_equipment ee
  JOIN equipment eq ON eq.id=ee.equipment_id
  WHERE eq.seed_key='external-machine'
);

UPDATE exercises
SET archived=true,
    outdoor_suitable=false,
    updated_at=current_timestamp
WHERE id IN (
  SELECT exercise_id
  FROM exercise_environment_reviews
  WHERE disposition='blocked'
    AND review_status='pending'
);

INSERT OR IGNORE INTO exercise_tags (exercise_id,tag_id)
SELECT r.exercise_id,'fitnessstudio'
FROM exercise_environment_reviews r
WHERE r.disposition='blocked';

DELETE FROM exercise_outdoor_variant_equipment
WHERE exercise_id IN (
  SELECT exercise_id
  FROM exercise_environment_reviews
  WHERE disposition IN ('portable','converted')
);

INSERT OR REPLACE INTO exercise_outdoor_variant_equipment (exercise_id,equipment_id,quantity_required)
SELECT ee.exercise_id,ee.equipment_id,ee.quantity_required
FROM exercise_equipment ee
JOIN exercise_environment_reviews r ON r.exercise_id=ee.exercise_id
JOIN exercises e ON e.id=ee.exercise_id
WHERE e.archived=false AND r.disposition IN ('portable','converted');

UPDATE exercise_environment_reviews
SET replacement_equipment=COALESCE((
  SELECT string_agg(eq.seed_key, ', ' ORDER BY eq.seed_key)
  FROM exercise_outdoor_variant_equipment ove
  JOIN equipment eq ON eq.id=ove.equipment_id
  WHERE ove.exercise_id=exercise_environment_reviews.exercise_id
), '')
WHERE disposition IN ('portable','converted');

INSERT OR IGNORE INTO schema_migrations (version,name)
VALUES (87,'reviewed_outdoor_conversion_policy');

COMMIT;
