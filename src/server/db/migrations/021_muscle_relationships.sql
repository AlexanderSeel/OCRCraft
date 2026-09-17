BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS exercise_muscle_oppositions (
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  primary_region_id VARCHAR NOT NULL REFERENCES body_regions(id),
  opposing_region_id VARCHAR NOT NULL REFERENCES body_regions(id),
  relationship VARCHAR NOT NULL DEFAULT 'antagonist',
  PRIMARY KEY (exercise_id, primary_region_id, opposing_region_id)
);

INSERT OR IGNORE INTO body_regions (id,label_de,label_en) VALUES ('hip-flexors','Hüftbeuger','Hip Flexors');

INSERT OR IGNORE INTO exercise_body_regions (exercise_id, body_region_id, emphasis)
SELECT e.id,
  CASE primary_region_id
    WHEN 'chest' THEN 'upper-back'
    WHEN 'upper-back' THEN 'chest'
    WHEN 'lats' THEN 'chest'
    WHEN 'quadriceps' THEN 'hamstrings'
    WHEN 'hamstrings' THEN 'quadriceps'
    WHEN 'glutes' THEN 'hip-flexors'
    WHEN 'shoulders' THEN 'lats'
    WHEN 'biceps' THEN 'triceps'
    WHEN 'triceps' THEN 'biceps'
    WHEN 'core' THEN 'lower-back'
    ELSE NULL
  END,
  'secondary'
FROM exercises e
JOIN (SELECT exercise_id, min(body_region_id) AS primary_region_id FROM exercise_body_regions WHERE emphasis='primary' GROUP BY exercise_id) p ON p.exercise_id=e.id
WHERE e.seed_key IS NOT NULL
  AND CASE primary_region_id
    WHEN 'chest' THEN 'upper-back' WHEN 'upper-back' THEN 'chest' WHEN 'lats' THEN 'chest'
    WHEN 'quadriceps' THEN 'hamstrings' WHEN 'hamstrings' THEN 'quadriceps' WHEN 'glutes' THEN 'hip-flexors'
    WHEN 'shoulders' THEN 'lats' WHEN 'biceps' THEN 'triceps' WHEN 'triceps' THEN 'biceps' WHEN 'core' THEN 'lower-back'
    ELSE NULL END IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM exercise_body_regions b WHERE b.exercise_id=e.id AND b.emphasis='secondary');

INSERT OR IGNORE INTO exercise_muscle_oppositions (exercise_id, primary_region_id, opposing_region_id)
SELECT ebr.exercise_id, ebr.body_region_id,
  CASE ebr.body_region_id
    WHEN 'chest' THEN 'upper-back' WHEN 'upper-back' THEN 'chest' WHEN 'lats' THEN 'chest'
    WHEN 'quadriceps' THEN 'hamstrings' WHEN 'hamstrings' THEN 'quadriceps' WHEN 'glutes' THEN 'hip-flexors'
    WHEN 'shoulders' THEN 'lats' WHEN 'biceps' THEN 'triceps' WHEN 'triceps' THEN 'biceps' WHEN 'core' THEN 'lower-back'
    ELSE NULL END
FROM exercise_body_regions ebr
JOIN exercises e ON e.id=ebr.exercise_id
WHERE e.seed_key IS NOT NULL AND ebr.emphasis='primary'
  AND CASE ebr.body_region_id
    WHEN 'chest' THEN 'upper-back' WHEN 'upper-back' THEN 'chest' WHEN 'lats' THEN 'chest'
    WHEN 'quadriceps' THEN 'hamstrings' WHEN 'hamstrings' THEN 'quadriceps' WHEN 'glutes' THEN 'hip-flexors'
    WHEN 'shoulders' THEN 'lats' WHEN 'biceps' THEN 'triceps' WHEN 'triceps' THEN 'biceps' WHEN 'core' THEN 'lower-back'
    ELSE NULL END IS NOT NULL;

INSERT INTO schema_migrations (version,name) VALUES (21,'muscle_relationships');
COMMIT;
