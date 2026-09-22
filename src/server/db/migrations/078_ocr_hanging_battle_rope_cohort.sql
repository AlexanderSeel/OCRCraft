BEGIN TRANSACTION;

-- OCRCraft-original OCR gap cohort. External catalog matches informed the gap
-- selection only; all names, instructions and safety guidance below are original.
INSERT INTO exercises (
  seed_key,canonical_name,category,default_phase,risk_level,min_age,indoor,outdoor,
  exercise_type,difficulty,impact_level,coordination_complexity,progression_required,
  space_requirement,supports_reps,supports_seconds,supports_minutes,supports_metres,
  supports_rounds,supports_attempts,setup_seconds,transition_seconds,station_capacity,
  suitable_for_kids,suitable_for_youth,suitable_for_adults,supervision,
  indoor_suitable,outdoor_suitable,laterality,movement_plane
)
SELECT v.seed_key,v.name_en,v.category,'main',v.risk,v.min_age,true,true,
  v.exercise_type,v.difficulty,v.impact,v.coordination,true,
  v.space_requirement,true,true,false,false,true,false,45,20,v.capacity,
  false,true,true,'increased',true,true,v.laterality,v.plane
FROM (VALUES
  ('hanging-knee-raise','Hanging Knee Raise','core','medium',12,'strength','beginner','low','moderate','small','bilateral','sagittal',6),
  ('hanging-straight-leg-raise','Hanging Straight-Leg Raise','core','medium',14,'strength','intermediate','low','complex','medium','bilateral','sagittal',4),
  ('hanging-pike','Hanging Pike','core','high',16,'strength','advanced','low','complex','medium','bilateral','sagittal',3),
  ('hanging-oblique-knee-raise','Hanging Oblique Knee Raise','core','medium',14,'strength','intermediate','low','complex','medium','alternating','multiplanar',4),
  ('battle-rope-waves','Battle Rope Waves','ocr-skill','medium',12,'conditioning','beginner','moderate','moderate','medium','alternating','multiplanar',6)
) AS v(seed_key,name_en,category,risk,min_age,exercise_type,difficulty,impact,coordination,space_requirement,laterality,plane,capacity)
WHERE NOT EXISTS (SELECT 1 FROM exercises e WHERE e.seed_key=v.seed_key);

INSERT INTO exercise_translations (exercise_id,locale,name,summary)
SELECT e.id,v.locale,v.name,v.summary FROM exercises e JOIN (VALUES
  ('hanging-knee-raise','de','Hanging Knee Raise','Hänge an einer stabilen Stange und ziehe die Knie kontrolliert zur Körpermitte, ohne zu schwingen.'),
  ('hanging-knee-raise','en','Hanging Knee Raise','Hang from a stable bar and draw the knees toward the trunk under control without swinging.'),
  ('hanging-straight-leg-raise','de','Hängendes Beinheben','Hebe aus einem aktiven Hang die gestreckten Beine nur so weit, wie Schulter und Rumpf stabil bleiben.'),
  ('hanging-straight-leg-raise','en','Hanging Straight-Leg Raise','From an active hang, lift straight legs only as far as the shoulders and trunk stay controlled.'),
  ('hanging-pike','de','Hanging Pike','Führe die gestreckten Beine aus dem Hang in Richtung Stange und behalte die Bewegung vollständig unter Kontrolle.'),
  ('hanging-pike','en','Hanging Pike','Move straight legs from a hang toward the bar while keeping the entire action controlled.'),
  ('hanging-oblique-knee-raise','de','Seitliches Knieheben im Hang','Ziehe die Knie leicht seitlich zur Körpermitte und verhindere ein Ausweichen des Oberkörpers.'),
  ('hanging-oblique-knee-raise','en','Hanging Oblique Knee Raise','Draw the knees slightly to one side toward the trunk while keeping the upper body controlled.'),
  ('battle-rope-waves','de','Battle-Rope-Wellen','Erzeuge abwechselnde Seilwellen aus einer stabilen Ganzkörperposition mit kontrolliertem Rhythmus.'),
  ('battle-rope-waves','en','Battle Rope Waves','Create alternating rope waves from a stable whole-body position with a controlled rhythm.')
) AS v(seed_key,locale,name,summary) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO exercise_aliases (exercise_id,locale,alias)
SELECT e.id,v.locale,v.alias FROM exercises e JOIN (VALUES
  ('hanging-knee-raise','de','Knieheben im Hang'),('hanging-knee-raise','en','Hanging knee tuck'),
  ('hanging-straight-leg-raise','de','Beinheben an der Stange'),('hanging-straight-leg-raise','en','Straight-leg hanging raise'),
  ('hanging-pike','de','Hanging Pike an der Stange'),('hanging-pike','en','Bar pike'),
  ('hanging-oblique-knee-raise','de','Seitliches Knieheben'),('hanging-oblique-knee-raise','en','Hanging side knee raise'),
  ('battle-rope-waves','de','Seilwellen'),('battle-rope-waves','en','Alternating rope waves')
) AS v(seed_key,locale,alias) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO exercise_aliases (exercise_id,locale,alias)
SELECT e.id,v.locale,v.alias FROM exercises e JOIN (VALUES
  ('hanging-knee-raise','de','Hanging Knee Raise'),('hanging-knee-raise','en','Knieheben im Hang'),
  ('hanging-straight-leg-raise','de','Hanging Straight-Leg Raise'),('hanging-straight-leg-raise','en','Hängendes Beinheben'),
  ('hanging-pike','de','Hanging Pike'),('hanging-pike','en','Hanging Pike'),
  ('hanging-oblique-knee-raise','de','Hanging Oblique Knee Raise'),('hanging-oblique-knee-raise','en','Seitliches Knieheben im Hang'),
  ('battle-rope-waves','de','Battle Rope Waves'),('battle-rope-waves','en','Battle-Rope-Wellen')
) AS v(seed_key,locale,alias) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO exercise_aliases (exercise_id,locale,alias)
SELECT e.id,v.locale,v.alias FROM exercises e JOIN (VALUES
  ('hanging-knee-raise','de','Rumpfübung'),('hanging-knee-raise','en','Core exercise'),
  ('hanging-straight-leg-raise','de','Rumpfübung'),('hanging-straight-leg-raise','en','Core exercise'),
  ('hanging-pike','de','Rumpfübung'),('hanging-pike','en','Core exercise'),
  ('hanging-oblique-knee-raise','de','Rumpfübung'),('hanging-oblique-knee-raise','en','Core exercise'),
  ('battle-rope-waves','de','OCR Hindernistechnik'),('battle-rope-waves','en','OCR obstacle technique')
) AS v(seed_key,locale,alias) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO exercise_body_regions (exercise_id,body_region_id,emphasis)
SELECT e.id,v.region,v.emphasis FROM exercises e JOIN (VALUES
  ('hanging-knee-raise','core','primary'),('hanging-knee-raise','shoulders','secondary'),('hanging-knee-raise','forearms-grip','secondary'),
  ('hanging-straight-leg-raise','core','primary'),('hanging-straight-leg-raise','hip-flexors','secondary'),('hanging-straight-leg-raise','forearms-grip','secondary'),
  ('hanging-pike','core','primary'),('hanging-pike','shoulders','secondary'),('hanging-pike','forearms-grip','secondary'),
  ('hanging-oblique-knee-raise','obliques','primary'),('hanging-oblique-knee-raise','core','primary'),('hanging-oblique-knee-raise','forearms-grip','secondary'),
  ('battle-rope-waves','shoulders','primary'),('battle-rope-waves','core','secondary'),('battle-rope-waves','forearms-grip','secondary')
) AS v(seed_key,region,emphasis) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO exercise_movement_patterns (exercise_id,movement_pattern_id)
SELECT e.id,v.pattern FROM exercises e JOIN (VALUES
  ('hanging-knee-raise','hang'),('hanging-knee-raise','brace'),
  ('hanging-straight-leg-raise','hang'),('hanging-straight-leg-raise','brace'),
  ('hanging-pike','hang'),('hanging-pike','brace'),
  ('hanging-oblique-knee-raise','hang'),('hanging-oblique-knee-raise','rotate'),('hanging-oblique-knee-raise','brace'),
  ('battle-rope-waves','pull'),('battle-rope-waves','brace')
) AS v(seed_key,pattern) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO exercise_tags (exercise_id,tag_id)
SELECT e.id,v.tag_id FROM exercises e JOIN (VALUES
  ('hanging-knee-raise','ocr'),('hanging-knee-raise','core'),('hanging-knee-raise','grip'),
  ('hanging-straight-leg-raise','ocr'),('hanging-straight-leg-raise','core'),('hanging-straight-leg-raise','grip'),
  ('hanging-pike','ocr'),('hanging-pike','core'),('hanging-pike','technique'),
  ('hanging-oblique-knee-raise','ocr'),('hanging-oblique-knee-raise','core'),('hanging-oblique-knee-raise','technique'),
  ('battle-rope-waves','ocr'),('battle-rope-waves','conditioning'),('battle-rope-waves','grip')
) AS v(seed_key,tag_id) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO exercise_training_phases (exercise_id,phase)
SELECT e.id,v.phase FROM exercises e JOIN (VALUES
  ('hanging-knee-raise','main'),('hanging-straight-leg-raise','main'),('hanging-pike','main'),
  ('hanging-oblique-knee-raise','main'),('battle-rope-waves','warmup'),('battle-rope-waves','main')
) AS v(seed_key,phase) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO exercise_training_goals (exercise_id,goal)
SELECT e.id,v.goal FROM exercises e JOIN (VALUES
  ('hanging-knee-raise','strength'),('hanging-knee-raise','ocr_technique'),
  ('hanging-straight-leg-raise','strength'),('hanging-straight-leg-raise','ocr_technique'),
  ('hanging-pike','strength'),('hanging-pike','ocr_technique'),
  ('hanging-oblique-knee-raise','strength'),('hanging-oblique-knee-raise','ocr_technique'),
  ('battle-rope-waves','strength_endurance'),('battle-rope-waves','ocr_technique')
) AS v(seed_key,goal) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO exercise_equipment (exercise_id,equipment_id,quantity_required)
SELECT e.id,q.id,1 FROM exercises e JOIN (VALUES
  ('hanging-knee-raise','pullup-bar'),('hanging-straight-leg-raise','pullup-bar'),('hanging-pike','pullup-bar'),
  ('hanging-oblique-knee-raise','pullup-bar'),('battle-rope-waves','rope')
) AS v(seed_key,equipment_key) ON e.seed_key=v.seed_key JOIN equipment q ON q.seed_key=v.equipment_key;

INSERT INTO exercise_details (
  exercise_id,locale,purpose,setup,start_position,finish_reset,breathing_cue,tempo_cue,safety_notes,
  quality_criteria,beginner_prescription,standard_prescription,advanced_prescription,work_rest_guidance,
  level_1,level_2,level_3,child_youth_variant,prerequisites,fallback_exercise,difficulty,supervision,
  space_requirement,setup_seconds,transition_seconds,station_capacity
)
SELECT e.id,v.locale,v.purpose,v.setup,v.start_position,v.finish_reset,v.breathing,v.tempo,v.safety,
  v.quality,v.beginner,v.standard,v.advanced,v.workrest,v.level1,v.level2,v.level3,v.youth,
  v.prereq,v.fallback,v.difficulty,'increased',v.space_requirement,45,20,v.capacity
FROM exercises e JOIN (VALUES
  ('hanging-knee-raise','de','Baut aktive Hang- und Rumpfkontrolle für Hindernisübergänge auf.','Nutze eine geprüfte Stange mit freiem Raum unter und vor dem Körper.','Aktiver Hang, Schultern weg von den Ohren, Beine ruhig unter dem Becken.','Knie absenken, ohne aus dem Hang zu fallen, kurz neu ordnen und erst dann lösen.','Beim Anheben ausatmen und beim Absenken ruhig einatmen.','Knie langsam heben und senken; kein Schwung aus der Hüfte.','Bei Schulter-, Hand- oder Rückenbeschwerden abbrechen; Sturzbereich und Kapazität vorher prüfen.','Der Körper bleibt ruhig, die Schultern bleiben aktiv und die Knie bewegen sich kontrolliert.','2 x 4 mit Teilweg und Füßen nahe am Boden','3 x 5–8 kontrollierte Wiederholungen','3 x 8–10 mit kurzer Pause oben','60–90 Sekunden Pause; jeweils nur eine Person pro Station.','Beine am Boden leicht entlasten.','Knie bis etwa Hüfthöhe heben.','Oben zwei Sekunden halten oder den Bewegungsweg verlängern.','Nur an niedriger, freigegebener Stange mit direkter Aufsicht.','Sicherer aktiver Hang und schmerzfreies Knieheben im Stand.','Sitzendes Knieheben oder Dead Bug Heel Tap.','beginner','small',6),
  ('hanging-knee-raise','en','Builds active hanging and trunk control for obstacle transitions.','Use an inspected bar with clear space below and in front of the body.','Active hang with shoulders away from the ears and legs quiet below the pelvis.','Lower the knees without dropping from the hang, reset briefly and then release.','Exhale while lifting and inhale calmly while lowering.','Lift and lower slowly; do not swing from the hips.','Stop for shoulder, hand or back discomfort; check the fall zone and capacity first.','The body stays quiet, shoulders stay active and the knees move with control.','2 x 4 partial range with feet close to the floor','3 x 5–8 controlled repetitions','3 x 8–10 with a brief top pause','Rest 60–90 seconds; one person per station.','Lightly unload the feet on the floor.','Lift the knees to about hip height.','Hold for two seconds or lengthen the range.','Use only a low approved bar with direct supervision.','Safe active hang and pain-free standing knee lift.','Seated knee lift or Dead Bug Heel Tap.','beginner','small',6),
  ('hanging-straight-leg-raise','de','Entwickelt Rumpfspannung und Hüftkontrolle unter der Belastung eines aktiven Hangs.','Nutze eine geprüfte Stange, weiche Landefläche und einen vollständig freien Schwingbereich.','Aktiver Hang mit langen Beinen; Rippen und Becken bleiben kontrolliert.','Beine langsam absenken, Hang neu stabilisieren und erst danach entspannen.','Ausatmen beim Heben, ruhig einatmen beim Absenken.','Nur so weit heben, wie kein Schwung und kein Schulterverlust entsteht.','Nur für Personen mit sicherem Hang; direkte Aufsicht und freier Sturzbereich sind Pflicht.','Beine bleiben möglichst lang, ohne dass der Oberkörper pendelt oder die Schulter hochzieht.','2 x 3 mit leicht gebeugten Knien','3 x 4–6 kontrollierte Wiederholungen','3 x 6–8 mit größerem Bewegungsweg','90 Sekunden Pause und vollständige Griff-Erholung.','Knieheben mit kleinem Bewegungsweg.','Gestreckte Beine bis etwa 45 Grad führen.','Beine höher führen, ohne den Hang zu verlieren.','Für Jugendliche nur niedrig dosiert und mit Trainerfreigabe.','Sicherer aktiver Hang und kontrolliertes Knieheben.','Hanging Knee Raise.','intermediate','medium',4),
  ('hanging-straight-leg-raise','en','Develops trunk tension and hip control under the load of an active hang.','Use an inspected bar, a forgiving landing surface and a fully clear swing zone.','Active hang with long legs while ribs and pelvis stay controlled.','Lower the legs slowly, stabilise the hang and only then relax.','Exhale while lifting and inhale calmly while lowering.','Lift only as far as there is no swing or loss of shoulder control.','Only for athletes with a secure hang; direct supervision and a clear fall zone are required.','Legs stay long without the trunk swinging or shoulders shrugging.','2 x 3 with slightly bent knees','3 x 4–6 controlled repetitions','3 x 6–8 with a larger range','Rest 90 seconds and fully recover the grip.','Knee raise through a short range.','Raise straight legs to about 45 degrees.','Raise higher without losing the hang.','Use low volume for youth with coach approval.','Secure active hang and controlled knee raise.','Hanging Knee Raise.','intermediate','medium',4),
  ('hanging-pike','de','Verbindet starke Rumpfspannung mit kontrollierter Hüftbeugung für anspruchsvolle OCR-Hangaufgaben.','Nutze nur eine geprüfte hohe Stange mit freier Zone und geschütztem Untergrund.','Aktiver Hang, Beine geschlossen und Schultern stabil nach unten organisiert.','Beine langsam zurückführen, ohne in einen passiven Hang zu fallen.','Ausatmen in der Hebephase, ruhig einatmen beim Zurückführen.','Langsam arbeiten; kein Kippen oder Anschwingen in die Endposition.','Nur für fortgeschrittene Erwachsene oder ausdrücklich freigegebene Jugendliche; Station einzeln und beaufsichtigt nutzen.','Die Beine steigen kontrolliert, der Griff bleibt geschlossen und der Körper schwingt nicht.','2 x 2 aus einer verkürzten Knieposition','3 x 3–5 kontrollierte Wiederholungen','3 x 5 mit kurzer Pause nahe der Endposition','90–120 Sekunden Pause zwischen Versuchen.','Hanging Knee Raise mit kurzem Halt.','Beine bis etwa 90 Grad heben.','Beine in Richtung Stange führen, ohne Schwung.','Nicht als Kids-Standardübung einsetzen; nur als Trainerdemonstration.','Sicherer aktiver Hang, mehrere kontrollierte Knee Raises und schmerzfreie Schulterbewegung.','Hanging Straight-Leg Raise oder Hanging Knee Raise.','advanced','medium',3),
  ('hanging-pike','en','Combines strong trunk tension with controlled hip flexion for demanding OCR hanging tasks.','Use only an inspected high bar with a clear zone and protected landing surface.','Active hang with legs together and shoulders organised down and stable.','Return the legs slowly without dropping into a passive hang.','Exhale during the lift and inhale calmly while returning.','Move slowly; do not tip or swing into the end position.','For advanced adults or explicitly approved youth only; use one athlete at a time under supervision.','Legs rise under control, the grip stays closed and the body does not swing.','2 x 2 from a shortened knee position','3 x 3–5 controlled repetitions','3 x 5 with a brief end-position pause','Rest 90–120 seconds between attempts.','Hanging Knee Raise with a short hold.','Lift the legs to about 90 degrees.','Move the legs toward the bar without momentum.','Do not use as a kids standard exercise; coach demonstration only.','Secure active hang, several controlled knee raises and pain-free shoulders.','Hanging Straight-Leg Raise or Hanging Knee Raise.','advanced','medium',3),
  ('hanging-oblique-knee-raise','de','Trainiert seitliche Rumpfspannung und kontrollierte Rotation im Hang.','Nutze eine geprüfte Stange mit seitlich freiem Raum und klarer Rücklaufzone.','Aktiver Hang, Knie zunächst unter dem Becken und Rumpf lang.','Knie zur Mitte zurückführen, Körper beruhigen und dann die Seite wechseln.','Beim seitlichen Anheben ausatmen und beim Zurückführen einatmen.','Kleine seitliche Bewegung ohne Verdrehen aus dem Schultergelenk.','Bei Schulter-, Rücken- oder Hüftschmerz abbrechen; keine Pendelbewegungen zulassen.','Die Rotation kommt aus dem Rumpf, der Griff bleibt aktiv und die Rückkehr ist vollständig kontrolliert.','2 x 3 pro Seite mit kleinem Kniehub','3 x 5–6 pro Seite','3 x 8 pro Seite mit kurzem Halt','60–90 Sekunden Pause und Seitenwechsel ohne Eile.','Knieheben im Stand mit seitlicher Gewichtsverlagerung.','Knie im Hang leicht zur Seite führen.','Knie höher führen und zwei Sekunden stabilisieren.','Nur mit direkter Aufsicht und niedriger Wiederholungszahl.','Schmerzfreier aktiver Hang und kontrolliertes Knieheben.','Supported Side Plank Knee oder Hanging Knee Raise.','intermediate','medium',4),
  ('hanging-oblique-knee-raise','en','Trains lateral trunk tension and controlled rotation during a hang.','Use an inspected bar with clear lateral space and a defined return lane.','Active hang with knees below the pelvis and a long trunk.','Return the knees to centre, settle the body and then change sides.','Exhale while lifting to the side and inhale while returning.','Use a small lateral action without twisting from the shoulder.','Stop for shoulder, back or hip pain; do not allow pendulum swings.','Rotation comes from the trunk, the grip stays active and the return is fully controlled.','2 x 3 per side with a small knee lift','3 x 5–6 per side','3 x 8 per side with a brief hold','Rest 60–90 seconds and change sides without rushing.','Standing knee lift with a lateral weight shift.','Guide the hanging knees slightly to one side.','Lift higher and stabilise for two seconds.','Use direct supervision and low repetitions only.','Pain-free active hang and controlled knee lift.','Supported Side Plank Knee or Hanging Knee Raise.','intermediate','medium',4),
  ('battle-rope-waves','de','Entwickelt rhythmische Ganzkörper-Kraftausdauer und Griffausdauer ohne maximale Geschwindigkeit.','Verankere das Seil sicher, markiere Abstand und Rücklauf und halte den Boden trocken und frei.','Stabile Schrittstellung, Knie weich, Rumpf aufrecht und je ein Seilende in der Hand.','Seilenden kontrolliert ablegen, Abstand halten und erst nach dem vollständigen Stoppen wechseln.','Ruhig weiteratmen und den Rhythmus nicht über Pressatmung erzwingen.','Wellen aus Schulter und Armen erzeugen, während Beine und Rumpf stabil bleiben.','Keine Personen im Wellen- oder Rücklaufbereich; bei Schulter-, Rücken- oder Griffproblemen Belastung reduzieren.','Die Wellen bleiben kontrolliert, der Stand bleibt stabil und das Seil wird nicht geworfen.','3 x 10 Sekunden mit breitem Stand','4 x 20–30 Sekunden','5 x 30–40 Sekunden mit stabilem Wechsel','45–60 Sekunden Pause; Station capacity und Seillänge beachten.','Ohne Seil rhythmische Armbewegung im Stand.','Kurze Wellen mit reduziertem Seilgewicht.','Zeit leicht erhöhen, ohne Rhythmus oder Haltung zu verlieren.','Als kurze Teamstation ohne Wettbewerb und ohne Ausscheiden.','Schmerzfreier Stand, sichere Griffposition und klare Stoppsignale.','Band Pull-Apart oder kontrollierte Armwellen ohne Seil.','beginner','medium',6),
  ('battle-rope-waves','en','Develops rhythmic whole-body strength endurance and grip endurance without maximal speed.','Anchor the rope securely, mark spacing and return lanes, and keep the floor dry and clear.','Use a stable stance, soft knees, upright trunk and one rope end in each hand.','Lower the rope ends under control, keep spacing and change only after the rope has stopped.','Keep breathing steadily and do not force the rhythm with a held breath.','Create waves from shoulders and arms while the legs and trunk stay stable.','Keep people out of the wave and return zones; reduce load for shoulder, back or grip issues.','Waves stay controlled, the stance is stable and the rope is never thrown.','3 x 10 seconds with a wide stance','4 x 20–30 seconds','5 x 30–40 seconds with a stable switch','Rest 45–60 seconds; respect station capacity and rope length.','Use rhythmic arm action without a rope.','Use short waves with a lighter rope.','Increase time slightly without losing rhythm or posture.','Use as a short team station without racing or elimination.','Pain-free stance, secure grip and clear stop signals.','Band Pull-Apart or controlled arm waves without a rope.','beginner','medium',6)
) AS v(seed_key,locale,purpose,setup,start_position,finish_reset,breathing,tempo,safety,quality,beginner,standard,advanced,workrest,level1,level2,level3,youth,prereq,fallback,difficulty,space_requirement,capacity)
ON e.seed_key=v.seed_key;

INSERT INTO exercise_execution_steps (exercise_id,locale,step_order,instruction)
SELECT e.id,v.locale,v.step_order,v.instruction FROM exercises e JOIN (VALUES
  ('hanging-knee-raise','de',1,'Aktiven Hang an einer geprüften Stange einnehmen.'),('hanging-knee-raise','de',2,'Knie ohne Schwung zur Körpermitte heben.'),('hanging-knee-raise','de',3,'Knie langsam absenken und den Hang stabilisieren.'),
  ('hanging-knee-raise','en',1,'Take an active hang on an inspected bar.'),('hanging-knee-raise','en',2,'Lift the knees toward the trunk without swinging.'),('hanging-knee-raise','en',3,'Lower the knees slowly and stabilise the hang.'),
  ('hanging-straight-leg-raise','de',1,'Aktiven Hang mit langen Beinen und ruhigem Becken einnehmen.'),('hanging-straight-leg-raise','de',2,'Beine kontrolliert nach vorn heben.'),('hanging-straight-leg-raise','de',3,'Beine langsam senken und den Griff neu ordnen.'),
  ('hanging-straight-leg-raise','en',1,'Take an active hang with long legs and a quiet pelvis.'),('hanging-straight-leg-raise','en',2,'Lift the legs forward under control.'),('hanging-straight-leg-raise','en',3,'Lower the legs slowly and reset the grip.'),
  ('hanging-pike','de',1,'Aktiven Hang mit geschlossenen Beinen aufbauen.'),('hanging-pike','de',2,'Beine ohne Anschwingen in Richtung Stange führen.'),('hanging-pike','de',3,'Langsam zurückkehren und erst am Boden lösen.'),
  ('hanging-pike','en',1,'Build an active hang with legs together.'),('hanging-pike','en',2,'Move the legs toward the bar without swinging.'),('hanging-pike','en',3,'Return slowly and release only at the ground.'),
  ('hanging-oblique-knee-raise','de',1,'Aktiven Hang mit Knieposition unter dem Becken einnehmen.'),('hanging-oblique-knee-raise','de',2,'Knie leicht zu einer Seite heben und den Rumpf kontrollieren.'),('hanging-oblique-knee-raise','de',3,'Zur Mitte zurückkehren und die Seite wechseln.'),
  ('hanging-oblique-knee-raise','en',1,'Take an active hang with knees below the pelvis.'),('hanging-oblique-knee-raise','en',2,'Lift the knees slightly to one side while controlling the trunk.'),('hanging-oblique-knee-raise','en',3,'Return to centre and change sides.'),
  ('battle-rope-waves','de',1,'Stabile Schrittstellung und sicheren Seilabstand prüfen.'),('battle-rope-waves','de',2,'Abwechselnde Wellen mit ruhigem Rumpf erzeugen.'),('battle-rope-waves','de',3,'Wellen kontrolliert stoppen und Seil erst danach ablegen.'),
  ('battle-rope-waves','en',1,'Check the stable stance and safe rope spacing.'),('battle-rope-waves','en',2,'Create alternating waves with a quiet trunk.'),('battle-rope-waves','en',3,'Stop the waves under control before lowering the rope.')
) AS v(seed_key,locale,step_order,instruction) ON e.seed_key=v.seed_key;

INSERT INTO exercise_coaching_cues (exercise_id,locale,cue_order,cue)
SELECT e.id,v.locale,v.cue_order,v.cue FROM exercises e JOIN (VALUES
  ('hanging-knee-raise','de',1,'Schultern aktiv halten'),('hanging-knee-raise','de',2,'Kein Schwung'),('hanging-knee-raise','en',1,'Keep the shoulders active'),('hanging-knee-raise','en',2,'No swinging'),
  ('hanging-straight-leg-raise','de',1,'Rippen ruhig'),('hanging-straight-leg-raise','de',2,'Beine langsam'),('hanging-straight-leg-raise','en',1,'Keep the ribs quiet'),('hanging-straight-leg-raise','en',2,'Move slowly'),
  ('hanging-pike','de',1,'Griff geschlossen'),('hanging-pike','de',2,'Endposition nicht erzwingen'),('hanging-pike','en',1,'Keep a closed grip'),('hanging-pike','en',2,'Do not force the end range'),
  ('hanging-oblique-knee-raise','de',1,'Aus der Mitte rotieren'),('hanging-oblique-knee-raise','de',2,'Körper beruhigen'),('hanging-oblique-knee-raise','en',1,'Rotate from the trunk'),('hanging-oblique-knee-raise','en',2,'Settle the body'),
  ('battle-rope-waves','de',1,'Stabil vor schnell'),('battle-rope-waves','de',2,'Seil nicht werfen'),('battle-rope-waves','en',1,'Stable before fast'),('battle-rope-waves','en',2,'Never throw the rope')
) AS v(seed_key,locale,cue_order,cue) ON e.seed_key=v.seed_key;

INSERT INTO exercise_common_mistakes (exercise_id,locale,mistake_order,mistake,correction)
SELECT e.id,v.locale,1,v.mistake,v.correction FROM exercises e JOIN (VALUES
  ('hanging-knee-raise','de','Die Knie werden aus dem Schwung angehoben.','Bewegungsweg verkürzen und zwischen Wiederholungen vollständig beruhigen.'),('hanging-knee-raise','en','The knees are lifted with momentum.','Shorten the range and fully settle between repetitions.'),
  ('hanging-straight-leg-raise','de','Die Schultern ziehen hoch und der Körper pendelt.','Aktiven Hang neu aufbauen und die Wiederholung früher beenden.'),('hanging-straight-leg-raise','en','The shoulders shrug and the body swings.','Rebuild the active hang and finish the repetition earlier.'),
  ('hanging-pike','de','Die Endposition wird mit Schwung erzwungen.','Zur Hanging-Knee-Raise-Regression zurückkehren und den Bewegungsweg verkürzen.'),('hanging-pike','en','Momentum is used to force the end position.','Return to the hanging knee raise regression and shorten the range.'),
  ('hanging-oblique-knee-raise','de','Der ganze Körper pendelt seitlich.','Kniehub kleiner wählen und vor jedem Seitenwechsel zur Mitte zurückkehren.'),('hanging-oblique-knee-raise','en','The whole body swings sideways.','Use a smaller knee lift and return to centre before changing sides.'),
  ('battle-rope-waves','de','Die Wellen werden aus dem unteren Rücken gerissen.','Schrittstellung stabilisieren, Wellen kleiner machen und die Pause verlängern.'),('battle-rope-waves','en','The waves are driven by the lower back.','Stabilise the stance, reduce the wave size and extend the rest.')
) AS v(seed_key,locale,mistake,correction) ON e.seed_key=v.seed_key;

INSERT INTO exercise_obstacle_guidance (
  exercise_id,locale,equipment_configuration,prerequisites,approach,execution,exit_reset,
  fallback_exercise,station_capacity,clear_zone_metres
)
SELECT e.id,v.locale,v.equipment_configuration,v.prerequisites,v.approach,v.execution,v.exit_reset,
  v.fallback_exercise,1,2.0
FROM exercises e JOIN (VALUES
  ('battle-rope-waves','de','Sicher verankertes Seil mit markierter Wellen- und Rücklaufzone.','Schmerzfreier Stand, sicherer Griff und Stoppsignal bekannt.','Warte hinter der Linie, prüfe Seil, Anker und freie Zone.','Erzeuge abwechselnde Wellen mit stabilem Rumpf und ohne die Seilenden zu werfen.','Wellen stoppen, Seil kontrolliert ablegen und seitlich aus der Zone gehen.','Armwellen ohne Seil oder Band Pull-Apart im Stand.'),
  ('battle-rope-waves','en','Securely anchored rope with marked wave and return zones.','Pain-free stance, secure grip and known stop signal.','Wait behind the line and check the rope, anchor and clear zone.','Create alternating waves with a stable trunk and never throw the rope ends.','Stop the waves, lower the rope under control and exit the zone to the side.','Arm waves without a rope or standing band pull-apart.')
) AS v(seed_key,locale,equipment_configuration,prerequisites,approach,execution,exit_reset,fallback_exercise) ON e.seed_key=v.seed_key;

INSERT INTO search_documents_de (document_id,entity_type,entity_id,title,aliases,summary,tags,body_regions,equipment,instructions)
SELECT 'exercise:' || e.id::VARCHAR,'exercise',e.id::VARCHAR,t.name,
  COALESCE((SELECT string_agg(a.alias,' ') FROM exercise_aliases a WHERE a.exercise_id=e.id AND a.locale='de'),''),t.summary,
  COALESCE((SELECT string_agg(tag.tag_id,' ') FROM exercise_tags tag WHERE tag.exercise_id=e.id),''),
  COALESCE((SELECT string_agg(body.body_region_id,' ') FROM exercise_body_regions body WHERE body.exercise_id=e.id),''),
  COALESCE((SELECT string_agg(eq.seed_key,' ') FROM exercise_equipment x JOIN equipment eq ON eq.id=x.equipment_id WHERE x.exercise_id=e.id),''),
  COALESCE((SELECT string_agg(step.instruction,' ' ORDER BY step.step_order) FROM exercise_execution_steps step WHERE step.exercise_id=e.id AND step.locale='de'),'')
FROM exercises e JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='de'
WHERE e.seed_key IN ('hanging-knee-raise','hanging-straight-leg-raise','hanging-pike','hanging-oblique-knee-raise','battle-rope-waves');

INSERT INTO search_documents_en (document_id,entity_type,entity_id,title,aliases,summary,tags,body_regions,equipment,instructions)
SELECT 'exercise:' || e.id::VARCHAR,'exercise',e.id::VARCHAR,t.name,
  COALESCE((SELECT string_agg(a.alias,' ') FROM exercise_aliases a WHERE a.exercise_id=e.id AND a.locale='en'),''),t.summary,
  COALESCE((SELECT string_agg(tag.tag_id,' ') FROM exercise_tags tag WHERE tag.exercise_id=e.id),''),
  COALESCE((SELECT string_agg(body.body_region_id,' ') FROM exercise_body_regions body WHERE body.exercise_id=e.id),''),
  COALESCE((SELECT string_agg(eq.seed_key,' ') FROM exercise_equipment x JOIN equipment eq ON eq.id=x.equipment_id WHERE x.exercise_id=e.id),''),
  COALESCE((SELECT string_agg(step.instruction,' ' ORDER BY step.step_order) FROM exercise_execution_steps step WHERE step.exercise_id=e.id AND step.locale='en'),'')
FROM exercises e JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='en'
WHERE e.seed_key IN ('hanging-knee-raise','hanging-straight-leg-raise','hanging-pike','hanging-oblique-knee-raise','battle-rope-waves');

INSERT INTO exercise_seed_quality_reviews (exercise_id,review_version,review_status,notes)
SELECT e.id,'2026-09-ocr-hanging-rope-v1','passed','OCRCraft-original bilingual cohort; safety, progression, fallback and equipment fields reviewed with the seed batch.'
FROM exercises e
WHERE e.seed_key IN ('hanging-knee-raise','hanging-straight-leg-raise','hanging-pike','hanging-oblique-knee-raise','battle-rope-waves');

UPDATE search_index_state SET status='dirty',last_error=NULL WHERE locale IN ('de','en');
INSERT INTO schema_migrations (version,name) VALUES (78,'ocr_hanging_battle_rope_cohort');
COMMIT;
