BEGIN TRANSACTION;

-- Complete the normalization for imported records that use portable
-- equipment under an external provider label.
INSERT OR IGNORE INTO exercise_equipment (exercise_id,equipment_id,quantity_required)
SELECT ee.exercise_id,replacement.id,ee.quantity_required
FROM exercise_equipment ee
JOIN equipment source ON source.id=ee.equipment_id
JOIN equipment replacement ON replacement.seed_key=CASE source.seed_key
  WHEN 'external-leverage-machine' THEN 'resistance-band'
  WHEN 'external-roller' THEN 'mat'
  WHEN 'external-rope' THEN 'rope'
  WHEN 'external-sled-machine' THEN 'sled'
  WHEN 'external-tire' THEN 'tire'
  ELSE NULL
END
WHERE source.seed_key IN (
  'external-leverage-machine','external-roller','external-rope',
  'external-sled-machine','external-tire'
);

DELETE FROM exercise_equipment
WHERE equipment_id IN (
  SELECT id FROM equipment WHERE seed_key IN (
    'external-leverage-machine','external-roller','external-rope',
    'external-sled-machine','external-tire'
  )
);

INSERT OR REPLACE INTO exercise_outdoor_variant_equipment (exercise_id,equipment_id,quantity_required)
SELECT ee.exercise_id,ee.equipment_id,ee.quantity_required
FROM exercise_equipment ee
JOIN exercises e ON e.id=ee.exercise_id
JOIN exercise_environment_reviews r ON r.exercise_id=e.id
WHERE e.archived=false AND r.disposition IN ('converted','portable');

UPDATE exercise_environment_reviews
SET disposition='converted',
    reason='Studio-/Provider-Gerät auf portables Outdoor- oder Hallen-Equipment normalisiert.',
    replacement_equipment=COALESCE((
      SELECT string_agg(eq.seed_key, ', ' ORDER BY eq.seed_key)
      FROM exercise_outdoor_variant_equipment ove
      JOIN equipment eq ON eq.id=ove.equipment_id
      WHERE ove.exercise_id=exercise_environment_reviews.exercise_id
    ), ''),
    reviewed_at=current_timestamp
WHERE disposition='converted';

INSERT OR IGNORE INTO schema_migrations (version,name)
VALUES (85,'portable_training_equipment_followup');

COMMIT;
