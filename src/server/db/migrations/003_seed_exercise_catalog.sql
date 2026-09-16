BEGIN TRANSACTION;

INSERT OR IGNORE INTO body_regions (id, label_de, label_en) VALUES
('full-body','Ganzkörper','Full Body'),('neck','Nacken','Neck'),('shoulders','Schultern','Shoulders'),
('chest','Brust','Chest'),('upper-back','Oberer Rücken','Upper Back'),('lats','Latissimus','Lats'),
('upper-arms','Oberarme','Upper Arms'),('forearms-grip','Unterarme / Grip','Forearms / Grip'),
('core','Core','Core'),('obliques','Seitlicher Core','Obliques'),('lower-back','Unterer Rücken','Lower Back'),
('hips','Hüfte','Hips'),('glutes','Gesäß','Glutes'),('quadriceps','Oberschenkel vorn','Quadriceps'),
('hamstrings','Oberschenkel hinten','Hamstrings'),('adductors','Adduktoren','Adductors'),
('calves','Waden','Calves'),('ankles-feet','Sprunggelenke / Füße','Ankles / Feet');

INSERT OR IGNORE INTO movement_patterns (id, label_de, label_en) VALUES
('run','Laufen','Run'),('walk','Gehen','Walk'),('crawl','Crawlen','Crawl'),('squat','Kniebeuge','Squat'),
('lunge','Ausfallschritt','Lunge'),('hinge','Hüftbeuge','Hinge'),('push','Drücken','Push'),('pull','Ziehen','Pull'),
('carry','Tragen','Carry'),('drag','Ziehen / Schleifen','Drag'),('climb','Klettern','Climb'),('hang','Hängen','Hang'),
('swing','Schwingen','Swing'),('rotate','Rotieren','Rotate'),('brace','Rumpf stabilisieren','Brace'),
('balance','Balancieren','Balance'),('jump','Springen','Jump'),('land','Landen','Land'),('throw','Werfen','Throw'),
('catch','Fangen','Catch'),('mobility','Mobilisieren','Mobility'),('stretch','Dehnen','Stretch'),
('breathing','Atmung','Breathing'),('agility','Agilität / Richtungswechsel','Agility');

INSERT OR IGNORE INTO tags (id, label_de, label_en) VALUES
('warmup','Aufwärmen','Warm-up'),('cooldown','Cooldown','Cooldown'),('running','Laufen','Running'),
('endurance','Ausdauer','Endurance'),('interval','Intervalle','Intervals'),('speed','Schnelligkeit','Speed'),
('technique','Technik','Technique'),('strength','Kraft','Strength'),('strength-endurance','Kraftausdauer','Strength Endurance'),
('core','Core','Core'),('mobility','Mobilität','Mobility'),('grip','Grip','Grip'),('ocr','OCR','OCR'),
('obstacle','Hindernis','Obstacle'),('carry','Carry','Carry'),('balance','Balance','Balance'),
('agility','Agilität','Agility'),('coordination','Koordination','Coordination'),('throwing','Werfen','Throwing'),
('beginner','Einsteiger','Beginner'),('kids','Kinder','Kids'),('team','Team','Team'),('low-impact','Gelenkschonend','Low Impact'),
('recovery','Regeneration','Recovery'),('power','Explosivität','Power'),('conditioning','Conditioning','Conditioning');

INSERT INTO equipment (seed_key, name_de, name_en) SELECT * FROM (VALUES
('cones','Hütchen','Cones'),('mini-hurdles','Minihürden','Mini Hurdles'),('agility-ladder','Koordinationsleiter','Agility Ladder'),
('box','Box / Kasten','Box'),('pullup-bar','Klimmzugstange','Pull-up Bar'),('monkey-bars','Monkey Bars','Monkey Bars'),
('rings','Ringe','Rings'),('rope','Seil','Rope'),('kettlebell','Kettlebell','Kettlebell'),('sandbag','Sandbag','Sandbag'),
('atlas-ball','Atlas Ball / Stone','Atlas Ball / Stone'),('bucket','Bucket / Eimer','Bucket'),('sled','Schlitten','Sled'),
('tire','Reifen','Tire'),('medicine-ball','Medizinball','Medicine Ball'),('spear-trainer','Speertrainer','Spear Trainer'),
('balance-beam','Balancierbalken','Balance Beam'),('resistance-band','Widerstandsband','Resistance Band'),
('mat','Matte','Mat'),('wall','Wand / Wall','Wall'),('cargo-net','Cargo-Netz','Cargo Net')
) AS v(seed_key,name_de,name_en)
WHERE NOT EXISTS (SELECT 1 FROM equipment e WHERE e.seed_key = v.seed_key);

CREATE TEMP TABLE seed_exercises AS SELECT * FROM (VALUES
-- Warm-up
('easy-jog','Lockeres Einlaufen','Easy Jog','warmup','warmup','low',6),
('walk-jog','Gehen-Laufen-Wechsel','Walk-Jog Alternation','warmup','warmup','low',6),
('high-knees','Kniehebelauf','High Knees','warmup','warmup','low',8),
('butt-kicks','Anfersen','Butt Kicks','warmup','warmup','low',8),
('side-shuffle','Seitgalopp','Side Shuffle','warmup','warmup','low',6),
('carioca','Überkreuzlauf / Carioca','Carioca / Grapevine','warmup','warmup','low',8),
('arm-circles','Armkreisen','Arm Circles','warmup','warmup','low',6),
('inchworm','Inchworm','Inchworm','warmup','warmup','low',8),
('jumping-jacks','Hampelmann','Jumping Jacks','warmup','warmup','low',6),
('reaction-tag','Reaktions-Fangspiel','Reaction Tag','warmup','warmup','low',6),
-- Mobility
('ankle-rocks','Sprunggelenk-Wippen','Ankle Rocks','mobility','warmup','low',6),
('calf-mobility','Waden-Mobilisation','Calf Mobility','mobility','warmup','low',6),
('hip-circles','Hüftkreisen','Hip Circles','mobility','warmup','low',6),
('hip-90-90','90/90 Hüftwechsel','90/90 Hip Switch','mobility','warmup','low',10),
('deep-squat-pry','Tiefe Kniebeuge mobilisieren','Deep Squat Pry','mobility','warmup','low',10),
('thoracic-rotation','BWS-Rotation','Thoracic Rotation','mobility','warmup','low',8),
('scapular-pushup','Scapula Push-up','Scapular Push-up','mobility','warmup','low',10),
('scapular-pullup','Scapula Pull-up','Scapular Pull-up','mobility','warmup','medium',12),
('wrist-circles','Handgelenk-Mobilisation','Wrist Circles','mobility','warmup','low',6),
('walking-lunge-rotation','Ausfallschritt mit Rotation','Walking Lunge with Rotation','mobility','warmup','low',10),
-- Strength
('air-squat','Kniebeuge','Bodyweight Squat','strength','main','low',8),
('tempo-squat','Tempo-Kniebeuge','Tempo Squat','strength','main','low',10),
('reverse-lunge','Rückwärts-Ausfallschritt','Reverse Lunge','strength','main','low',8),
('walking-lunge','Gehender Ausfallschritt','Walking Lunge','strength','main','low',10),
('split-squat','Split Squat','Split Squat','strength','main','low',10),
('glute-bridge','Glute Bridge','Glute Bridge','strength','main','low',8),
('single-leg-glute-bridge','Einbeinige Glute Bridge','Single-Leg Glute Bridge','strength','main','low',12),
('hip-hinge-drill','Hip-Hinge Drill','Hip Hinge Drill','strength','main','low',10),
('pushup','Liegestütz','Push-up','strength','main','low',10),
('incline-pushup','Erhöhter Liegestütz','Incline Push-up','strength','main','low',8),
('knee-pushup','Knie-Liegestütz','Knee Push-up','strength','main','low',8),
('pike-pushup','Pike Push-up','Pike Push-up','strength','main','medium',12),
('body-row','Körperrudern','Inverted Row','strength','main','medium',12),
('band-row','Band-Rudern','Band Row','strength','main','low',8),
('assisted-pullup','Unterstützter Klimmzug','Assisted Pull-up','strength','main','medium',12),
('pullup','Klimmzug','Pull-up','strength','main','medium',14),
('burpee-stepback','Burpee Step-back','Step-back Burpee','strength','main','low',10),
('burpee','Burpee','Burpee','strength','main','medium',12),
('box-stepup','Box Step-up','Box Step-up','strength','main','low',8),
('box-jump','Box Jump','Box Jump','strength','main','medium',14),
('kettlebell-deadlift','Kettlebell Deadlift','Kettlebell Deadlift','strength','main','medium',14),
('kettlebell-goblet-squat','Kettlebell Goblet Squat','Kettlebell Goblet Squat','strength','main','medium',14),
('sandbag-squat','Sandbag Kniebeuge','Sandbag Squat','strength','main','medium',14),
('sandbag-ground-shoulder','Sandbag Ground-to-Shoulder','Sandbag Ground-to-Shoulder','strength','main','medium',16),
-- Core
('front-plank','Unterarmstütz','Front Plank','core','main','low',8),
('high-plank','Hoher Stütz','High Plank','core','main','low',8),
('side-plank','Seitstütz','Side Plank','core','main','low',10),
('dead-bug','Dead Bug','Dead Bug','core','main','low',8),
('bird-dog','Bird Dog','Bird Dog','core','main','low',8),
('hollow-hold','Hollow Hold','Hollow Hold','core','main','medium',12),
('bear-plank','Bear Plank','Bear Plank','core','main','low',10),
('plank-shoulder-tap','Plank Shoulder Tap','Plank Shoulder Tap','core','main','low',10),
('mountain-climber','Mountain Climber','Mountain Climber','core','main','low',10),
('farmer-march','Farmer March','Farmer March','core','main','medium',14),
-- Running / Lauf-ABC / Endurance
('easy-run','Lockerer Dauerlauf','Easy Continuous Run','running','main','low',8),
('run-walk-interval','Run-Walk-Intervalle','Run-Walk Intervals','running','main','low',6),
('tempo-run','Tempolauf','Tempo Run','running','main','medium',14),
('fartlek','Fahrtspiel','Fartlek','running','main','medium',12),
('short-intervals','Kurze Laufintervalle','Short Run Intervals','running','main','medium',12),
('long-intervals','Lange Laufintervalle','Long Run Intervals','running','main','medium',14),
('hill-repeats','Bergintervalle','Hill Repeats','running','main','medium',14),
('shuttle-run','Shuttle Run / Pendellauf','Shuttle Run','running','main','medium',10),
('strides','Steigerungsläufe','Strides','running','main','low',10),
('acceleration-run','Beschleunigungslauf','Acceleration Run','running','main','medium',12),
('deceleration-drill','Abbremsen und Stoppen','Deceleration Drill','running','main','medium',12),
('a-skip','A-Skip','A-Skip','running','main','low',10),
('b-skip','B-Skip','B-Skip','running','main','low',12),
('ankling','Fußgelenksarbeit / Ankling','Ankling','running','main','low',8),
('running-high-knees','Lauf-ABC Kniehebelauf','Running ABC High Knees','running','main','low',8),
('running-butt-kicks','Lauf-ABC Anfersen','Running ABC Butt Kicks','running','main','low',8),
('bounding','Sprunglauf','Bounding','running','main','medium',14),
('cadence-run','Kadenzlauf','Cadence Run','running','main','low',12),
('cone-slalom-run','Hütchen-Slalomlauf','Cone Slalom Run','running','main','low',8),
('lateral-shuffle-run','Seitliches Lauf-Shuffle','Lateral Shuffle Run','running','main','low',8),
('relay-run','Staffellauf','Relay Run','running','main','low',8),
('trail-run','Trail-/Geländelauf','Trail Run','running','main','medium',12),
('run-exercise-100m','Alle 100 m eine Übung','Exercise Every 100 m','running','main','medium',12),
('run-obstacle-transition','Lauf-Hindernis-Übergang','Run-to-Obstacle Transition','running','main','medium',12),
('stairs-run','Treppenlauf','Stair Run','running','main','medium',14),
-- Grip & Rig
('dead-hang','Dead Hang','Dead Hang','grip-rig','main','medium',10),
('active-hang','Active Hang','Active Hang','grip-rig','main','medium',12),
('towel-hang','Handtuch-Hang','Towel Hang','grip-rig','main','medium',14),
('ring-hang','Ring Hang','Ring Hang','grip-rig','main','medium',12),
('ring-row','Ring Row','Ring Row','grip-rig','main','medium',12),
('ring-traverse','Ring Traverse','Ring Traverse','grip-rig','main','high',14),
('monkeybars-basic','Monkey Bars Basis','Basic Monkey Bars','grip-rig','main','medium',10),
('monkeybars-skip','Monkey Bars Sprossen überspringen','Monkey Bars Skip Rungs','grip-rig','main','high',14),
('lateral-bar-traverse','Seitliches Hangeln','Lateral Bar Traverse','grip-rig','main','high',14),
('rope-grip-hold','Seilgriff halten','Rope Grip Hold','grip-rig','main','medium',12),
('rope-pull-seated','Sitzender Seilzug','Seated Rope Pull','grip-rig','main','medium',12),
('rope-climb-footlock','Seilklettern mit Fußtechnik','Rope Climb with Foot Lock','grip-rig','main','high',14),
('scapular-swing','Scapular Swing','Scapular Swing','grip-rig','main','medium',12),
('rig-transition','Rig Griffwechsel','Rig Grip Transition','grip-rig','main','high',14),
('assisted-rig-traverse','Unterstütztes Rig-Hangeln','Assisted Rig Traverse','grip-rig','main','medium',12),
-- Carries & Lifts
('farmer-carry','Farmer Carry','Farmer Carry','carry-lift','main','medium',14),
('suitcase-carry','Suitcase Carry','Suitcase Carry','carry-lift','main','medium',14),
('sandbag-bearhug-carry','Sandbag Bear-Hug Carry','Sandbag Bear-Hug Carry','carry-lift','main','medium',14),
('sandbag-shoulder-carry','Sandbag Shoulder Carry','Sandbag Shoulder Carry','carry-lift','main','medium',14),
('sandbag-front-carry','Sandbag Front Carry','Sandbag Front Carry','carry-lift','main','medium',14),
('bucket-carry','Bucket Carry','Bucket Carry','carry-lift','main','medium',14),
('atlas-ball-carry','Atlas Ball Carry','Atlas Ball Carry','carry-lift','main','high',16),
('team-object-carry','Team-Gegenstand tragen','Team Object Carry','carry-lift','main','medium',12),
('sled-drag','Schlitten ziehen','Sled Drag','carry-lift','main','medium',14),
('tire-drag','Reifen ziehen','Tire Drag','carry-lift','main','medium',14),
('tire-flip','Reifen Flip','Tire Flip','carry-lift','main','high',16),
-- OCR Skills
('bear-crawl','Bear Crawl','Bear Crawl','ocr-skill','main','low',8),
('low-crawl','Low Crawl','Low Crawl','ocr-skill','main','low',8),
('army-crawl','Army Crawl','Army Crawl','ocr-skill','main','low',10),
('crab-walk','Crab Walk','Crab Walk','ocr-skill','main','low',8),
('wall-stepover-low','Niedrige Wand übersteigen','Low Wall Step-over','ocr-skill','main','medium',10),
('wall-vault-basic','Wandüberwindung Basis','Basic Wall Vault','ocr-skill','main','high',14),
('incline-wall-run','Schrägwand anlaufen','Incline Wall Run','ocr-skill','main','high',14),
('cargo-net-climb','Cargo-Netz klettern','Cargo Net Climb','ocr-skill','main','high',12),
('cargo-net-traverse','Cargo-Netz queren','Cargo Net Traverse','ocr-skill','main','high',14),
('over-under','Over-Under Hindernis','Over-Under Obstacle','ocr-skill','main','medium',10),
('box-over','Box Over','Box Over','ocr-skill','main','medium',12),
('rope-traverse','Seil Traverse','Rope Traverse','ocr-skill','main','high',14),
('obstacle-burpee-penalty','OCR Penalty Burpees','OCR Penalty Burpees','ocr-skill','main','medium',12),
('rig-run-interval','Rig & Run Intervall','Rig & Run Interval','ocr-skill','main','high',14),
('wall-run-transition','Lauf-Wand-Übergang','Run-to-Wall Transition','ocr-skill','main','high',14),
('crawl-run-transition','Crawl-Run-Übergang','Crawl-to-Run Transition','ocr-skill','main','medium',10),
-- Balance & Agility
('single-leg-balance','Einbeinstand','Single-Leg Balance','balance-agility','main','low',6),
('balance-beam-walk','Balancierbalken gehen','Balance Beam Walk','balance-agility','main','low',8),
('balance-beam-carry','Balancierbalken mit Carry','Balance Beam Carry','balance-agility','main','medium',14),
('stepping-stones','Trittsteine','Stepping Stones','balance-agility','main','medium',10),
('line-hops','Linienhüpfer','Line Hops','balance-agility','main','low',8),
('lateral-hops','Seitliche Sprünge','Lateral Hops','balance-agility','main','medium',10),
('agility-ladder-one-in','Koordinationsleiter One-In','Agility Ladder One-In','balance-agility','main','low',8),
('agility-ladder-inout','Koordinationsleiter In-Out','Agility Ladder In-Out','balance-agility','main','low',8),
('cone-change-direction','Hütchen Richtungswechsel','Cone Change of Direction','balance-agility','main','medium',10),
('mini-hurdle-step','Minihürden Schrittfolge','Mini Hurdle Steps','balance-agility','main','low',8),
-- Throwing
('medicine-ball-chest-pass','Medizinball Chest Pass','Medicine Ball Chest Pass','throw','main','medium',12),
('medicine-ball-overhead','Medizinball Überkopfwurf','Medicine Ball Overhead Throw','throw','main','medium',12),
('medicine-ball-rotational','Medizinball Rotationswurf','Medicine Ball Rotational Throw','throw','main','medium',14),
('sandbag-target-throw','Sandbag Zielwurf','Sandbag Target Throw','throw','main','medium',14),
('spear-target-drill','Speer-Zielwurf Drill','Spear Target Drill','throw','main','medium',14),
('ball-target-throw','Ball-Zielwurf','Ball Target Throw','throw','main','low',8),
-- Cooldown
('easy-walk-cooldown','Lockeres Ausgehen','Easy Walk Cooldown','cooldown','cooldown','low',6),
('breathing-reset','Atem-Reset','Breathing Reset','cooldown','cooldown','low',6),
('calf-stretch','Wadenstretch','Calf Stretch','cooldown','cooldown','low',6),
('hamstring-stretch','Hamstring Stretch','Hamstring Stretch','cooldown','cooldown','low',8),
('quad-stretch','Quadrizeps Stretch','Quadriceps Stretch','cooldown','cooldown','low',8),
('hip-flexor-stretch','Hüftbeuger Stretch','Hip Flexor Stretch','cooldown','cooldown','low',8),
('glute-stretch','Gesäß Stretch','Glute Stretch','cooldown','cooldown','low',8),
('lat-stretch','Lat Stretch','Lat Stretch','cooldown','cooldown','low',8),
('forearm-flexor-stretch','Unterarmbeuger Stretch','Forearm Flexor Stretch','cooldown','cooldown','low',8),
('child-pose','Child''s Pose','Child''s Pose','cooldown','cooldown','low',6),
('supine-twist','Liegende Rotation','Supine Twist','cooldown','cooldown','low',8),
('shoulder-crossbody-stretch','Schulter Cross-Body Stretch','Cross-Body Shoulder Stretch','cooldown','cooldown','low',8)
) AS v(seed_key,name_de,name_en,category,phase,risk_level,min_age);

INSERT INTO exercises (seed_key, canonical_name, category, default_phase, risk_level, min_age, indoor, outdoor)
SELECT s.seed_key, s.name_en, s.category, s.phase, s.risk_level, s.min_age, true, true
FROM seed_exercises s
WHERE NOT EXISTS (SELECT 1 FROM exercises e WHERE e.seed_key = s.seed_key);

INSERT OR REPLACE INTO exercise_translations (exercise_id, locale, name, summary)
SELECT e.id, 'de', s.name_de,
  CASE s.category
    WHEN 'running' THEN 'Laufübung für Technik, Ausdauer oder OCR-spezifische Laufanteile.'
    WHEN 'grip-rig' THEN 'Grip- und Rig-Übung mit Fokus auf kontrollierte OCR-Technik.'
    WHEN 'ocr-skill' THEN 'OCR-spezifische Technik- oder Hindernisübung.'
    WHEN 'carry-lift' THEN 'Carry-/Lift-Übung für funktionelle Kraft und OCR-Belastbarkeit.'
    WHEN 'cooldown' THEN 'Cooldown-, Mobility- oder Regenerationsübung.'
    WHEN 'warmup' THEN 'Aufwärmübung zur Vorbereitung auf die Trainingseinheit.'
    WHEN 'mobility' THEN 'Mobilitätsübung zur Bewegungsvorbereitung.'
    ELSE 'Funktionelle Übung für Breitensport und OCR-Training.' END
FROM seed_exercises s JOIN exercises e ON e.seed_key = s.seed_key;

INSERT OR REPLACE INTO exercise_translations (exercise_id, locale, name, summary)
SELECT e.id, 'en', s.name_en,
  CASE s.category
    WHEN 'running' THEN 'Running drill for technique, endurance or OCR-specific running segments.'
    WHEN 'grip-rig' THEN 'Grip and rig drill focused on controlled OCR technique.'
    WHEN 'ocr-skill' THEN 'OCR-specific obstacle or technique drill.'
    WHEN 'carry-lift' THEN 'Carry or lift drill for functional strength and OCR readiness.'
    WHEN 'cooldown' THEN 'Cooldown, mobility or recovery drill.'
    WHEN 'warmup' THEN 'Warm-up drill to prepare for the training session.'
    WHEN 'mobility' THEN 'Mobility drill for movement preparation.'
    ELSE 'Functional exercise for recreational sport and OCR training.' END
FROM seed_exercises s JOIN exercises e ON e.seed_key = s.seed_key;

-- Category baseline tags.
INSERT OR IGNORE INTO exercise_tags
SELECT e.id,
  CASE e.category WHEN 'warmup' THEN 'warmup' WHEN 'mobility' THEN 'mobility' WHEN 'strength' THEN 'strength'
    WHEN 'core' THEN 'core' WHEN 'running' THEN 'running' WHEN 'grip-rig' THEN 'grip'
    WHEN 'carry-lift' THEN 'carry' WHEN 'ocr-skill' THEN 'ocr' WHEN 'balance-agility' THEN 'agility'
    WHEN 'throw' THEN 'throwing' WHEN 'cooldown' THEN 'cooldown' ELSE 'technique' END
FROM exercises e WHERE e.seed_key IS NOT NULL;

INSERT OR IGNORE INTO exercise_tags
SELECT e.id, 'ocr' FROM exercises e WHERE e.category IN ('grip-rig','carry-lift','ocr-skill');
INSERT OR IGNORE INTO exercise_tags
SELECT e.id, 'endurance' FROM exercises e WHERE e.category = 'running';
INSERT OR IGNORE INTO exercise_tags
SELECT e.id, 'obstacle' FROM exercises e WHERE e.category IN ('grip-rig','ocr-skill');
INSERT OR IGNORE INTO exercise_tags
SELECT e.id, 'recovery' FROM exercises e WHERE e.category = 'cooldown';

-- Category baseline movement patterns.
INSERT OR IGNORE INTO exercise_movement_patterns SELECT id, 'run' FROM exercises WHERE category = 'running';
INSERT OR IGNORE INTO exercise_movement_patterns SELECT id, 'mobility' FROM exercises WHERE category = 'mobility';
INSERT OR IGNORE INTO exercise_movement_patterns SELECT id, 'brace' FROM exercises WHERE category = 'core';
INSERT OR IGNORE INTO exercise_movement_patterns SELECT id, 'hang' FROM exercises WHERE category = 'grip-rig';
INSERT OR IGNORE INTO exercise_movement_patterns SELECT id, 'carry' FROM exercises WHERE category = 'carry-lift';
INSERT OR IGNORE INTO exercise_movement_patterns SELECT id, 'throw' FROM exercises WHERE category = 'throw';
INSERT OR IGNORE INTO exercise_movement_patterns SELECT id, 'stretch' FROM exercises WHERE category = 'cooldown';
INSERT OR IGNORE INTO exercise_movement_patterns SELECT id, 'agility' FROM exercises WHERE category = 'balance-agility';

-- Baseline body regions; fine-grained mappings can be enriched in Admin later.
INSERT OR IGNORE INTO exercise_body_regions SELECT id, 'full-body', 'primary' FROM exercises WHERE category IN ('warmup','running','carry-lift','ocr-skill');
INSERT OR IGNORE INTO exercise_body_regions SELECT id, 'forearms-grip', 'primary' FROM exercises WHERE category = 'grip-rig';
INSERT OR IGNORE INTO exercise_body_regions SELECT id, 'core', 'primary' FROM exercises WHERE category = 'core';
INSERT OR IGNORE INTO exercise_body_regions SELECT id, 'hips', 'primary' FROM exercises WHERE category = 'mobility';
INSERT OR IGNORE INTO exercise_body_regions SELECT id, 'full-body', 'primary' FROM exercises WHERE category = 'strength';
INSERT OR IGNORE INTO exercise_body_regions SELECT id, 'ankles-feet', 'primary' FROM exercises WHERE category = 'balance-agility';
INSERT OR IGNORE INTO exercise_body_regions SELECT id, 'shoulders', 'primary' FROM exercises WHERE category = 'throw';
INSERT OR IGNORE INTO exercise_body_regions SELECT id, 'full-body', 'primary' FROM exercises WHERE category = 'cooldown';

CREATE TEMP TABLE seed_equipment_map AS SELECT * FROM (VALUES
('reaction-tag','cones'),('scapular-pullup','pullup-bar'),('hip-90-90','mat'),('thoracic-rotation','mat'),
('incline-pushup','box'),('knee-pushup','mat'),('body-row','rings'),('band-row','resistance-band'),
('assisted-pullup','pullup-bar'),('assisted-pullup','resistance-band'),('pullup','pullup-bar'),('box-stepup','box'),
('box-jump','box'),('kettlebell-deadlift','kettlebell'),('kettlebell-goblet-squat','kettlebell'),
('sandbag-squat','sandbag'),('sandbag-ground-shoulder','sandbag'),('front-plank','mat'),('dead-bug','mat'),
('bird-dog','mat'),('hollow-hold','mat'),('farmer-march','kettlebell'),('short-intervals','cones'),('long-intervals','cones'),
('shuttle-run','cones'),('strides','cones'),('acceleration-run','cones'),('deceleration-drill','cones'),
('cone-slalom-run','cones'),('lateral-shuffle-run','cones'),('relay-run','cones'),('run-exercise-100m','cones'),
('run-obstacle-transition','cones'),('dead-hang','pullup-bar'),('active-hang','pullup-bar'),('towel-hang','pullup-bar'),
('ring-hang','rings'),('ring-row','rings'),('ring-traverse','rings'),('monkeybars-basic','monkey-bars'),
('monkeybars-skip','monkey-bars'),('lateral-bar-traverse','pullup-bar'),('rope-grip-hold','rope'),
('rope-pull-seated','rope'),('rope-climb-footlock','rope'),('scapular-swing','pullup-bar'),('rig-transition','rings'),
('assisted-rig-traverse','rings'),('assisted-rig-traverse','resistance-band'),('farmer-carry','kettlebell'),
('suitcase-carry','kettlebell'),('sandbag-bearhug-carry','sandbag'),('sandbag-shoulder-carry','sandbag'),
('sandbag-front-carry','sandbag'),('bucket-carry','bucket'),('atlas-ball-carry','atlas-ball'),('team-object-carry','sandbag'),
('sled-drag','sled'),('tire-drag','tire'),('tire-flip','tire'),('low-crawl','mat'),('army-crawl','mat'),
('wall-stepover-low','wall'),('wall-vault-basic','wall'),('incline-wall-run','wall'),('cargo-net-climb','cargo-net'),
('cargo-net-traverse','cargo-net'),('over-under','wall'),('box-over','box'),('rope-traverse','rope'),
('rig-run-interval','pullup-bar'),('wall-run-transition','wall'),('wall-run-transition','cones'),('crawl-run-transition','cones'),
('balance-beam-walk','balance-beam'),('balance-beam-carry','balance-beam'),('balance-beam-carry','kettlebell'),
('agility-ladder-one-in','agility-ladder'),('agility-ladder-inout','agility-ladder'),('cone-change-direction','cones'),
('mini-hurdle-step','mini-hurdles'),('medicine-ball-chest-pass','medicine-ball'),('medicine-ball-overhead','medicine-ball'),
('medicine-ball-rotational','medicine-ball'),('sandbag-target-throw','sandbag'),('spear-target-drill','spear-trainer'),
('ball-target-throw','medicine-ball'),('breathing-reset','mat'),('hamstring-stretch','mat'),('hip-flexor-stretch','mat'),
('glute-stretch','mat'),('child-pose','mat'),('supine-twist','mat')
) AS v(exercise_key,equipment_key);

INSERT OR IGNORE INTO exercise_equipment (exercise_id, equipment_id, quantity_required)
SELECT ex.id, eq.id, 1
FROM seed_equipment_map m
JOIN exercises ex ON ex.seed_key = m.exercise_key
JOIN equipment eq ON eq.seed_key = m.equipment_key;

CREATE TEMP TABLE seed_aliases AS SELECT * FROM (VALUES
('air-squat','de','Kniebeugen'),('air-squat','de','Squat'),('pushup','de','Liegestütze'),('pushup','en','Pushups'),
('pullup','de','Klimmzüge'),('pullup','en','Pullups'),('dead-hang','de','Hängen'),('monkeybars-basic','de','Hangeln'),
('monkeybars-basic','de','Monkeybar'),('farmer-carry','de','Farmers Walk'),('easy-run','de','Dauerlauf'),
('easy-run','de','Grundlagenlauf'),('shuttle-run','de','Pendellauf'),('hill-repeats','de','Bergläufe'),
('running-high-knees','de','Lauf ABC Kniehebelauf'),('running-butt-kicks','de','Lauf ABC Anfersen'),
('run-exercise-100m','de','Alle 100 Meter'),('bear-crawl','de','Bärengang'),('rope-climb-footlock','de','Seilklettern'),
('wall-vault-basic','de','Wand überwinden'),('spear-target-drill','de','Speerwurf'),('front-plank','de','Plank'),
('box-stepup','de','Kastensteigen'),('fartlek','de','Fahrtspiel')
) AS v(exercise_key,locale,alias);

INSERT OR IGNORE INTO exercise_aliases (exercise_id, locale, alias)
SELECT e.id, a.locale, a.alias FROM seed_aliases a JOIN exercises e ON e.seed_key = a.exercise_key;

DELETE FROM search_documents_de WHERE entity_type = 'exercise';
DELETE FROM search_documents_en WHERE entity_type = 'exercise';

INSERT INTO search_documents_de (document_id, entity_type, entity_id, title, aliases, summary, tags, body_regions, equipment, instructions)
SELECT 'exercise:' || e.id::VARCHAR, 'exercise', e.id::VARCHAR, t.name,
  COALESCE((SELECT string_agg(a.alias, ' ') FROM exercise_aliases a WHERE a.exercise_id=e.id AND a.locale='de'), ''),
  COALESCE(t.summary,''),
  e.category || ' ' || COALESCE((SELECT string_agg(et.tag_id, ' ') FROM exercise_tags et WHERE et.exercise_id=e.id),''),
  COALESCE((SELECT string_agg(ebr.body_region_id, ' ') FROM exercise_body_regions ebr WHERE ebr.exercise_id=e.id),''),
  COALESCE((SELECT string_agg(eq.name_de, ' ') FROM exercise_equipment ee JOIN equipment eq ON eq.id=ee.equipment_id WHERE ee.exercise_id=e.id),''),
  COALESCE(t.instructions,'')
FROM exercises e JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='de' WHERE e.archived=false;

INSERT INTO search_documents_en (document_id, entity_type, entity_id, title, aliases, summary, tags, body_regions, equipment, instructions)
SELECT 'exercise:' || e.id::VARCHAR, 'exercise', e.id::VARCHAR, t.name,
  COALESCE((SELECT string_agg(a.alias, ' ') FROM exercise_aliases a WHERE a.exercise_id=e.id AND a.locale='en'), ''),
  COALESCE(t.summary,''),
  e.category || ' ' || COALESCE((SELECT string_agg(et.tag_id, ' ') FROM exercise_tags et WHERE et.exercise_id=e.id),''),
  COALESCE((SELECT string_agg(ebr.body_region_id, ' ') FROM exercise_body_regions ebr WHERE ebr.exercise_id=e.id),''),
  COALESCE((SELECT string_agg(COALESCE(eq.name_en,eq.name_de), ' ') FROM exercise_equipment ee JOIN equipment eq ON eq.id=ee.equipment_id WHERE ee.exercise_id=e.id),''),
  COALESCE(t.instructions,'')
FROM exercises e JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='en' WHERE e.archived=false;

UPDATE search_index_state SET status='dirty', last_error=NULL WHERE locale IN ('de','en');

CREATE OR REPLACE VIEW exercise_seed_coverage AS
SELECT category, count(*) AS exercise_count
FROM exercises WHERE seed_key IS NOT NULL AND archived=false
GROUP BY category ORDER BY category;

INSERT OR IGNORE INTO schema_migrations (version, name) VALUES (3, 'seed_exercise_catalog');
DROP TABLE seed_aliases;
DROP TABLE seed_equipment_map;
DROP TABLE seed_exercises;
COMMIT;
