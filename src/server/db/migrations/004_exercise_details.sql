BEGIN TRANSACTION;

-- Searchable exercise instructions are localized; logistics/classification stay
-- structured on the exercise record. Ordered coaching text lives in child rows.
CREATE TABLE IF NOT EXISTS exercise_details (
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  locale VARCHAR NOT NULL CHECK (locale IN ('de','en')),
  purpose VARCHAR NOT NULL,
  setup VARCHAR NOT NULL,
  start_position VARCHAR NOT NULL,
  finish_reset VARCHAR NOT NULL,
  breathing_cue VARCHAR NOT NULL,
  tempo_cue VARCHAR NOT NULL,
  safety_notes VARCHAR NOT NULL,
  quality_criteria VARCHAR NOT NULL,
  beginner_prescription VARCHAR NOT NULL,
  standard_prescription VARCHAR NOT NULL,
  advanced_prescription VARCHAR NOT NULL,
  work_rest_guidance VARCHAR NOT NULL,
  level_1 VARCHAR NOT NULL,
  level_2 VARCHAR NOT NULL,
  level_3 VARCHAR NOT NULL,
  child_youth_variant VARCHAR NOT NULL,
  prerequisites VARCHAR NOT NULL,
  fallback_exercise VARCHAR NOT NULL,
  difficulty VARCHAR NOT NULL CHECK (difficulty IN ('beginner','intermediate','advanced')),
  supervision VARCHAR NOT NULL CHECK (supervision IN ('normal','increased','direct')),
  space_requirement VARCHAR NOT NULL,
  setup_seconds INTEGER NOT NULL,
  transition_seconds INTEGER NOT NULL,
  station_capacity INTEGER NOT NULL,
  PRIMARY KEY (exercise_id, locale)
);

CREATE TABLE IF NOT EXISTS exercise_execution_steps (
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  locale VARCHAR NOT NULL CHECK (locale IN ('de','en')),
  step_order SMALLINT NOT NULL,
  instruction VARCHAR NOT NULL,
  PRIMARY KEY (exercise_id, locale, step_order)
);
CREATE TABLE IF NOT EXISTS exercise_coaching_cues (
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  locale VARCHAR NOT NULL CHECK (locale IN ('de','en')),
  cue_order SMALLINT NOT NULL,
  cue VARCHAR NOT NULL,
  PRIMARY KEY (exercise_id, locale, cue_order)
);
CREATE TABLE IF NOT EXISTS exercise_common_mistakes (
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  locale VARCHAR NOT NULL CHECK (locale IN ('de','en')),
  mistake_order SMALLINT NOT NULL,
  mistake VARCHAR NOT NULL,
  correction VARCHAR NOT NULL,
  PRIMARY KEY (exercise_id, locale, mistake_order)
);
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS exercise_type VARCHAR DEFAULT 'drill';
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS difficulty VARCHAR DEFAULT 'beginner';
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS impact_level VARCHAR DEFAULT 'low';
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS coordination_complexity VARCHAR DEFAULT 'simple';
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS progression_required BOOLEAN DEFAULT false;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS space_requirement VARCHAR DEFAULT 'medium';
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS supports_reps BOOLEAN DEFAULT true;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS supports_seconds BOOLEAN DEFAULT true;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS supports_minutes BOOLEAN DEFAULT false;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS supports_metres BOOLEAN DEFAULT false;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS supports_rounds BOOLEAN DEFAULT true;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS supports_attempts BOOLEAN DEFAULT false;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS setup_seconds INTEGER DEFAULT 60;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS transition_seconds INTEGER DEFAULT 30;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS station_capacity INTEGER DEFAULT 1;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS suitable_for_kids BOOLEAN DEFAULT true;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS suitable_for_youth BOOLEAN DEFAULT true;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS suitable_for_adults BOOLEAN DEFAULT true;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS supervision VARCHAR DEFAULT 'normal';
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS indoor_suitable BOOLEAN DEFAULT true;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS outdoor_suitable BOOLEAN DEFAULT true;

UPDATE exercises SET
  exercise_type = CASE category WHEN 'running' THEN 'endurance' WHEN 'mobility' THEN 'mobility' WHEN 'cooldown' THEN 'recovery' WHEN 'ocr-skill' THEN 'obstacle' WHEN 'balance-agility' THEN 'skill' WHEN 'throw' THEN 'skill' ELSE 'strength' END,
  difficulty = CASE WHEN risk_level='high' THEN 'advanced' WHEN risk_level='medium' THEN 'intermediate' ELSE 'beginner' END,
  impact_level = CASE WHEN seed_key LIKE '%jump%' OR seed_key LIKE '%bounding%' THEN 'high' WHEN category='running' OR category='balance-agility' THEN 'moderate' ELSE 'low' END,
  coordination_complexity = CASE WHEN risk_level='high' OR category IN ('ocr-skill','balance-agility','throw') THEN 'complex' WHEN category IN ('running','grip-rig') THEN 'moderate' ELSE 'simple' END,
  progression_required = category IN ('ocr-skill','grip-rig','throw') AND risk_level IN ('medium','high'),
  supervision = CASE WHEN risk_level='high' OR category IN ('ocr-skill','grip-rig') THEN 'direct' WHEN risk_level='medium' THEN 'increased' ELSE 'normal' END,
  space_requirement = CASE WHEN category='running' THEN 'running-route' WHEN category IN ('ocr-skill','grip-rig') THEN 'rig-area' WHEN category IN ('throw','carry-lift') THEN 'large' ELSE 'small' END,
  supports_metres = category IN ('running','carry-lift'),
  supports_minutes = category IN ('running','cooldown'),
  supports_attempts = category IN ('ocr-skill','throw','grip-rig'),
  setup_seconds = CASE WHEN category IN ('ocr-skill','grip-rig','throw') THEN 180 ELSE 60 END,
  transition_seconds = CASE WHEN category IN ('ocr-skill','grip-rig','throw') THEN 45 ELSE 20 END,
  station_capacity = CASE WHEN category IN ('ocr-skill','grip-rig','throw') THEN 1 WHEN category='running' THEN 12 ELSE 4 END,
  suitable_for_kids = min_age IS NULL OR min_age <= 12,
  suitable_for_youth = min_age IS NULL OR min_age <= 16
WHERE seed_key IS NOT NULL;

INSERT INTO exercise_details (exercise_id,locale,purpose,setup,start_position,finish_reset,breathing_cue,tempo_cue,safety_notes,quality_criteria,beginner_prescription,standard_prescription,advanced_prescription,work_rest_guidance,level_1,level_2,level_3,child_youth_variant,prerequisites,fallback_exercise,difficulty,supervision,space_requirement,setup_seconds,transition_seconds,station_capacity)
SELECT e.id, l.locale,
  CASE e.category WHEN 'running' THEN CASE l.locale WHEN 'de' THEN 'Verbessert die Lauf-Ausdauer oder Lauftechnik in einer kontrollierbaren Belastung.' ELSE 'Builds running endurance or technique at a controllable effort.' END
    WHEN 'grip-rig' THEN CASE l.locale WHEN 'de' THEN 'Entwickelt Griffkraft und sicheres Bewegen am Rig in kleinen, kontrollierten Schritten.' ELSE 'Develops grip strength and controlled movement on the rig.' END
    WHEN 'ocr-skill' THEN CASE l.locale WHEN 'de' THEN 'Übt eine Hindernisbewegung mit klarer Progression und sicherem Ausstieg.' ELSE 'Practises an obstacle movement with a clear progression and safe exit.' END
    WHEN 'carry-lift' THEN CASE l.locale WHEN 'de' THEN 'Trainiert das sichere Aufnehmen und Transportieren einer Last mit stabiler Körperhaltung.' ELSE 'Trains safe lifting and carrying with a stable posture.' END
    WHEN 'cooldown' THEN CASE l.locale WHEN 'de' THEN 'Senkt das Tempo und unterstützt ruhige Atmung und Beweglichkeit nach der Belastung.' ELSE 'Reduces effort and supports calm breathing and mobility after training.' END
    WHEN 'mobility' THEN CASE l.locale WHEN 'de' THEN 'Bereitet Gelenke kontrolliert auf die Bewegungen der Einheit vor.' ELSE 'Prepares joints in a controlled way for the session movements.' END
    ELSE CASE l.locale WHEN 'de' THEN 'Übt die Bewegung mit stabiler Technik und einer an die Gruppe angepassten Belastung.' ELSE 'Practises the movement with stable technique and workload matched to the group.' END END,
  CASE WHEN e.category IN ('ocr-skill','grip-rig','throw') THEN CASE l.locale WHEN 'de' THEN 'Prüfe Gerät und freie Sicherheitszone; richte eine klare Warte- und Bewegungsrichtung ein.' ELSE 'Check equipment and the clear safety zone; set a waiting area and one-way movement.' END
    WHEN e.category='running' THEN CASE l.locale WHEN 'de' THEN 'Markiere eine freie Strecke mit Wendepunkten; prüfe Boden, Verkehr und Gruppengröße.' ELSE 'Mark a clear route and turn points; check surface, traffic and group size.' END
    ELSE CASE l.locale WHEN 'de' THEN 'Schaffe rutschfesten Platz und lege benötigtes Material griffbereit an den Rand.' ELSE 'Clear a non-slip space and place any needed equipment within reach.' END END,
  CASE WHEN e.category='running' THEN CASE l.locale WHEN 'de' THEN 'Aufrecht stehen, Blick nach vorn, Schultern locker; starte erst auf Signal.' ELSE 'Stand tall, look ahead and relax the shoulders; start on the signal.' END
    WHEN e.category IN ('ocr-skill','grip-rig') THEN CASE l.locale WHEN 'de' THEN 'Warte hinter der Markierung und beginne nur am geprüften, freigegebenen Gerät.' ELSE 'Wait behind the marker and start only on inspected, approved equipment.' END
    ELSE CASE l.locale WHEN 'de' THEN 'Nimm eine stabile, schmerzfreie Ausgangsposition ein und richte den Blick auf den Bewegungsweg.' ELSE 'Take a stable, pain-free starting position and look along the movement path.' END END,
  CASE l.locale WHEN 'de' THEN 'Kehre kontrolliert zum Start zurück, sichere Material und gib den Platz für die nächste Person frei.' ELSE 'Return under control, secure equipment and clear the space for the next person.' END,
  CASE l.locale WHEN 'de' THEN 'Atme gleichmäßig; halte nicht die Luft an. Bei Anstrengung ruhig ausatmen.' ELSE 'Breathe steadily; do not hold your breath. Exhale calmly during effort.' END,
  CASE WHEN e.category='running' THEN CASE l.locale WHEN 'de' THEN 'Locker und gleichmäßig beginnen; Tempo nur steigern, solange die Technik sauber bleibt.' ELSE 'Start easy and even; increase pace only while technique stays smooth.' END ELSE CASE l.locale WHEN 'de' THEN 'Kontrolliert bewegen, kurz stabilisieren und ohne Schwung in die nächste Wiederholung gehen.' ELSE 'Move with control, stabilise briefly and avoid swinging into the next repetition.' END END,
  CASE WHEN e.risk_level='high' THEN CASE l.locale WHEN 'de' THEN 'Sofort stoppen bei Schmerzen, Kontrollverlust, beschädigtem Gerät oder unsicherer Landung; nur einzeln und mit direkter Aufsicht.' ELSE 'Stop for pain, loss of control, damaged equipment or an unsafe landing; one athlete at a time under direct supervision.' END ELSE CASE l.locale WHEN 'de' THEN 'Bei Schmerzen, Schwindel oder unsicherem Untergrund abbrechen; Belastung so wählen, dass saubere Wiederholungen möglich bleiben.' ELSE 'Stop for pain, dizziness or unsafe footing; choose a workload that allows clean repetitions.' END END,
  CASE WHEN e.category='running' THEN CASE l.locale WHEN 'de' THEN 'Ruhiger Oberkörper, lockere Arme, leise Schritte und ein Tempo, bei dem die Vorgabe kontrolliert eingehalten wird.' ELSE 'Quiet torso, relaxed arms, light steps and a pace that keeps the interval controlled.' END ELSE CASE l.locale WHEN 'de' THEN 'Bewegung bleibt schmerzfrei und kontrolliert; Körperposition und Gerät bleiben während jeder Wiederholung stabil.' ELSE 'Movement stays pain-free and controlled; body position and equipment remain stable throughout each repetition.' END END,
  CASE WHEN e.risk_level='high' THEN '3–5 kontrollierte Versuche' ELSE '2 Runden mit 6–8 sauberen Wiederholungen oder 20 Sekunden' END,
  CASE WHEN e.category='running' THEN '10–20 Minuten locker, Sprechtempo' ELSE '3 Runden mit 8–12 Wiederholungen oder 30 Sekunden' END,
  CASE WHEN e.category='running' THEN '4–6 Intervalle; zügig, aber ohne Sprintzwang' ELSE '3–4 Runden mit 10–15 Wiederholungen; Technik bleibt unverändert' END,
  CASE l.locale WHEN 'de' THEN 'Zwischen Sätzen 30–60 Sekunden pausieren; bei Technik- oder Hindernisarbeit vollständig erholen.' ELSE 'Rest 30–60 seconds between sets; recover fully for skill and obstacle work.' END,
  CASE l.locale WHEN 'de' THEN 'Bewegungsweg verkürzen, Tempo senken oder eine stabile Unterstützung verwenden.' ELSE 'Shorten the range, slow down or use stable support.' END,
  CASE l.locale WHEN 'de' THEN 'Bewegung in kontrolliertem Tempo und mit freigegebener Standardausführung.' ELSE 'Use a controlled pace and the approved standard execution.' END,
  CASE l.locale WHEN 'de' THEN 'Nur eine Schwierigkeit steigern: Weg, Dauer, Tempo oder Koordination; nie gleichzeitig Höhe und Ermüdung.' ELSE 'Increase only one challenge: distance, duration, pace or coordination; never height and fatigue together.' END,
  CASE l.locale WHEN 'de' THEN 'Als Spiel oder kurze Technikaufgabe mit niedriger Höhe, weichem Tempo und häufigen Erfolgen gestalten; keine erzwungenen Wiederholungen.' ELSE 'Use as a game or short skill task at low height and easy pace with frequent success; do not force repetitions.' END,
  CASE WHEN e.category IN ('ocr-skill','grip-rig') THEN CASE l.locale WHEN 'de' THEN 'Voraussetzung: sicherer Auf- und Abstieg, kontrollierter Griff und Verständnis des Stoppsignals.' ELSE 'Prerequisite: safe mounting and dismounting, controlled grip and understanding the stop signal.' END ELSE CASE l.locale WHEN 'de' THEN 'Keine besondere Voraussetzung; Grundbewegung schmerzfrei ausführen können.' ELSE 'No special prerequisite; athlete can perform the basic movement without pain.' END END,
  CASE l.locale WHEN 'de' THEN 'Bei fehlendem oder gesperrtem Gerät auf eine bodennahe, kontrollierte Variante derselben Bewegungsrichtung wechseln.' ELSE 'If equipment is unavailable or closed, use a low-level controlled variation of the same movement pattern.' END,
  CASE WHEN e.risk_level='high' THEN 'advanced' WHEN e.risk_level='medium' THEN 'intermediate' ELSE 'beginner' END,
  CASE WHEN e.risk_level='high' OR e.category IN ('ocr-skill','grip-rig') THEN 'direct' WHEN e.risk_level='medium' THEN 'increased' ELSE 'normal' END,
  e.space_requirement, e.setup_seconds, e.transition_seconds, e.station_capacity
FROM exercises e CROSS JOIN (VALUES ('de'),('en')) l(locale)
WHERE e.seed_key IS NOT NULL;

-- Three clear, translated coaching steps per seeded exercise.
INSERT INTO exercise_execution_steps
SELECT e.id,l.locale,n.step_order,
  CASE l.locale WHEN 'de' THEN CASE n.step_order WHEN 1 THEN 'Höre die kurze Demonstration an und prüfe Startposition sowie Bewegungsweg.' WHEN 2 THEN 'Beginne auf das Signal und bewege dich kontrolliert durch den vollständigen, schmerzfreien Bewegungsweg.' ELSE 'Beende die Wiederholung ruhig, prüfe deine Haltung und starte erst dann erneut.' END
  ELSE CASE n.step_order WHEN 1 THEN 'Watch the brief demonstration and check the start position and movement path.' WHEN 2 THEN 'Start on the signal and move under control through the full, pain-free range.' ELSE 'Finish the repetition calmly, check your position and then begin again.' END END
FROM exercises e CROSS JOIN (VALUES ('de'),('en')) l(locale) CROSS JOIN (VALUES (1),(2),(3)) n(step_order)
WHERE e.seed_key IS NOT NULL;

INSERT INTO exercise_coaching_cues
SELECT e.id,l.locale,n.cue_order,CASE l.locale WHEN 'de' THEN n.de ELSE n.en END
FROM exercises e CROSS JOIN (VALUES ('de'),('en')) l(locale)
CROSS JOIN (VALUES (1,'Ruhig starten','Start smoothly'),(2,'Sauber vor schnell','Quality before speed'),(3,'Atme weiter','Keep breathing')) n(cue_order,de,en)
WHERE e.seed_key IS NOT NULL;

INSERT INTO exercise_common_mistakes
SELECT e.id,l.locale,n.mistake_order,CASE l.locale WHEN 'de' THEN n.de ELSE n.en END,
  CASE l.locale WHEN 'de' THEN n.fix_de ELSE n.fix_en END
FROM exercises e CROSS JOIN (VALUES ('de'),('en')) l(locale)
CROSS JOIN (VALUES
 (1,'Tempo wird zu hoch und die Haltung kippt.','Tempo senken und nur saubere Wiederholungen zählen.','Pace gets too fast and posture breaks down.','Slow down and count only clean repetitions.'),
 (2,'Blick oder Aufmerksamkeit verlässt den Bewegungsweg.','Warte kurz, richte den Blick neu aus und setze kontrolliert fort.','Attention leaves the movement path.','Pause, refocus and continue under control.')
) n(mistake_order,de,fix_de,en,fix_en)
WHERE e.seed_key IS NOT NULL;

INSERT INTO schema_migrations (version,name) VALUES (4,'exercise_details');
COMMIT;
