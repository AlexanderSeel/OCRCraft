BEGIN TRANSACTION;

INSERT OR IGNORE INTO tags (id, label_de, label_en) VALUES
  ('wall','Wandtechnik','Wall Technique'),
  ('rope','Seiltechnik','Rope Technique'),
  ('transition','Übergang Laufbahn–Hindernis','Obstacle Transition'),
  ('trail','Trail / Gelände','Trail / Terrain');

INSERT OR IGNORE INTO exercise_tags (exercise_id, tag_id)
SELECT e.id, 'running' FROM exercises e
WHERE e.seed_key IS NOT NULL AND e.category='running';

INSERT OR IGNORE INTO exercise_tags (exercise_id, tag_id)
SELECT e.id, 'obstacle' FROM exercises e
WHERE e.seed_key IS NOT NULL AND e.category IN ('ocr-skill','grip-rig');

INSERT OR IGNORE INTO exercise_tags (exercise_id, tag_id)
SELECT e.id, 'grip' FROM exercises e
JOIN exercise_movement_patterns p ON p.exercise_id=e.id
WHERE e.seed_key IS NOT NULL AND p.movement_pattern_id IN ('hang','climb','pull');

INSERT OR IGNORE INTO exercise_tags (exercise_id, tag_id)
SELECT e.id, 'carry' FROM exercises e
JOIN exercise_movement_patterns p ON p.exercise_id=e.id
WHERE e.seed_key IS NOT NULL AND p.movement_pattern_id IN ('carry','drag');

INSERT OR IGNORE INTO exercise_tags (exercise_id, tag_id)
SELECT e.id, 'rope' FROM exercises e
WHERE e.seed_key IS NOT NULL AND (e.seed_key LIKE '%rope%' OR e.seed_key LIKE '%seil%');

INSERT OR IGNORE INTO exercise_tags (exercise_id, tag_id)
SELECT e.id, 'wall' FROM exercises e
WHERE e.seed_key IS NOT NULL AND (e.seed_key LIKE '%wall%' OR e.seed_key LIKE '%wand%');

INSERT OR IGNORE INTO exercise_tags (exercise_id, tag_id)
SELECT e.id, 'transition' FROM exercises e
WHERE e.seed_key IS NOT NULL AND (e.seed_key LIKE '%transition%' OR e.seed_key LIKE '%run-to-%');

INSERT OR IGNORE INTO exercise_tags (exercise_id, tag_id)
SELECT e.id, 'trail' FROM exercises e
WHERE e.seed_key IS NOT NULL AND (e.seed_key LIKE '%trail%' OR e.seed_key LIKE '%terrain%' OR e.seed_key LIKE '%stair%');

INSERT INTO schema_migrations (version, name) VALUES (20, 'ocr_transfer_tags');
COMMIT;
