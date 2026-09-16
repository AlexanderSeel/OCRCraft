BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS exercise_training_goals (
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  goal VARCHAR NOT NULL CHECK (goal IN ('strength','strength_endurance','endurance','speed','coordination','balance','mobility','grip','ocr_technique','recovery','teamwork')),
  PRIMARY KEY (exercise_id, goal)
);

INSERT OR IGNORE INTO exercise_training_goals (exercise_id, goal)
SELECT id,
  CASE
    WHEN category = 'running' THEN 'endurance'
    WHEN category IN ('cooldown','mobility') THEN 'mobility'
    WHEN category IN ('warmup','balance-agility') THEN 'coordination'
    WHEN category IN ('grip-rig','ocr-skill') THEN 'ocr_technique'
    WHEN category IN ('throw','carries-lifts') THEN 'strength'
    ELSE 'strength'
  END
FROM exercises
WHERE seed_key IS NOT NULL;

INSERT OR IGNORE INTO exercise_training_goals (exercise_id, goal)
SELECT e.id, 'teamwork'
FROM exercises e
WHERE e.seed_key IS NOT NULL AND e.category IN ('teamwork','games');

INSERT OR IGNORE INTO exercise_training_goals (exercise_id, goal)
SELECT e.id, 'grip'
FROM exercises e
JOIN exercise_movement_patterns p ON p.exercise_id=e.id
WHERE e.seed_key IS NOT NULL AND p.movement_pattern_id IN ('hang','climb','carry','pull');

INSERT OR IGNORE INTO exercise_training_goals (exercise_id, goal)
SELECT e.id, 'balance'
FROM exercises e
JOIN exercise_movement_patterns p ON p.exercise_id=e.id
WHERE e.seed_key IS NOT NULL AND p.movement_pattern_id IN ('balance','land');

CREATE INDEX IF NOT EXISTS exercise_training_goals_goal_idx
  ON exercise_training_goals(goal, exercise_id);

INSERT INTO schema_migrations (version, name) VALUES (18, 'exercise_training_goals');
COMMIT;
