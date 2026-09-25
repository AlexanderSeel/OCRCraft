BEGIN TRANSACTION;

INSERT OR IGNORE INTO movement_patterns (id,label_de,label_en)
VALUES ('mixed','Gemischte Bewegungsaufgabe','Mixed Movement');

INSERT OR IGNORE INTO exercise_movement_patterns (exercise_id,movement_pattern_id)
SELECT e.id,v.pattern
FROM exercises e
JOIN (VALUES
  ('game-carry-collect','carry'),
  ('game-carry-collect','walk'),
  ('game-code-run','run'),
  ('game-color-island-sprint','run'),
  ('game-color-island-sprint','agility'),
  ('game-grip-token-hunt','hang'),
  ('game-lava-path-builders','balance'),
  ('game-lava-path-builders','walk'),
  ('game-ocr-memory-relay','run'),
  ('game-ocr-memory-relay','mixed'),
  ('game-ocr-task-grid','mixed'),
  ('game-partner-pace-match','run'),
  ('game-reaction-gates','run'),
  ('game-reaction-gates','agility'),
  ('game-route-puzzle','run'),
  ('game-route-puzzle','mixed'),
  ('game-team-treasure-carry','carry'),
  ('game-team-treasure-carry','walk'),
  ('game-zone-switch','agility')
) AS v(seed_key,pattern) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO schema_migrations (version,name)
VALUES (90,'game_movement_pattern_completion');

COMMIT;
