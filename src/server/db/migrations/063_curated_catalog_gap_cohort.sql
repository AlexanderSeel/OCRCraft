BEGIN TRANSACTION;

-- Curated gap cohort: low-equipment exercises that close core-stability,
-- mobility and OCR-transition gaps without duplicating existing obstacle skills.
INSERT INTO exercises (
  seed_key,canonical_name,category,default_phase,risk_level,min_age,indoor,outdoor,
  exercise_type,difficulty,impact_level,coordination_complexity,progression_required,
  space_requirement,supports_reps,supports_seconds,supports_minutes,supports_metres,
  supports_rounds,supports_attempts,setup_seconds,transition_seconds,station_capacity,
  suitable_for_kids,suitable_for_youth,suitable_for_adults,supervision,
  indoor_suitable,outdoor_suitable,laterality,movement_plane
)
SELECT v.seed_key,v.name_en,v.category,v.default_phase,'low',v.min_age,true,true,
  v.exercise_type,'beginner',v.impact,v.coordination,false,
  'small',true,true,false,false,true,false,30,15,6,
  v.min_age <= 11,true,true,v.supervision,true,true,v.laterality,v.plane
FROM (VALUES
  ('dead-bug-heel-tap','Dead Bug mit Fersentipp','Dead Bug Heel Tap','core','main',8,'strength','low','moderate','normal','alternating','sagittal'),
  ('supported-side-plank-knee','Seitstütz auf dem Knie','Supported Knee Side Plank','core','main',10,'strength','low','moderate','normal','unilateral','frontal'),
  ('bear-plank-shoulder-tap','Bear Plank Shoulder Tap','Bear Plank Shoulder Tap','core','main',10,'strength','low','complex','normal','alternating','multiplanar'),
  ('hip-90-90-switch','90/90 Hüftwechsel','90/90 Hip Switch','mobility','warmup',8,'mobility','low','moderate','normal','alternating','transverse'),
  ('ankle-rocker-mobility','Sprunggelenk-Rocker','Ankle Rocker Mobility','mobility','warmup',6,'mobility','low','simple','normal','bilateral','sagittal'),
  ('thoracic-open-book','Open Book Brustwirbelsäule','Thoracic Open Book','mobility','cooldown',8,'mobility','low','simple','normal','unilateral','transverse'),
  ('lateral-shuffle-stick','Seitliches Shuffle mit Stopp','Lateral Shuffle and Stick','balance-agility','main',8,'skill','moderate','moderate','increased','locomotion','frontal'),
  ('crawl-to-stand-transition','Crawl-to-Stand Übergang','Crawl-to-Stand Transition','balance-agility','main',10,'skill','low','complex','increased','locomotion','multiplanar')
) AS v(seed_key,name_de,name_en,category,default_phase,min_age,exercise_type,impact,coordination,supervision,laterality,plane)
WHERE NOT EXISTS (SELECT 1 FROM exercises e WHERE e.seed_key=v.seed_key);

INSERT INTO exercise_translations (exercise_id,locale,name,summary)
SELECT e.id,v.locale,v.name,v.summary
FROM exercises e JOIN (VALUES
  ('dead-bug-heel-tap','de','Dead Bug mit Fersentipp','Stabilisiere den Rumpf in Rückenlage und tippe abwechselnd eine Ferse kontrolliert zum Boden.'),
  ('dead-bug-heel-tap','en','Dead Bug Heel Tap','Stabilise the trunk on your back and alternately tap one heel to the floor with control.'),
  ('supported-side-plank-knee','de','Seitstütz auf dem Knie','Halte eine verkürzte Seitstützposition auf Unterarm und Knie mit gerader Linie von Schulter bis Knie.'),
  ('supported-side-plank-knee','en','Supported Knee Side Plank','Hold a shortened side-plank position on forearm and knee with a straight line from shoulder to knee.'),
  ('bear-plank-shoulder-tap','de','Bear Plank Shoulder Tap','Halte die Knie knapp über dem Boden und tippe abwechselnd die gegenüberliegende Schulter an, ohne das Becken zu verdrehen.'),
  ('bear-plank-shoulder-tap','en','Bear Plank Shoulder Tap','Hover the knees just above the floor and alternate shoulder taps without rotating the pelvis.'),
  ('hip-90-90-switch','de','90/90 Hüftwechsel','Wechsle im Sitz kontrolliert zwischen zwei 90/90-Hüftpositionen und halte den Oberkörper ruhig.'),
  ('hip-90-90-switch','en','90/90 Hip Switch','Move with control between two seated 90/90 hip positions while keeping the trunk calm.'),
  ('ankle-rocker-mobility','de','Sprunggelenk-Rocker','Schiebe das Knie im Stand kontrolliert über den Fuß nach vorn, während die Ferse vollständig am Boden bleibt.'),
  ('ankle-rocker-mobility','en','Ankle Rocker Mobility','Drive the knee forward over the foot under control while keeping the heel fully grounded.'),
  ('thoracic-open-book','de','Open Book Brustwirbelsäule','Rotiere in Seitenlage den oberen Arm und Brustkorb langsam auf, ohne Becken und Knie auseinanderzuziehen.'),
  ('thoracic-open-book','en','Thoracic Open Book','Rotate the upper arm and chest open from side-lying without separating the pelvis and knees.'),
  ('lateral-shuffle-stick','de','Seitliches Shuffle mit Stopp','Bewege dich mit kurzen Seitwärtsschritten und stabilisiere nach dem Stoppsignal zwei Sekunden in einer athletischen Position.'),
  ('lateral-shuffle-stick','en','Lateral Shuffle and Stick','Move with short lateral steps and stabilise for two seconds in an athletic position after the stop cue.'),
  ('crawl-to-stand-transition','de','Crawl-to-Stand Übergang','Wechsle aus einer bodennahen Crawl-Position kontrolliert in einen stabilen Stand und wieder zurück.'),
  ('crawl-to-stand-transition','en','Crawl-to-Stand Transition','Move under control from a low crawl position into stable standing and back down again.')
) AS v(seed_key,locale,name,summary) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO exercise_aliases (exercise_id,locale,alias)
SELECT e.id,v.locale,v.alias
FROM exercises e JOIN (VALUES
  ('dead-bug-heel-tap','de','Dead Bug Fersenkontakt'),('dead-bug-heel-tap','de','Rumpfstabilität Rückenlage'),
  ('dead-bug-heel-tap','en','Dead bug heel reach'),('dead-bug-heel-tap','en','Supine core stability'),
  ('supported-side-plank-knee','de','Knie-Seitstütz'),('supported-side-plank-knee','de','Seitliche Rumpfstabilität'),
  ('supported-side-plank-knee','en','Knee side plank'),('supported-side-plank-knee','en','Lateral core stability'),
  ('bear-plank-shoulder-tap','de','Vierfüßler Shoulder Tap'),('bear-plank-shoulder-tap','de','Bear Plank Antirotation'),
  ('bear-plank-shoulder-tap','en','Bear position shoulder tap'),('bear-plank-shoulder-tap','en','Quadruped anti-rotation'),
  ('hip-90-90-switch','de','90-90 Hüftmobilität'),('hip-90-90-switch','de','Sitzender Hüftwechsel'),
  ('hip-90-90-switch','en','90-90 hip mobility'),('hip-90-90-switch','en','Seated hip switch'),
  ('ankle-rocker-mobility','de','Knie-zur-Wand Mobilisation'),('ankle-rocker-mobility','de','Dorsalflexions-Rocker'),
  ('ankle-rocker-mobility','en','Knee-to-wall mobility'),('ankle-rocker-mobility','en','Ankle dorsiflexion rocker'),
  ('thoracic-open-book','de','BWS Open Book'),('thoracic-open-book','de','Brustwirbelsäulenrotation'),
  ('thoracic-open-book','en','Open book rotation'),('thoracic-open-book','en','Thoracic rotation drill'),
  ('lateral-shuffle-stick','de','Seitwärtsschritte mit Freeze'),('lateral-shuffle-stick','de','Agility Stop Drill'),
  ('lateral-shuffle-stick','en','Lateral shuffle freeze'),('lateral-shuffle-stick','en','Agility stop drill'),
  ('crawl-to-stand-transition','de','Boden-Stand-Übergang'),('crawl-to-stand-transition','de','OCR Bodenübergang'),
  ('crawl-to-stand-transition','en','Ground-to-stand transition'),('crawl-to-stand-transition','en','OCR floor transition')
) AS v(seed_key,locale,alias) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO exercise_body_regions (exercise_id,body_region_id,emphasis)
SELECT e.id,v.region,v.emphasis FROM exercises e JOIN (VALUES
  ('dead-bug-heel-tap','core','primary'),('dead-bug-heel-tap','abs','primary'),('dead-bug-heel-tap','hips','secondary'),
  ('supported-side-plank-knee','obliques','primary'),('supported-side-plank-knee','core','primary'),('supported-side-plank-knee','shoulders','secondary'),
  ('bear-plank-shoulder-tap','core','primary'),('bear-plank-shoulder-tap','shoulders','primary'),('bear-plank-shoulder-tap','upper-arms','secondary'),
  ('hip-90-90-switch','hips','primary'),('hip-90-90-switch','glutes','secondary'),('hip-90-90-switch','adductors','secondary'),
  ('ankle-rocker-mobility','ankles-feet','primary'),('ankle-rocker-mobility','calves','secondary'),('ankle-rocker-mobility','tibialis','secondary'),
  ('thoracic-open-book','upper-back','primary'),('thoracic-open-book','shoulders','secondary'),('thoracic-open-book','obliques','secondary'),
  ('lateral-shuffle-stick','ankles-feet','primary'),('lateral-shuffle-stick','quadriceps','primary'),('lateral-shuffle-stick','glutes','secondary'),
  ('crawl-to-stand-transition','full-body','primary'),('crawl-to-stand-transition','core','secondary'),('crawl-to-stand-transition','hips','secondary')
) AS v(seed_key,region,emphasis) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO exercise_movement_patterns (exercise_id,movement_pattern_id)
SELECT e.id,v.pattern FROM exercises e JOIN (VALUES
  ('dead-bug-heel-tap','brace'),
  ('supported-side-plank-knee','brace'),('supported-side-plank-knee','balance'),
  ('bear-plank-shoulder-tap','brace'),('bear-plank-shoulder-tap','crawl'),
  ('hip-90-90-switch','mobility'),('hip-90-90-switch','rotate'),
  ('ankle-rocker-mobility','mobility'),
  ('thoracic-open-book','mobility'),('thoracic-open-book','rotate'),
  ('lateral-shuffle-stick','agility'),('lateral-shuffle-stick','balance'),
  ('crawl-to-stand-transition','crawl'),('crawl-to-stand-transition','squat'),('crawl-to-stand-transition','agility')
) AS v(seed_key,pattern) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO exercise_tags (exercise_id,tag_id)
SELECT e.id,v.tag_id FROM exercises e JOIN (VALUES
  ('dead-bug-heel-tap','core'),('dead-bug-heel-tap','low-impact'),
  ('supported-side-plank-knee','core'),('supported-side-plank-knee','low-impact'),
  ('bear-plank-shoulder-tap','core'),('bear-plank-shoulder-tap','coordination'),
  ('hip-90-90-switch','mobility'),('hip-90-90-switch','warmup'),
  ('ankle-rocker-mobility','mobility'),('ankle-rocker-mobility','warmup'),
  ('thoracic-open-book','mobility'),('thoracic-open-book','recovery'),
  ('lateral-shuffle-stick','agility'),('lateral-shuffle-stick','balance'),('lateral-shuffle-stick','coordination'),
  ('crawl-to-stand-transition','ocr'),('crawl-to-stand-transition','coordination'),('crawl-to-stand-transition','technique')
) AS v(seed_key,tag_id) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO exercise_training_phases (exercise_id,phase)
SELECT e.id,v.phase FROM exercises e JOIN (VALUES
  ('dead-bug-heel-tap','main'),
  ('supported-side-plank-knee','main'),
  ('bear-plank-shoulder-tap','main'),
  ('hip-90-90-switch','warmup'),('hip-90-90-switch','cooldown'),
  ('ankle-rocker-mobility','warmup'),('ankle-rocker-mobility','cooldown'),
  ('thoracic-open-book','warmup'),('thoracic-open-book','cooldown'),
  ('lateral-shuffle-stick','warmup'),('lateral-shuffle-stick','main'),
  ('crawl-to-stand-transition','warmup'),('crawl-to-stand-transition','main')
) AS v(seed_key,phase) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO exercise_training_goals (exercise_id,goal)
SELECT e.id,v.goal FROM exercises e JOIN (VALUES
  ('dead-bug-heel-tap','strength'),
  ('supported-side-plank-knee','strength'),
  ('bear-plank-shoulder-tap','strength'),('bear-plank-shoulder-tap','coordination'),
  ('hip-90-90-switch','mobility'),
  ('ankle-rocker-mobility','mobility'),
  ('thoracic-open-book','mobility'),('thoracic-open-book','recovery'),
  ('lateral-shuffle-stick','coordination'),('lateral-shuffle-stick','balance'),
  ('crawl-to-stand-transition','coordination'),('crawl-to-stand-transition','ocr_technique')
) AS v(seed_key,goal) ON e.seed_key=v.seed_key;

INSERT INTO exercise_details (
  exercise_id,locale,purpose,setup,start_position,finish_reset,breathing_cue,tempo_cue,safety_notes,
  quality_criteria,beginner_prescription,standard_prescription,advanced_prescription,work_rest_guidance,
  level_1,level_2,level_3,child_youth_variant,prerequisites,fallback_exercise,difficulty,supervision,
  space_requirement,setup_seconds,transition_seconds,station_capacity
)
SELECT e.id,v.locale,v.purpose,v.setup,v.start_position,v.finish_reset,v.breathing,v.tempo,v.safety,
  v.quality,v.beginner,v.standard,v.advanced,v.workrest,v.level1,v.level2,v.level3,v.youth,
  v.prereq,v.fallback,'beginner',e.supervision,'small',30,15,6
FROM exercises e JOIN (VALUES
  ('dead-bug-heel-tap','de','Schult Rumpfspannung und die Kontrolle von Becken und Lendenwirbelsäule bei wechselnder Beinbewegung.','Nutze eine ebene Matte mit freiem Raum für Arme und Beine.','Rückenlage, Hüfte und Knie etwa 90 Grad gebeugt; Rippen ruhig und Lendenbereich neutral am Boden.','Beide Beine zurück in die Ausgangsposition führen, kurz entspannen und neu ausrichten.','Ruhig ausatmen, während die Ferse sinkt; beim Zurückführen einatmen.','Langsam absenken, kurz tippen und ohne Schwung zurückführen.','Nur so tief tippen, dass Rücken und Becken stabil bleiben; bei Rückenschmerz Bewegungsweg verkürzen.','Becken bleibt ruhig, Atmung fließt und die Ferse berührt den Boden ohne dass der Rücken ausweicht.','2 x 5 Wechsel pro Seite','3 x 6–8 Wechsel pro Seite','3 x 10 pro Seite mit längerem Hebel','30–45 Sekunden Pause zwischen Sätzen.','Nur ein Bein wenige Zentimeter absenken.','Ferse bis zum Boden führen und stabil zurückkehren.','Bein weiter strecken, ohne die Rumpfposition zu verlieren.','Als langsames Links-Rechts-Spiel mit kurzen Wegen und klarer Atmung.','Schmerzfreie Rückenlage und kontrolliertes Anheben der Beine.','Marching in Rückenlage mit abwechselndem Fußheben.'),
  ('dead-bug-heel-tap','en','Builds trunk control and pelvic stability while the legs move alternately.','Use a level mat with clear space for arms and legs.','Lie on your back with hips and knees near 90 degrees; keep ribs quiet and the lower back neutral.','Return both legs to the start, relax briefly and reset.','Exhale as the heel lowers and inhale while returning.','Lower slowly, tap lightly and return without momentum.','Only lower as far as the pelvis and back remain stable; shorten the range for back discomfort.','Pelvis stays quiet, breathing continues and the heel reaches the floor without the back shifting.','2 x 5 alternations per side','3 x 6–8 alternations per side','3 x 10 per side with a longer lever','Rest 30–45 seconds between sets.','Lower one foot only a short distance.','Tap the heel to the floor and return with control.','Lengthen the leg without losing trunk position.','Use a slow left-right game with short ranges and clear breathing.','Pain-free supine position and controlled leg lifting.','Supine marching with alternating foot lifts.'),
  ('supported-side-plank-knee','de','Trainiert seitliche Rumpfstabilität und Schulterkontrolle mit verkürztem Hebel.','Lege eine Matte auf ebenen Boden und halte seitlich genügend Platz frei.','Seitlage auf Unterarm; unteres Knie gebeugt, Schulter über Ellbogen, oberes Bein lang oder ebenfalls gebeugt.','Becken langsam absetzen, Schulter lockern und erst dann die Seite wechseln.','Ruhig weiteratmen; während der Haltephase nicht pressen.','Becken kontrolliert anheben, Position halten und langsam absetzen.','Ellbogen bleibt unter der Schulter; bei Schulter-, Hüft- oder Rückenschmerz abbrechen.','Schulter, Becken und unteres Knie bilden eine stabile Linie ohne Wegsacken oder Verdrehen.','2 x 15 Sekunden pro Seite','3 x 20–30 Sekunden pro Seite','3 x 30–40 Sekunden mit gestrecktem oberen Bein','30–45 Sekunden Pause beim Seitenwechsel.','Becken nur kurz anheben und wieder absetzen.','Knie-Seitstütz stabil halten.','Oberes Bein strecken oder den Hebel verlängern.','Kurze Halte-Challenges mit viel Pause und ohne Zeitdruck.','Schmerzfreies Abstützen auf einem Unterarm.','Seitlage mit leichtem Beckendruck in die Matte.'),
  ('supported-side-plank-knee','en','Trains lateral trunk stability and shoulder control with a shortened lever.','Place a mat on level ground and keep enough clear space to the side.','Lie on one side on the forearm; lower knee bent, shoulder over elbow, upper leg long or bent.','Lower the pelvis slowly, relax the shoulder and only then change sides.','Keep breathing normally and do not brace with a held breath.','Lift the pelvis under control, hold, then lower slowly.','Keep the elbow under the shoulder; stop for shoulder, hip or back pain.','Shoulder, pelvis and lower knee form a stable line without sagging or rotation.','2 x 15 seconds each side','3 x 20–30 seconds each side','3 x 30–40 seconds with the upper leg straight','Rest 30–45 seconds when changing sides.','Lift the pelvis briefly and lower again.','Hold a stable knee side plank.','Straighten the upper leg or lengthen the lever.','Use short hold challenges with plenty of rest and no time pressure.','Pain-free support on one forearm.','Side-lying with gentle pelvic pressure into the mat.'),
  ('bear-plank-shoulder-tap','de','Verbindet Rumpfspannung, Schulterstabilität und diagonale Lastübertragung in einer bodennahen Position.','Nutze eine rutschfeste Matte mit freiem Bereich um Hände und Füße.','Vierfüßlerstand, Hände unter den Schultern, Knie unter der Hüfte; Knie knapp über dem Boden anheben.','Knie kontrolliert absetzen, Hände lösen und vor der nächsten Runde neu ausrichten.','Bei jedem Tap ruhig ausatmen und zwischen den Wechseln einatmen.','Kleine Gewichtsverlagerung, kurzer Tap, Hand sofort kontrolliert zurücksetzen.','Stoppe bei Handgelenk- oder Schulterschmerz; Kniehöhe niedrig halten und Beckenrotation vermeiden.','Becken bleibt nahezu parallel zum Boden und die Stützhand bleibt aktiv unter der Schulter.','2 x 4 Taps pro Seite mit kurzen Kniepausen','3 x 6–8 Taps pro Seite','3 x 10 Taps pro Seite mit schmalerer Fußstellung','45 Sekunden Pause zwischen Sätzen.','Knie am Boden lassen und nur eine Hand kurz lösen.','Knie schweben lassen und Schultern abwechselnd antippen.','Fußstellung etwas enger wählen, ohne Rotation zuzulassen.','Kurze 10-Sekunden-Runden mit Kniepausen und sauberem Wechsel.','Schmerzfreier Vierfüßlerstand und stabiler Handstütz.','Vierfüßler mit abwechselndem Handheben.'),
  ('bear-plank-shoulder-tap','en','Combines trunk control, shoulder stability and diagonal load transfer in a low ground position.','Use a non-slip mat with clear space around hands and feet.','Start on all fours with hands under shoulders and knees under hips; hover the knees just above the floor.','Lower the knees with control, release the hands and reset before the next round.','Exhale on each tap and inhale between alternations.','Shift weight slightly, make a brief tap and return the hand with control.','Stop for wrist or shoulder pain; keep the knees low and avoid pelvic rotation.','Pelvis stays nearly parallel to the floor and the support hand remains active under the shoulder.','2 x 4 taps per side with short knee resets','3 x 6–8 taps per side','3 x 10 taps per side with a narrower foot stance','Rest 45 seconds between sets.','Keep knees down and briefly lift one hand.','Hover the knees and alternate shoulder taps.','Narrow the foot stance slightly without allowing rotation.','Use short 10-second rounds with knee resets and clean alternation.','Pain-free quadruped position and stable hand support.','Quadruped alternating hand lifts.'),
  ('hip-90-90-switch','de','Verbessert kontrollierte Innen- und Außenrotation der Hüfte für tiefe Positionen, Crawls und Richtungswechsel.','Setze dich auf eine Matte und halte seitlich genug Platz für beide Knie frei.','Aufrechter Sitz mit beiden Knien gebeugt; Hände dürfen hinter dem Körper leicht stützen.','In einer symmetrischen Sitzposition anhalten und Beine für die nächste Seite neu ordnen.','Während des Wechsels ruhig ausatmen und in der Endposition einatmen.','Langsam rotieren, kurz in jeder Seite stabilisieren und keinen Schwung nutzen.','Bewegungsweg bei Knie- oder Hüftschmerz verkürzen; Knie niemals in die Endposition drücken.','Beide Sitzknochen bleiben möglichst kontrolliert und die Bewegung kommt aus der Hüfte statt aus erzwungenem Kniedruck.','2 x 4 Wechsel mit Handstütz','2–3 x 6–8 Wechsel','3 x 8–10 Wechsel mit weniger Handstütz','20–30 Sekunden Pause zwischen Sätzen.','Kleiner Winkelwechsel mit beiden Händen hinter dem Körper.','Kontrollierter 90/90-Wechsel mit leichter Handstütze.','Arme vor dem Körper halten und Endposition kurz aktiv stabilisieren.','Bewegungsweg klein halten und als langsames Seitenwechsel-Spiel ausführen.','Schmerzfreier Sitz mit gebeugten Knien.','Sitzende Hüftrotation mit kleinerem Bewegungsweg.'),
  ('hip-90-90-switch','en','Improves controlled hip internal and external rotation for low positions, crawls and direction changes.','Sit on a mat with enough clear space for both knees to move side to side.','Sit tall with both knees bent; hands may support lightly behind the body.','Pause in a balanced seated position and reset the legs for the next side.','Exhale during the switch and inhale in the end position.','Rotate slowly, stabilise briefly on each side and avoid momentum.','Shorten the range for knee or hip pain; never force the knees into the end position.','Both sitting bones stay as controlled as possible and motion comes from the hips rather than forced knee pressure.','2 x 4 switches with hand support','2–3 x 6–8 switches','3 x 8–10 switches with less hand support','Rest 20–30 seconds between sets.','Use a small angle change with both hands behind the body.','Use a controlled 90/90 switch with light hand support.','Hold the arms in front and actively stabilise the end position.','Keep the range small and use a slow side-to-side movement game.','Pain-free sitting with bent knees.','Seated hip rotation through a smaller range.'),
  ('ankle-rocker-mobility','de','Verbessert kontrollierte Dorsalflexion für Kniebeuge, Landung, Lauf und Hindernisübergänge.','Stelle dich vor eine Wand oder Markierung auf rutschfesten Boden.','Ein Fuß steht flach, Zehen zeigen nach vorn; das Knie ist weich und Ferse bleibt vollständig am Boden.','Knie zurückführen, Fußdruck neu verteilen und die Seite nach der Serie wechseln.','Ruhig ausatmen beim Vorführen des Knies und beim Zurückkehren einatmen.','Langsam vor und zurück bewegen, ohne am Endpunkt zu federn.','Ferse darf nicht abheben; bei Schmerzen im Sprunggelenk Bewegungsweg verkürzen.','Knie folgt über dem zweiten bis dritten Zeh und die Ferse bleibt während der gesamten Bewegung belastet.','2 x 6 pro Seite mit kleinem Weg','2–3 x 8–10 pro Seite','3 x 10 pro Seite mit kurzer Endhaltezeit','20–30 Sekunden Pause beim Seitenwechsel.','Fuß näher zur Wand und nur wenige Zentimeter bewegen.','Knie kontrolliert über den Fuß führen, Ferse bleibt unten.','Endposition zwei Sekunden halten oder Fuß etwas weiter zurücksetzen.','Kurzer Weg entlang einer Bodenmarkierung; keine erzwungene Reichweite.','Schmerzfreier Stand und belastbare Ferse.','Gewichtsverlagerung im Stand ohne große Kniebewegung.'),
  ('ankle-rocker-mobility','en','Improves controlled dorsiflexion for squatting, landing, running and obstacle transitions.','Stand facing a wall or marker on non-slip flooring.','Keep one foot flat with toes forward, knee soft and heel fully grounded.','Bring the knee back, reset foot pressure and change sides after the set.','Exhale as the knee moves forward and inhale while returning.','Move slowly forward and back without bouncing at end range.','The heel must stay down; shorten the range for ankle pain.','The knee tracks over the second to third toe and the heel remains loaded throughout.','2 x 6 each side with a short range','2–3 x 8–10 each side','3 x 10 each side with a brief end-range hold','Rest 20–30 seconds when changing sides.','Stand closer to the wall and use only a few centimetres of motion.','Drive the knee over the foot while the heel stays down.','Hold the end position for two seconds or move the foot slightly farther back.','Use a short range along a floor marker with no forced reach.','Pain-free standing and comfortable heel loading.','Standing weight shift without a large knee excursion.'),
  ('thoracic-open-book','de','Mobilisiert die Brustwirbelsäulenrotation bei stabiler Beckenposition und ruhiger Atmung.','Lege dich seitlich auf eine Matte; Knie bequem beugen und übereinander halten.','Arme vor dem Brustkorb gestreckt, Handflächen aufeinander; Kopf neutral ablegen.','Oberen Arm wieder nach vorn führen, Hände zusammenbringen und erst dann die Seite wechseln.','Beim Öffnen langsam ausatmen, beim Schließen einatmen.','Arm und Brustkorb gleichmäßig öffnen, kurz halten und kontrolliert zurückkehren.','Knie bleiben zusammen; Rotation nicht durch Zug am Arm erzwingen und bei Schulter- oder Rückenschmerz verkürzen.','Becken bleibt gestapelt, Atmung bleibt ruhig und Brustkorb rotiert ohne ruckartige Bewegung.','1–2 x 5 pro Seite mit kleinem Winkel','2 x 6–8 pro Seite','2 x 8–10 pro Seite mit zwei Sekunden Endhaltezeit','15–30 Sekunden Pause beim Seitenwechsel.','Oberen Arm nur bis zur Decke öffnen.','Arm und Brustkorb in schmerzfreiem Bereich weit öffnen.','Endposition kurz halten und bewusst vollständig ausatmen.','Langsame Flügelbewegung mit kleinem Winkel und ohne Dehnzwang.','Schmerzfreie Seitenlage.','Seitlage mit kleinen Schulterkreisen.'),
  ('thoracic-open-book','en','Mobilises thoracic rotation while the pelvis stays stable and breathing remains calm.','Lie on one side on a mat with knees comfortably bent and stacked.','Reach both arms in front of the chest with palms together and head supported neutrally.','Return the top arm forward, bring the hands together and only then change sides.','Exhale slowly while opening and inhale while closing.','Open the arm and chest evenly, pause briefly and return with control.','Keep the knees together; do not force rotation by pulling the arm and shorten the range for shoulder or back pain.','Pelvis stays stacked, breathing stays calm and the chest rotates without jerking.','1–2 x 5 each side through a short range','2 x 6–8 each side','2 x 8–10 each side with a two-second end hold','Rest 15–30 seconds when changing sides.','Open the upper arm only toward the ceiling.','Open arm and chest through a comfortable pain-free range.','Pause at end range and complete a deliberate exhale.','Use a slow wing-like motion with a short range and no forced stretch.','Pain-free side-lying.','Small shoulder circles in side-lying.'),
  ('lateral-shuffle-stick','de','Schult seitliche Beschleunigung, kontrolliertes Abbremsen und stabile Fuß-/Kniepositionen für Richtungswechsel.','Markiere eine freie, ebene Spur von drei bis fünf Metern mit klarer Stopplinie.','Athletischer Stand, Knie weich, Füße parallel und Blick in Bewegungsrichtung.','Nach dem Stopp zwei Sekunden stabil bleiben, dann langsam zur Mitte zurückgehen.','Während der Schritte gleichmäßig atmen; beim Abbremsen ausatmen.','Kurze kontrollierte Schritte, kein Kreuzen der Füße; vor der Linie frühzeitig abbremsen.','Nur auf trockenem, freiem Boden; Abstand zwischen Personen halten und keine maximalen Sprints verlangen.','Nach dem Stoppsignal bleiben Knie über den Füßen, Oberkörper kontrolliert und beide Füße sicher belastet.','3 x 2 kurze Wege mit Gehtempo','4 x 3–5 m bei moderatem Tempo','5 x 5 m mit zufälligem, aber angekündigtem Stoppsignal','45–60 Sekunden Pause zwischen Runden.','Seitwärts gehen und an jeder Markierung zwei Sekunden stehen.','Kurzes Shuffle und kontrollierter Zwei-Sekunden-Stopp.','Etwas schneller shufflen oder Richtungswechsel auf ein klares Signal.','Kurze Distanzen, sichtbare Linien und Erfolg über stabile Stopps statt Geschwindigkeit.','Sicheres Seitwärtsgehen und Stoppen ohne Gleichgewichtsverlust.','Seitwärtsschritte zwischen zwei Markierungen.'),
  ('lateral-shuffle-stick','en','Trains lateral acceleration, controlled deceleration and stable foot and knee positions for direction changes.','Mark a clear level lane of three to five metres with an obvious stop line.','Use an athletic stance with soft knees, parallel feet and eyes toward the movement direction.','Hold the stop for two seconds, then walk calmly back toward the centre.','Breathe evenly during the steps and exhale while decelerating.','Use short controlled steps without crossing the feet; start slowing before the line.','Use only a dry clear surface, keep spacing between athletes and do not demand maximal sprints.','After the stop cue the knees track over the feet, the trunk stays controlled and both feet are securely loaded.','3 x 2 short lanes at walking pace','4 x 3–5 m at moderate pace','5 x 5 m with a random but clearly called stop cue','Rest 45–60 seconds between rounds.','Side-step and hold for two seconds at each marker.','Use a short shuffle and controlled two-second stop.','Shuffle slightly faster or change direction on a clear cue.','Use short distances, visible lines and reward stable stops rather than speed.','Able to side-step and stop safely without losing balance.','Side steps between two markers.'),
  ('crawl-to-stand-transition','de','Übt den sicheren Wechsel zwischen bodennaher Fortbewegung und aufrechtem Stand als OCR-relevante Übergangskompetenz.','Nutze eine Matte oder trockene ebene Fläche mit mindestens zwei Metern freiem Raum.','Starte im stabilen Vierfüßler oder Bear Crawl mit Blick auf die freie Bewegungsrichtung.','Nach dem Aufstehen zwei Sekunden stabilisieren, dann über Kniebeuge oder Ausfallschritt kontrolliert zurück zum Boden.','Beim Aufstehen ausatmen und beim Absenken ruhig einatmen.','Übergang in klaren Teilschritten; kein Hochspringen aus der Bodenposition.','Hände nur auf sicheren Boden setzen; bei Schwindel langsam aufrichten und bei Knie-/Handgelenkschmerz vereinfachen.','Hände und Füße werden kontrolliert gesetzt, der Stand endet stabil und der Rückweg zum Boden bleibt leise.','2 x 3 Übergänge pro Seite mit zusätzlichem Kniekontakt','3 x 4–6 kontrollierte Übergänge','3 x 6 Übergänge mit anschließend zwei ruhigen Schritten','45 Sekunden Pause; Qualität und Orientierung gehen vor Tempo.','Aus dem Kniestand über einen Fuß in den Stand wechseln.','Aus Bear/Crawl-Position einen Fuß vorbringen und kontrolliert aufstehen.','Nach dem Aufstehen zwei Schritte gehen und in die Bodenposition zurückkehren.','Kniestand-zu-Stand als spielerischen Wechsel mit klarer Stoppmarke nutzen.','Sicherer Vierfüßlerstand und schmerzfreies Aufstehen vom Boden.','Vom Halbkniestand mit Handstütze aufstehen.'),
  ('crawl-to-stand-transition','en','Practises a safe change between low ground locomotion and upright standing as an OCR-relevant transition skill.','Use a mat or dry level area with at least two metres of clear space.','Start in a stable quadruped or bear-crawl position and look toward the clear movement path.','After standing, stabilise for two seconds, then return to the floor through a squat or lunge under control.','Exhale while standing and inhale calmly while lowering.','Use clear transition steps and do not jump up from the floor position.','Place hands only on safe ground; rise slowly if dizzy and simplify for knee or wrist pain.','Hands and feet are placed with control, standing ends stable and the return to the floor stays quiet.','2 x 3 transitions per side with an extra knee contact','3 x 4–6 controlled transitions','3 x 6 transitions followed by two calm walking steps','Rest 45 seconds; quality and orientation come before speed.','Move from kneeling to standing by stepping one foot forward.','From bear/crawl position step one foot forward and stand with control.','After standing take two steps, then return to the floor position.','Use kneeling-to-standing as a movement game with a clear stop marker.','Stable quadruped position and pain-free rising from the floor.','Stand from half-kneeling with hand support.')
) AS v(seed_key,locale,purpose,setup,start_position,finish_reset,breathing,tempo,safety,quality,beginner,standard,advanced,workrest,level1,level2,level3,youth,prereq,fallback)
ON e.seed_key=v.seed_key;

INSERT INTO exercise_execution_steps (exercise_id,locale,step_order,instruction)
SELECT e.id,v.locale,v.step_order,v.instruction
FROM exercises e JOIN (VALUES
  ('dead-bug-heel-tap','de',1,'Richte Rückenlage und 90-Grad-Beinposition ein.'),('dead-bug-heel-tap','de',2,'Senke eine Ferse langsam zum Boden, ohne das Becken zu bewegen.'),('dead-bug-heel-tap','de',3,'Führe das Bein zurück und wechsle kontrolliert die Seite.'),
  ('dead-bug-heel-tap','en',1,'Set the supine position with hips and knees near 90 degrees.'),('dead-bug-heel-tap','en',2,'Lower one heel slowly without moving the pelvis.'),('dead-bug-heel-tap','en',3,'Return the leg and alternate sides with control.'),
  ('supported-side-plank-knee','de',1,'Setze den Unterarm unter die Schulter und beuge das untere Knie.'),('supported-side-plank-knee','de',2,'Hebe das Becken bis Schulter, Hüfte und Knie eine Linie bilden.'),('supported-side-plank-knee','de',3,'Halte kurz und senke das Becken kontrolliert ab.'),
  ('supported-side-plank-knee','en',1,'Place the forearm under the shoulder and bend the lower knee.'),('supported-side-plank-knee','en',2,'Lift the pelvis until shoulder, hip and knee form a line.'),('supported-side-plank-knee','en',3,'Hold briefly and lower the pelvis with control.'),
  ('bear-plank-shoulder-tap','de',1,'Richte Hände unter Schultern und Knie unter der Hüfte aus.'),('bear-plank-shoulder-tap','de',2,'Hebe die Knie knapp an und verlagere das Gewicht minimal.'),('bear-plank-shoulder-tap','de',3,'Tippe die gegenüberliegende Schulter an und wechsle ohne Beckenrotation.'),
  ('bear-plank-shoulder-tap','en',1,'Set hands under shoulders and knees under hips.'),('bear-plank-shoulder-tap','en',2,'Hover the knees and shift weight only slightly.'),('bear-plank-shoulder-tap','en',3,'Tap the opposite shoulder and alternate without pelvic rotation.'),
  ('hip-90-90-switch','de',1,'Setze dich aufrecht mit gebeugten Knien und leichter Handstütze.'),('hip-90-90-switch','de',2,'Führe beide Knie langsam gemeinsam zur anderen Seite.'),('hip-90-90-switch','de',3,'Stabilisiere die neue 90/90-Position und wechsle zurück.'),
  ('hip-90-90-switch','en',1,'Sit tall with bent knees and light hand support.'),('hip-90-90-switch','en',2,'Move both knees slowly together toward the other side.'),('hip-90-90-switch','en',3,'Stabilise the new 90/90 position and switch back.'),
  ('ankle-rocker-mobility','de',1,'Stelle den Fuß flach und richte Knie und Zehen nach vorn.'),('ankle-rocker-mobility','de',2,'Führe das Knie kontrolliert nach vorn, ohne die Ferse anzuheben.'),('ankle-rocker-mobility','de',3,'Kehre zurück und wiederhole denselben schmerzfreien Bewegungsweg.'),
  ('ankle-rocker-mobility','en',1,'Place the foot flat with knee and toes facing forward.'),('ankle-rocker-mobility','en',2,'Drive the knee forward under control without lifting the heel.'),('ankle-rocker-mobility','en',3,'Return and repeat the same pain-free range.'),
  ('thoracic-open-book','de',1,'Lege dich seitlich mit gestapelten Knien und Armen nach vorn.'),('thoracic-open-book','de',2,'Öffne den oberen Arm und Brustkorb langsam nach hinten.'),('thoracic-open-book','de',3,'Führe Arm und Brustkorb kontrolliert zurück und wiederhole.'),
  ('thoracic-open-book','en',1,'Lie on your side with knees stacked and arms reaching forward.'),('thoracic-open-book','en',2,'Open the top arm and chest slowly behind you.'),('thoracic-open-book','en',3,'Return arm and chest with control and repeat.'),
  ('lateral-shuffle-stick','de',1,'Starte athletisch hinter der Seitenlinie und prüfe die freie Spur.'),('lateral-shuffle-stick','de',2,'Shuffle mit kurzen Schritten seitwärts, ohne die Füße zu kreuzen.'),('lateral-shuffle-stick','de',3,'Bremse vor der Linie ab und halte zwei Sekunden stabil.'),
  ('lateral-shuffle-stick','en',1,'Start in an athletic position behind the side line and check the clear lane.'),('lateral-shuffle-stick','en',2,'Shuffle laterally with short steps without crossing the feet.'),('lateral-shuffle-stick','en',3,'Decelerate before the line and hold a stable stop for two seconds.'),
  ('crawl-to-stand-transition','de',1,'Starte stabil im Vierfüßler oder einer niedrigen Crawl-Position.'),('crawl-to-stand-transition','de',2,'Setze einen Fuß nach vorn und verlagere das Gewicht kontrolliert über die Beine.'),('crawl-to-stand-transition','de',3,'Richte dich stabil auf und kehre in umgekehrter Reihenfolge zum Boden zurück.'),
  ('crawl-to-stand-transition','en',1,'Start stable in quadruped or a low crawl position.'),('crawl-to-stand-transition','en',2,'Step one foot forward and shift weight under control onto the legs.'),('crawl-to-stand-transition','en',3,'Stand up stably and reverse the sequence to return to the floor.')
) AS v(seed_key,locale,step_order,instruction) ON e.seed_key=v.seed_key;

INSERT INTO exercise_coaching_cues (exercise_id,locale,cue_order,cue)
SELECT e.id,v.locale,v.cue_order,v.cue
FROM exercises e JOIN (VALUES
  ('dead-bug-heel-tap','de',1,'Rippen ruhig halten'),('dead-bug-heel-tap','de',2,'Ferse leise tippen'),('dead-bug-heel-tap','en',1,'Keep the ribs quiet'),('dead-bug-heel-tap','en',2,'Tap the heel softly'),
  ('supported-side-plank-knee','de',1,'Ellbogen unter Schulter'),('supported-side-plank-knee','de',2,'Becken bleibt hoch'),('supported-side-plank-knee','en',1,'Elbow under shoulder'),('supported-side-plank-knee','en',2,'Keep the pelvis lifted'),
  ('bear-plank-shoulder-tap','de',1,'Knie knapp über Boden'),('bear-plank-shoulder-tap','de',2,'Becken bleibt ruhig'),('bear-plank-shoulder-tap','en',1,'Hover the knees low'),('bear-plank-shoulder-tap','en',2,'Keep the pelvis quiet'),
  ('hip-90-90-switch','de',1,'Aus der Hüfte rotieren'),('hip-90-90-switch','de',2,'Kein Kniedruck'),('hip-90-90-switch','en',1,'Rotate from the hips'),('hip-90-90-switch','en',2,'Do not force the knees'),
  ('ankle-rocker-mobility','de',1,'Ferse bleibt schwer'),('ankle-rocker-mobility','de',2,'Knie folgt den Zehen'),('ankle-rocker-mobility','en',1,'Keep the heel heavy'),('ankle-rocker-mobility','en',2,'Track the knee over the toes'),
  ('thoracic-open-book','de',1,'Knie bleiben zusammen'),('thoracic-open-book','de',2,'Mit der Ausatmung öffnen'),('thoracic-open-book','en',1,'Keep the knees together'),('thoracic-open-book','en',2,'Open with the exhale'),
  ('lateral-shuffle-stick','de',1,'Füße nicht kreuzen'),('lateral-shuffle-stick','de',2,'Stopp vor Tempo'),('lateral-shuffle-stick','en',1,'Do not cross the feet'),('lateral-shuffle-stick','en',2,'Own the stop before speed'),
  ('crawl-to-stand-transition','de',1,'Boden ruhig verlassen'),('crawl-to-stand-transition','de',2,'Stand stabil abschließen'),('crawl-to-stand-transition','en',1,'Leave the floor smoothly'),('crawl-to-stand-transition','en',2,'Finish in a stable stand')
) AS v(seed_key,locale,cue_order,cue) ON e.seed_key=v.seed_key;

INSERT INTO exercise_common_mistakes (exercise_id,locale,mistake_order,mistake,correction)
SELECT e.id,v.locale,1,v.mistake,v.correction
FROM exercises e JOIN (VALUES
  ('dead-bug-heel-tap','de','Der Rücken hebt beim Absenken sichtbar ab.','Bewegungsweg verkürzen und zuerst die Ausatmung stabilisieren.'),('dead-bug-heel-tap','en','The lower back visibly lifts as the heel lowers.','Shorten the range and stabilise the exhale first.'),
  ('supported-side-plank-knee','de','Die Schulter sackt zum Ohr oder Becken kippt nach hinten.','Ellbogen neu ausrichten, Becken etwas tiefer und Position erneut aufbauen.'),('supported-side-plank-knee','en','The shoulder shrugs or the pelvis rolls backward.','Reset the elbow, lower the pelvis slightly and rebuild the position.'),
  ('bear-plank-shoulder-tap','de','Das Becken dreht bei jedem Tap deutlich mit.','Füße breiter stellen oder Knie absetzen und kleinere Gewichtswechsel üben.'),('bear-plank-shoulder-tap','en','The pelvis rotates noticeably on every tap.','Widen the feet or lower the knees and practise smaller weight shifts.'),
  ('hip-90-90-switch','de','Die Knie werden mit Schwung in die Endposition gedrückt.','Tempo reduzieren, Hände stärker nutzen und den Bewegungsweg verkürzen.'),('hip-90-90-switch','en','The knees are forced into end range with momentum.','Slow down, use more hand support and shorten the range.'),
  ('ankle-rocker-mobility','de','Die Ferse hebt ab oder das Knie fällt nach innen.','Fuß näher setzen und Knie über dem zweiten bis dritten Zeh führen.'),('ankle-rocker-mobility','en','The heel lifts or the knee collapses inward.','Move the foot closer and track the knee over the second to third toe.'),
  ('thoracic-open-book','de','Das obere Knie hebt ab und das Becken rollt mit.','Bewegungsweg des Arms verkürzen und die Knie bewusst stapeln.'),('thoracic-open-book','en','The top knee lifts and the pelvis rolls with the arm.','Shorten the arm range and deliberately keep the knees stacked.'),
  ('lateral-shuffle-stick','de','Die Füße kreuzen oder der Stopp endet auf einem instabilen Bein.','Tempo reduzieren, Schritte verkürzen und den Stopp früher vorbereiten.'),('lateral-shuffle-stick','en','The feet cross or the stop finishes on an unstable leg.','Reduce speed, shorten the steps and prepare the stop earlier.'),
  ('crawl-to-stand-transition','de','Aus der Bodenposition wird hektisch hochgesprungen.','Übergang in Fußsetzen, Gewichtsverlagerung und Aufrichten zerlegen.'),('crawl-to-stand-transition','en','The athlete jumps up hurriedly from the floor.','Break the transition into foot placement, weight shift and standing.')
) AS v(seed_key,locale,mistake,correction) ON e.seed_key=v.seed_key;

INSERT INTO search_documents_de (document_id,entity_type,entity_id,title,aliases,summary,tags,body_regions,equipment,instructions)
SELECT 'exercise:' || e.id::VARCHAR,'exercise',e.id::VARCHAR,t.name,
  COALESCE((SELECT string_agg(a.alias,' ') FROM exercise_aliases a WHERE a.exercise_id=e.id AND a.locale='de'),''),
  COALESCE(t.summary,''),
  COALESCE((SELECT string_agg(tag.tag_id,' ') FROM exercise_tags tag WHERE tag.exercise_id=e.id),''),
  COALESCE((SELECT string_agg(body.body_region_id,' ') FROM exercise_body_regions body WHERE body.exercise_id=e.id),''),
  '',
  d.purpose || ' ' || d.setup || ' ' || d.start_position || ' ' || d.safety_notes || ' ' || d.quality_criteria || ' ' ||
    COALESCE((SELECT string_agg(step.instruction,' ' ORDER BY step.step_order) FROM exercise_execution_steps step WHERE step.exercise_id=e.id AND step.locale='de'),'')
FROM exercises e JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='de'
JOIN exercise_details d ON d.exercise_id=e.id AND d.locale='de'
WHERE e.seed_key IN (
  'dead-bug-heel-tap','supported-side-plank-knee','bear-plank-shoulder-tap','hip-90-90-switch',
  'ankle-rocker-mobility','thoracic-open-book','lateral-shuffle-stick','crawl-to-stand-transition'
);

INSERT INTO search_documents_en (document_id,entity_type,entity_id,title,aliases,summary,tags,body_regions,equipment,instructions)
SELECT 'exercise:' || e.id::VARCHAR,'exercise',e.id::VARCHAR,t.name,
  COALESCE((SELECT string_agg(a.alias,' ') FROM exercise_aliases a WHERE a.exercise_id=e.id AND a.locale='en'),''),
  COALESCE(t.summary,''),
  COALESCE((SELECT string_agg(tag.tag_id,' ') FROM exercise_tags tag WHERE tag.exercise_id=e.id),''),
  COALESCE((SELECT string_agg(body.body_region_id,' ') FROM exercise_body_regions body WHERE body.exercise_id=e.id),''),
  '',
  d.purpose || ' ' || d.setup || ' ' || d.start_position || ' ' || d.safety_notes || ' ' || d.quality_criteria || ' ' ||
    COALESCE((SELECT string_agg(step.instruction,' ' ORDER BY step.step_order) FROM exercise_execution_steps step WHERE step.exercise_id=e.id AND step.locale='en'),'')
FROM exercises e JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='en'
JOIN exercise_details d ON d.exercise_id=e.id AND d.locale='en'
WHERE e.seed_key IN (
  'dead-bug-heel-tap','supported-side-plank-knee','bear-plank-shoulder-tap','hip-90-90-switch',
  'ankle-rocker-mobility','thoracic-open-book','lateral-shuffle-stick','crawl-to-stand-transition'
);

UPDATE search_index_state SET status='dirty',last_error=NULL WHERE locale IN ('de','en');

INSERT INTO schema_migrations (version,name) VALUES (63,'curated_catalog_gap_cohort');
COMMIT;
