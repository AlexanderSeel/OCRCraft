BEGIN TRANSACTION;

INSERT OR IGNORE INTO tags (id,label_de,label_en) VALUES
  ('games-teamwork','Spiele & Teamwork','Games & Teamwork'),
  ('kids-adventure','Kinder-Abenteuer','Kids Adventure'),
  ('coordination','Koordination','Coordination'),
  ('speed-reaction','Schnelligkeit & Reaktion','Speed & Reaction'),
  ('jumping-landing','Springen & Landen','Jumping & Landing'),
  ('crawling-ground','Crawling & Bodenbewegung','Crawling & Ground Movement'),
  ('push-strength','Drückkraft','Push Strength'),
  ('pull-strength','Zugkraft','Pull Strength'),
  ('squat-knee','Knie-dominant','Squat / Knee Dominant'),
  ('hinge-hip','Hüft-dominant','Hinge / Hip Dominant'),
  ('lunge-single-leg','Einbeinige Bewegung','Lunge / Single Leg'),
  ('rotation-anti-rotation','Rotation & Anti-Rotation','Rotation / Anti-Rotation'),
  ('shoulder-stability','Schulterstabilität','Shoulder Stability'),
  ('grip-endurance','Grip-Ausdauer','Grip Endurance'),
  ('rig-technique','Rig-Technik','Rig Technique'),
  ('rope-technique','Seiltechnik','Rope Technique'),
  ('wall-technique','Wandtechnik','Wall Technique'),
  ('carry-technique','Tragetechnik','Carry Technique'),
  ('drag-pull','Ziehen & Schleifen','Drag / Pull'),
  ('obstacle-transition','Hindernisübergang','Obstacle Transition'),
  ('running-technique','Lauftechnik / Lauf-ABC','Running Technique'),
  ('easy-base-endurance','Grundlagenausdauer','Easy / Base Endurance'),
  ('tempo-threshold','Tempo / Schwelle','Tempo / Threshold'),
  ('intervals','Intervalle','Intervals'),
  ('hills-stairs','Hügel & Treppen','Hills / Stairs'),
  ('trail-terrain','Trail & Gelände','Trail / Terrain'),
  ('run-exercise','Lauf + Übung','Run + Exercise'),
  ('run-obstacle','Lauf + Hindernis','Run + Obstacle'),
  ('balance-proprioception','Balance & Propriozeption','Balance / Proprioception'),
  ('stretching','Dehnen','Stretching'),
  ('breathing-recovery','Atmung & Erholung','Breathing / Recovery');

INSERT OR IGNORE INTO exercise_tags (exercise_id,tag_id)
SELECT e.id,'games-teamwork' FROM exercises e WHERE e.category IN ('balance-agility','warmup') AND EXISTS (SELECT 1 FROM exercise_tags x WHERE x.exercise_id=e.id AND x.tag_id='team');
INSERT OR IGNORE INTO exercise_tags SELECT e.id,'coordination' FROM exercises e WHERE e.category='balance-agility' OR EXISTS (SELECT 1 FROM exercise_movement_patterns p WHERE p.exercise_id=e.id AND p.movement_pattern_id IN ('agility','balance','catch'));
INSERT OR IGNORE INTO exercise_tags SELECT e.id,'speed-reaction' FROM exercises e WHERE EXISTS (SELECT 1 FROM exercise_tags x WHERE x.exercise_id=e.id AND x.tag_id='speed') OR EXISTS (SELECT 1 FROM exercise_movement_patterns p WHERE p.exercise_id=e.id AND p.movement_pattern_id='agility');
INSERT OR IGNORE INTO exercise_tags SELECT e.id,'jumping-landing' FROM exercises e WHERE EXISTS (SELECT 1 FROM exercise_movement_patterns p WHERE p.exercise_id=e.id AND p.movement_pattern_id IN ('jump','land'));
INSERT OR IGNORE INTO exercise_tags SELECT e.id,'crawling-ground' FROM exercises e WHERE EXISTS (SELECT 1 FROM exercise_movement_patterns p WHERE p.exercise_id=e.id AND p.movement_pattern_id='crawl');
INSERT OR IGNORE INTO exercise_tags SELECT e.id,'push-strength' FROM exercises e WHERE EXISTS (SELECT 1 FROM exercise_movement_patterns p WHERE p.exercise_id=e.id AND p.movement_pattern_id='push');
INSERT OR IGNORE INTO exercise_tags SELECT e.id,'pull-strength' FROM exercises e WHERE EXISTS (SELECT 1 FROM exercise_movement_patterns p WHERE p.exercise_id=e.id AND p.movement_pattern_id='pull');
INSERT OR IGNORE INTO exercise_tags SELECT e.id,'squat-knee' FROM exercises e WHERE EXISTS (SELECT 1 FROM exercise_movement_patterns p WHERE p.exercise_id=e.id AND p.movement_pattern_id='squat');
INSERT OR IGNORE INTO exercise_tags SELECT e.id,'hinge-hip' FROM exercises e WHERE EXISTS (SELECT 1 FROM exercise_movement_patterns p WHERE p.exercise_id=e.id AND p.movement_pattern_id='hinge');
INSERT OR IGNORE INTO exercise_tags SELECT e.id,'lunge-single-leg' FROM exercises e WHERE EXISTS (SELECT 1 FROM exercise_movement_patterns p WHERE p.exercise_id=e.id AND p.movement_pattern_id='lunge');
INSERT OR IGNORE INTO exercise_tags SELECT e.id,'rotation-anti-rotation' FROM exercises e WHERE EXISTS (SELECT 1 FROM exercise_movement_patterns p WHERE p.exercise_id=e.id AND p.movement_pattern_id='rotate');
INSERT OR IGNORE INTO exercise_tags SELECT e.id,'grip-endurance' FROM exercises e WHERE e.category='grip-rig' OR EXISTS (SELECT 1 FROM exercise_tags x WHERE x.exercise_id=e.id AND x.tag_id='grip');
INSERT OR IGNORE INTO exercise_tags SELECT e.id,'rig-technique' FROM exercises e WHERE e.category='grip-rig';
INSERT OR IGNORE INTO exercise_tags SELECT e.id,'rope-technique' FROM exercises e WHERE EXISTS (SELECT 1 FROM exercise_equipment ee JOIN equipment eq ON eq.id=ee.equipment_id WHERE ee.exercise_id=e.id AND lower(eq.name_en) LIKE '%rope%');
INSERT OR IGNORE INTO exercise_tags SELECT e.id,'wall-technique' FROM exercises e WHERE e.category='ocr-skill' AND lower(e.canonical_name) LIKE '%wall%';
INSERT OR IGNORE INTO exercise_tags SELECT e.id,'carry-technique' FROM exercises e WHERE e.category='carry-lift' OR EXISTS (SELECT 1 FROM exercise_movement_patterns p WHERE p.exercise_id=e.id AND p.movement_pattern_id='carry');
INSERT OR IGNORE INTO exercise_tags SELECT e.id,'drag-pull' FROM exercises e WHERE EXISTS (SELECT 1 FROM exercise_movement_patterns p WHERE p.exercise_id=e.id AND p.movement_pattern_id='drag');
INSERT OR IGNORE INTO exercise_tags SELECT e.id,'obstacle-transition' FROM exercises e WHERE e.category='ocr-skill' OR e.category='grip-rig';
INSERT OR IGNORE INTO exercise_tags SELECT e.id,'running-technique' FROM exercises e WHERE e.category='running' AND (lower(e.canonical_name) LIKE '%skip%' OR lower(e.canonical_name) LIKE '%ankl%' OR lower(e.canonical_name) LIKE '%stride%' OR lower(e.canonical_name) LIKE '%cadence%');
INSERT OR IGNORE INTO exercise_tags SELECT e.id,'easy-base-endurance' FROM exercises e WHERE e.category='running' AND (lower(e.canonical_name) LIKE '%easy%' OR lower(e.canonical_name) LIKE '%jog%' OR lower(e.canonical_name) LIKE '%base%');
INSERT OR IGNORE INTO exercise_tags SELECT e.id,'tempo-threshold' FROM exercises e WHERE e.category='running' AND (lower(e.canonical_name) LIKE '%tempo%' OR lower(e.canonical_name) LIKE '%threshold%');
INSERT OR IGNORE INTO exercise_tags SELECT e.id,'intervals' FROM exercises e WHERE e.category='running' AND (lower(e.canonical_name) LIKE '%interval%' OR lower(e.canonical_name) LIKE '%fartlek%');
INSERT OR IGNORE INTO exercise_tags SELECT e.id,'hills-stairs' FROM exercises e WHERE e.category='running' AND (lower(e.canonical_name) LIKE '%hill%' OR lower(e.canonical_name) LIKE '%stair%');
INSERT OR IGNORE INTO exercise_tags SELECT e.id,'trail-terrain' FROM exercises e WHERE e.category='running' AND (lower(e.canonical_name) LIKE '%trail%' OR lower(e.canonical_name) LIKE '%terrain%');
INSERT OR IGNORE INTO exercise_tags SELECT e.id,'run-exercise' FROM exercises e WHERE e.category='running' AND (lower(e.canonical_name) LIKE '%exercise%' OR lower(e.canonical_name) LIKE '%100 m%');
INSERT OR IGNORE INTO exercise_tags SELECT e.id,'run-obstacle' FROM exercises e WHERE e.category='running' AND lower(e.canonical_name) LIKE '%obstacle%';
INSERT OR IGNORE INTO exercise_tags SELECT e.id,'balance-proprioception' FROM exercises e WHERE e.category='balance-agility' OR EXISTS (SELECT 1 FROM exercise_movement_patterns p WHERE p.exercise_id=e.id AND p.movement_pattern_id='balance');
INSERT OR IGNORE INTO exercise_tags SELECT e.id,'stretching' FROM exercises e WHERE e.category='cooldown' OR EXISTS (SELECT 1 FROM exercise_movement_patterns p WHERE p.exercise_id=e.id AND p.movement_pattern_id='stretch');
INSERT OR IGNORE INTO exercise_tags SELECT e.id,'breathing-recovery' FROM exercises e WHERE e.category IN ('cooldown','mobility');

UPDATE search_index_state SET status='dirty', last_error=NULL WHERE locale IN ('de','en');
INSERT OR IGNORE INTO schema_migrations (version,name) VALUES (31,'exercise_facets');
COMMIT;
