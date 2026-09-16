BEGIN TRANSACTION;

ALTER TABLE exercises ADD COLUMN IF NOT EXISTS laterality VARCHAR DEFAULT 'bilateral';
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS movement_plane VARCHAR DEFAULT 'sagittal';

UPDATE exercises
SET laterality = CASE
  WHEN category = 'running' OR EXISTS (SELECT 1 FROM exercise_movement_patterns p WHERE p.exercise_id=exercises.id AND p.movement_pattern_id IN ('run','walk','crawl')) THEN 'locomotion'
  WHEN seed_key LIKE '%single-leg%' OR seed_key LIKE '%unilateral%' THEN 'unilateral'
  WHEN seed_key LIKE '%alternat%' OR seed_key LIKE '%march%' THEN 'alternating'
  ELSE 'bilateral'
END,
movement_plane = CASE
  WHEN EXISTS (SELECT 1 FROM exercise_movement_patterns p WHERE p.exercise_id=exercises.id AND p.movement_pattern_id IN ('rotate','throw')) THEN 'transverse'
  WHEN EXISTS (SELECT 1 FROM exercise_movement_patterns p WHERE p.exercise_id=exercises.id AND p.movement_pattern_id IN ('lunge','squat','hinge','jump','run','walk','crawl')) THEN 'sagittal'
  WHEN category IN ('balance-agility','warmup') THEN 'multiplanar'
  ELSE 'sagittal'
END
WHERE seed_key IS NOT NULL;

INSERT INTO schema_migrations (version, name) VALUES (19, 'exercise_movement_classification');
COMMIT;
