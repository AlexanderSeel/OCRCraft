BEGIN TRANSACTION;

-- Preserve cross-locale discovery for cohorts added after the original alias migrations.
INSERT OR IGNORE INTO exercise_aliases (exercise_id,locale,alias)
SELECT e.id,'de',en.name
FROM exercises e
JOIN exercise_translations de ON de.exercise_id=e.id AND de.locale='de'
JOIN exercise_translations en ON en.exercise_id=e.id AND en.locale='en'
WHERE e.seed_key IS NOT NULL AND lower(trim(de.name))<>lower(trim(en.name));

INSERT OR IGNORE INTO exercise_aliases (exercise_id,locale,alias)
SELECT e.id,'en',de.name
FROM exercises e
JOIN exercise_translations de ON de.exercise_id=e.id AND de.locale='de'
JOIN exercise_translations en ON en.exercise_id=e.id AND en.locale='en'
WHERE e.seed_key IS NOT NULL AND lower(trim(de.name))<>lower(trim(en.name));

-- Add trainer-facing search terminology to every versioned seed. These aliases
-- are intentionally generic coaching/search terms in addition to canonical and
-- cross-locale names; they do not replace the exercise-specific aliases.
INSERT OR IGNORE INTO exercise_aliases (exercise_id,locale,alias)
SELECT DISTINCT e.id,'de',m.alias_de
FROM exercises e
JOIN exercise_movement_patterns p ON p.exercise_id=e.id
JOIN (VALUES
  ('run','Laufdrill','Running drill'),
  ('walk','Gehdrill','Walking drill'),
  ('crawl','Crawl-Drill','Crawling drill'),
  ('squat','Kniebeuge-Muster','Squat pattern'),
  ('lunge','Ausfallschritt-Muster','Lunge pattern'),
  ('hinge','Hüftbeuge-Muster','Hip-hinge pattern'),
  ('push','Druckübung','Push exercise'),
  ('pull','Zugübung','Pull exercise'),
  ('carry','Trageübung','Carry exercise'),
  ('drag','Ziehübung','Drag exercise'),
  ('climb','Klettertechnik','Climbing technique'),
  ('hang','Hängeübung','Hanging drill'),
  ('swing','Schwungtechnik','Swing technique'),
  ('rotate','Rotationsübung','Rotation exercise'),
  ('brace','Rumpfstabilität','Core bracing'),
  ('balance','Balanceübung','Balance drill'),
  ('jump','Sprungübung','Jump drill'),
  ('land','Landetechnik','Landing technique'),
  ('throw','Wurfübung','Throwing drill'),
  ('catch','Fangübung','Catching drill'),
  ('mobility','Mobilisationsübung','Mobility drill'),
  ('stretch','Dehnübung','Stretching drill'),
  ('breathing','Atemübung','Breathing drill'),
  ('agility','Agility-Drill','Agility drill')
) AS m(pattern,alias_de,alias_en) ON m.pattern=p.movement_pattern_id
WHERE e.seed_key IS NOT NULL AND trim(m.alias_de)<>'';

INSERT OR IGNORE INTO exercise_aliases (exercise_id,locale,alias)
SELECT DISTINCT e.id,'en',m.alias_en
FROM exercises e
JOIN exercise_movement_patterns p ON p.exercise_id=e.id
JOIN (VALUES
  ('run','Laufdrill','Running drill'),
  ('walk','Gehdrill','Walking drill'),
  ('crawl','Crawl-Drill','Crawling drill'),
  ('squat','Kniebeuge-Muster','Squat pattern'),
  ('lunge','Ausfallschritt-Muster','Lunge pattern'),
  ('hinge','Hüftbeuge-Muster','Hip-hinge pattern'),
  ('push','Druckübung','Push exercise'),
  ('pull','Zugübung','Pull exercise'),
  ('carry','Trageübung','Carry exercise'),
  ('drag','Ziehübung','Drag exercise'),
  ('climb','Klettertechnik','Climbing technique'),
  ('hang','Hängeübung','Hanging drill'),
  ('swing','Schwungtechnik','Swing technique'),
  ('rotate','Rotationsübung','Rotation exercise'),
  ('brace','Rumpfstabilität','Core bracing'),
  ('balance','Balanceübung','Balance drill'),
  ('jump','Sprungübung','Jump drill'),
  ('land','Landetechnik','Landing technique'),
  ('throw','Wurfübung','Throwing drill'),
  ('catch','Fangübung','Catching drill'),
  ('mobility','Mobilisationsübung','Mobility drill'),
  ('stretch','Dehnübung','Stretching drill'),
  ('breathing','Atemübung','Breathing drill'),
  ('agility','Agility-Drill','Agility drill')
) AS m(pattern,alias_de,alias_en) ON m.pattern=p.movement_pattern_id
WHERE e.seed_key IS NOT NULL AND trim(m.alias_en)<>'';

-- Category terminology ensures every seed has a trainer-facing term even when
-- its movement facet is unusually specialised.
INSERT OR IGNORE INTO exercise_aliases (exercise_id,locale,alias)
SELECT e.id,'de',CASE e.category
  WHEN 'warmup' THEN 'Aufwärmübung'
  WHEN 'mobility' THEN 'Mobilitätstraining'
  WHEN 'strength' THEN 'Kraftübung'
  WHEN 'core' THEN 'Rumpfübung'
  WHEN 'running' THEN 'Lauftraining'
  WHEN 'grip-rig' THEN 'Grip- und Rig-Training'
  WHEN 'carry-lift' THEN 'Trage- und Hebeübung'
  WHEN 'ocr-skill' THEN 'OCR Hindernistechnik'
  WHEN 'balance-agility' THEN 'Koordinationsübung'
  WHEN 'throw' THEN 'Wurftraining'
  WHEN 'cooldown' THEN 'Regenerationsübung'
  ELSE 'Trainerübung'
END
FROM exercises e WHERE e.seed_key IS NOT NULL;

INSERT OR IGNORE INTO exercise_aliases (exercise_id,locale,alias)
SELECT e.id,'en',CASE e.category
  WHEN 'warmup' THEN 'Warm-up exercise'
  WHEN 'mobility' THEN 'Mobility training'
  WHEN 'strength' THEN 'Strength exercise'
  WHEN 'core' THEN 'Core exercise'
  WHEN 'running' THEN 'Running training'
  WHEN 'grip-rig' THEN 'Grip and rig training'
  WHEN 'carry-lift' THEN 'Carry and lift exercise'
  WHEN 'ocr-skill' THEN 'OCR obstacle technique'
  WHEN 'balance-agility' THEN 'Coordination drill'
  WHEN 'throw' THEN 'Throwing training'
  WHEN 'cooldown' THEN 'Recovery exercise'
  ELSE 'Trainer exercise'
END
FROM exercises e WHERE e.seed_key IS NOT NULL;

UPDATE search_documents_de AS s SET aliases=COALESCE((
  SELECT string_agg(a.alias,' ' ORDER BY a.alias)
  FROM exercise_aliases a WHERE a.exercise_id=s.entity_id::UUID AND a.locale='de'
),'') WHERE s.entity_type='exercise';

UPDATE search_documents_en AS s SET aliases=COALESCE((
  SELECT string_agg(a.alias,' ' ORDER BY a.alias)
  FROM exercise_aliases a WHERE a.exercise_id=s.entity_id::UUID AND a.locale='en'
),'') WHERE s.entity_type='exercise';

UPDATE search_index_state SET status='dirty',last_error=NULL WHERE locale IN ('de','en');

INSERT INTO schema_migrations (version,name) VALUES (64,'seed_trainer_search_terms');
COMMIT;
