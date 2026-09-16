BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS exercise_training_phases (
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  phase VARCHAR NOT NULL CHECK (phase IN ('warmup','main','cooldown')),
  PRIMARY KEY (exercise_id, phase)
);

INSERT OR IGNORE INTO exercise_training_phases (exercise_id, phase)
SELECT id, CASE default_phase
  WHEN 'warm-up' THEN 'warmup'
  WHEN 'cooldown' THEN 'cooldown'
  ELSE 'main'
END
FROM exercises
WHERE seed_key IS NOT NULL;

INSERT OR IGNORE INTO exercise_training_phases (exercise_id, phase)
SELECT id, 'warmup' FROM exercises
WHERE seed_key IS NOT NULL AND category IN ('warmup','mobility','balance-agility');

INSERT OR IGNORE INTO exercise_training_phases (exercise_id, phase)
SELECT id, 'cooldown' FROM exercises
WHERE seed_key IS NOT NULL AND category IN ('cooldown','mobility');

CREATE INDEX IF NOT EXISTS exercise_training_phases_phase_idx
  ON exercise_training_phases(phase, exercise_id);

INSERT INTO schema_migrations (version, name) VALUES (17, 'exercise_training_phases');
COMMIT;
