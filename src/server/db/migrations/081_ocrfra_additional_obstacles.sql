BEGIN TRANSACTION;

-- Additional OCRFRA inventory variants. These are OCRCraft-original training records;
-- dimensions, capacity and local release remain club-controlled fields.
INSERT INTO exercises (
  seed_key,canonical_name,category,default_phase,risk_level,min_age,indoor,outdoor,
  exercise_type,difficulty,impact_level,coordination_complexity,progression_required,
  space_requirement,supports_reps,supports_seconds,supports_minutes,supports_metres,
  supports_rounds,supports_attempts,setup_seconds,transition_seconds,station_capacity,
  suitable_for_kids,suitable_for_youth,suitable_for_adults,supervision,
  indoor_suitable,outdoor_suitable,laterality,movement_plane
)
SELECT v.seed_key,v.name_en,'ocr-skill','main',v.risk,v.min_age,true,true,'obstacle',v.difficulty,
  v.impact,'complex',true,v.space,true,true,false,false,true,true,180,45,1,
  false,v.min_age<=16,true,v.supervision,true,true,'locomotion','multiplanar'
FROM (VALUES
  ('club-olympus','Olympus – OCRFRA','high',16,'advanced','high','direct','rig-area'),
  ('club-escaladierwand','Eskaladierwand – OCRFRA','high',14,'advanced','high','direct','rig-area'),
  ('club-inverse-wall','Inverse Wand – OCRFRA','high',16,'advanced','high','direct','rig-area'),
  ('club-balance-beam','Balancebalken – OCRFRA','medium',10,'intermediate','low','increased','balance-area'),
  ('club-slackline','Slackline – OCRFRA','medium',10,'intermediate','low','increased','balance-area'),
  ('club-anchor-chain-drag','Ankerketten ziehen – OCRFRA','high',16,'advanced','moderate','direct','carry-lane'),
  ('club-atlas-stone-carry','Atlassteine tragen – OCRFRA','high',16,'advanced','high','direct','carry-lane')
) AS v(seed_key,name_en,risk,min_age,difficulty,impact,supervision,space)
WHERE NOT EXISTS (SELECT 1 FROM exercises e WHERE e.seed_key=v.seed_key);

INSERT INTO exercise_translations (exercise_id,locale,name,summary)
SELECT e.id,v.locale,v.name,v.summary
FROM exercises e JOIN (VALUES
  ('club-olympus','de','Olympus – OCRFRA','Übe kontrollierte Griff-, Zug- und Trittwechsel an einer freigegebenen Olympus-Variante.'),
  ('club-olympus','en','Olympus – OCRFRA','Practise controlled grip, pull and foothold transfers on an approved Olympus variation.'),
  ('club-escaladierwand','de','Eskaladierwand – OCRFRA','Überwinde die freigegebene Eskaladierwand mit vorbereiteten Kontaktpunkten und sicherem Abstieg.'),
  ('club-escaladierwand','en','Scaling Wall – OCRFRA','Negotiate the approved scaling wall using prepared contact points and a controlled dismount.'),
  ('club-inverse-wall','de','Inverse Wand – OCRFRA','Übe die umgekehrte Wandpassage mit klarer Einstieg-, Ausstieg- und Fallschutzregel.'),
  ('club-inverse-wall','en','Inverse Wall – OCRFRA','Practise the inverse wall passage with clear entry, exit and fall-protection rules.'),
  ('club-balance-beam','de','Balancebalken – OCRFRA','Gehe kontrolliert über den freigegebenen Balancebalken und verlasse ihn seitlich.'),
  ('club-balance-beam','en','Balance Beam – OCRFRA','Walk the approved balance beam under control and exit to the side.'),
  ('club-slackline','de','Slackline – OCRFRA','Trainiere Gleichgewicht und ruhige Gewichtsverlagerung auf einer freigegebenen Slackline.'),
  ('club-slackline','en','Slackline – OCRFRA','Train balance and calm weight transfer on an approved slackline.'),
  ('club-anchor-chain-drag','de','Ankerketten ziehen – OCRFRA','Ziehe eine freigegebene Ankerkette mit stabiler Körperposition und klarer Zugbahn.'),
  ('club-anchor-chain-drag','en','Anchor Chain Drag – OCRFRA','Drag an approved anchor chain with a stable body position and a clear pulling lane.'),
  ('club-atlas-stone-carry','de','Atlassteine tragen – OCRFRA','Hebe und trage einen freigegebenen Atlasstein mit sicherer Hebe- und Ablagezone.'),
  ('club-atlas-stone-carry','en','Atlas Stone Carry – OCRFRA','Lift and carry an approved atlas stone with a safe lifting and set-down zone.')
) AS v(seed_key,locale,name,summary) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO exercise_aliases (exercise_id,locale,alias)
SELECT e.id,v.locale,v.alias FROM exercises e JOIN (VALUES
  ('club-olympus','de','Olympus'),('club-olympus','en','Olympus obstacle'),
  ('club-escaladierwand','de','Kletterwand'),('club-escaladierwand','en','Scaling wall'),
  ('club-inverse-wall','de','Inverse Wand'),('club-inverse-wall','en','Inverse wall'),
  ('club-balance-beam','de','Balancierbalken'),('club-balance-beam','en','Balance beam'),
  ('club-slackline','de','Slackline'),('club-slackline','en','Slackline'),
  ('club-anchor-chain-drag','de','Ankerkette'),('club-anchor-chain-drag','en','Anchor chain'),
  ('club-atlas-stone-carry','de','Atlasstein'),('club-atlas-stone-carry','en','Atlas stone'),
  ('club-olympus','de','OCR Hindernistechnik'),('club-olympus','en','OCR obstacle technique'),
  ('club-escaladierwand','de','OCR Hindernistechnik'),('club-escaladierwand','en','OCR obstacle technique'),
  ('club-inverse-wall','de','OCR Hindernistechnik'),('club-inverse-wall','en','OCR obstacle technique'),
  ('club-balance-beam','de','OCR Hindernistechnik'),('club-balance-beam','en','OCR obstacle technique'),
  ('club-slackline','de','OCR Hindernistechnik'),('club-slackline','en','OCR obstacle technique'),
  ('club-anchor-chain-drag','de','OCR Hindernistechnik'),('club-anchor-chain-drag','en','OCR obstacle technique'),
  ('club-atlas-stone-carry','de','OCR Hindernistechnik'),('club-atlas-stone-carry','en','OCR obstacle technique')
) AS v(seed_key,locale,alias) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO exercise_body_regions (exercise_id,body_region_id,emphasis)
SELECT e.id,v.region,v.emphasis FROM exercises e JOIN (VALUES
  ('club-olympus','forearms-grip','primary'),('club-olympus','shoulders','primary'),('club-olympus','core','secondary'),
  ('club-escaladierwand','full-body','primary'),('club-escaladierwand','shoulders','secondary'),('club-escaladierwand','quadriceps','secondary'),
  ('club-inverse-wall','full-body','primary'),('club-inverse-wall','shoulders','primary'),('club-inverse-wall','core','secondary'),
  ('club-balance-beam','ankles-feet','primary'),('club-balance-beam','quadriceps','secondary'),('club-balance-beam','core','secondary'),
  ('club-slackline','ankles-feet','primary'),('club-slackline','core','secondary'),('club-slackline','quadriceps','secondary'),
  ('club-anchor-chain-drag','full-body','primary'),('club-anchor-chain-drag','upper-back','secondary'),('club-anchor-chain-drag','quadriceps','secondary'),
  ('club-atlas-stone-carry','full-body','primary'),('club-atlas-stone-carry','upper-back','secondary'),('club-atlas-stone-carry','quadriceps','secondary')
) AS v(seed_key,region,emphasis) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO exercise_movement_patterns (exercise_id,movement_pattern_id)
SELECT e.id,v.pattern FROM exercises e JOIN (VALUES
  ('club-olympus','hang'),('club-olympus','pull'),('club-olympus','climb'),
  ('club-escaladierwand','climb'),('club-escaladierwand','brace'),('club-escaladierwand','land'),
  ('club-inverse-wall','climb'),('club-inverse-wall','pull'),('club-inverse-wall','land'),
  ('club-balance-beam','balance'),('club-balance-beam','walk'),
  ('club-slackline','balance'),('club-slackline','walk'),
  ('club-anchor-chain-drag','drag'),('club-anchor-chain-drag','hinge'),('club-anchor-chain-drag','brace'),
  ('club-atlas-stone-carry','carry'),('club-atlas-stone-carry','hinge'),('club-atlas-stone-carry','brace')
) AS v(seed_key,pattern) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO exercise_tags (exercise_id,tag_id)
SELECT e.id,v.tag FROM exercises e JOIN (VALUES
  ('club-olympus','ocr'),('club-escaladierwand','ocr'),('club-inverse-wall','ocr'),('club-balance-beam','ocr'),
  ('club-slackline','ocr'),('club-anchor-chain-drag','ocr'),('club-atlas-stone-carry','ocr'),
  ('club-olympus','obstacle'),('club-escaladierwand','obstacle'),('club-inverse-wall','obstacle'),
  ('club-balance-beam','obstacle'),('club-slackline','obstacle'),('club-anchor-chain-drag','obstacle'),('club-atlas-stone-carry','obstacle'),
  ('club-olympus','technique'),('club-escaladierwand','technique'),('club-inverse-wall','technique'),
  ('club-balance-beam','technique'),('club-slackline','technique'),('club-anchor-chain-drag','technique'),('club-atlas-stone-carry','technique')
) AS v(seed_key,tag) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO exercise_training_phases (exercise_id,phase)
SELECT e.id,v.phase FROM exercises e JOIN (VALUES
  ('club-olympus','main'),('club-escaladierwand','main'),('club-inverse-wall','main'),
  ('club-balance-beam','warmup'),('club-balance-beam','main'),('club-slackline','warmup'),
  ('club-slackline','main'),('club-anchor-chain-drag','main'),('club-atlas-stone-carry','main')
) AS v(seed_key,phase) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO exercise_training_goals (exercise_id,goal)
SELECT e.id,v.goal FROM exercises e JOIN (VALUES
  ('club-olympus','ocr_technique'),('club-olympus','grip'),('club-escaladierwand','ocr_technique'),
  ('club-escaladierwand','strength'),('club-inverse-wall','ocr_technique'),('club-inverse-wall','strength'),
  ('club-balance-beam','balance'),('club-balance-beam','coordination'),('club-slackline','balance'),
  ('club-slackline','coordination'),('club-anchor-chain-drag','strength'),('club-anchor-chain-drag','strength_endurance'),
  ('club-atlas-stone-carry','strength'),('club-atlas-stone-carry','strength_endurance')
) AS v(seed_key,goal) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO exercise_equipment (exercise_id,equipment_id,quantity_required)
SELECT e.id,q.id,1 FROM exercises e JOIN (VALUES
  ('club-olympus','wall'),('club-escaladierwand','wall'),('club-inverse-wall','wall'),
  ('club-balance-beam','balance-beam'),('club-atlas-stone-carry','atlas-ball')
) AS v(seed_key,equipment_key) ON e.seed_key=v.seed_key
JOIN equipment q ON q.seed_key=v.equipment_key;

INSERT INTO exercise_obstacle_guidance (
  exercise_id,locale,equipment_configuration,prerequisites,approach,execution,exit_reset,
  fallback_exercise,station_capacity,clear_zone_metres
)
SELECT e.id,v.locale,v.setup,v.prereq,v.approach,v.execution,v.exit_reset,v.fallback,1,v.clear_zone
FROM exercises e JOIN (VALUES
  ('club-olympus','de','Freigegebener Olympus, Fallschutz, markierte Ein-/Ausstiegs- und Pendelzone.','Aktiver Hang, sicherer Griff und kontrollierter Abstieg; Bauform vor Nutzung prüfen.','Seitlich warten, Richtung und ersten Kontaktpunkt prüfen.','Kontaktpunkt für Kontaktpunkt arbeiten; Griff schließen und den Körper ohne Zusatzschwung weiterführen.','Am markierten Ausgang stabil aufsetzen und die Fallzone seitlich verlassen.','Niedrige Ring- oder Grifftraverse mit Fußkontakt.','4.0'),
  ('club-olympus','en','Approved Olympus, fall protection and marked entry, exit and swing zone.','Active hang, secure grip and controlled dismount; inspect the build before use.','Wait to the side and check direction and the first contact point.','Move one contact at a time, close the grip and progress without adding swing.','Place the feet safely at the marked exit and leave the fall zone to the side.','Low ring or grip traverse with foot support.','4.0'),
  ('club-escaladierwand','de','Geprüfte Eskaladierwand, Matten, freie Auf-/Abstiegsseite und Wartezone.','Step-up, Stütz und kontrollierter Abstieg an niedriger Wand.','Gehend an die Wand kommen und Oberfläche, Tritte und Ausstieg prüfen.','Einen Fuß oder vorgesehenen Griff nach dem anderen setzen; nicht über die Wand springen.','Beidbeinig stabilisieren, über die markierte Seite absteigen und Zone freigeben.','Niedriger Wand-Step-over mit Fußstütze.','4.0'),
  ('club-escaladierwand','en','Inspected scaling wall, mats, clear ascent/descent side and waiting zone.','Step-up, support and controlled dismount on a low wall.','Walk to the wall and check surface, footholds and exit.','Place one foot or designated handhold at a time; do not jump over the wall.','Stabilise on both feet, dismount on the marked side and clear the zone.','Low wall step-over with foot support.','4.0'),
  ('club-inverse-wall','de','Geprüfte inverse Wand, Fallschutz, direkter Trainerblick und freie Landefläche.','Niedrige Wandüberwindung und sicherer Abstieg ohne Rückwärtsabsprung.','Nur nach Einweisung seitlich warten und Einstiegs-/Ausstiegsrichtung bestätigen.','Kontaktpunkte einzeln setzen, Gewicht kontrolliert verlagern und Sicht-/Stoppzeichen beachten.','Mit beiden Füßen stabil landen, seitlich aussteigen und die Wand nicht rückwärts verlassen.','Niedrige Wand mit Hand- oder Fußstütze.','5.0'),
  ('club-inverse-wall','en','Inspected inverse wall, fall protection, direct coach view and clear landing area.','Low wall passage and safe dismount without a backward jump.','Wait to the side after briefing and confirm entry and exit direction.','Use contact points one at a time, shift weight under control and follow stop signals.','Land on both feet, exit to the side and never reverse-jump from the wall.','Low wall with hand or foot support.','5.0'),
  ('club-balance-beam','de','Freigegebener Balancebalken, rutschfester Boden, freie Seitenzone und Endmarker.','Ruhiges Gehen und kontrolliertes Absteigen; Höhe und Breite bestätigen.','Vor dem Aufsteigen Blick auf die gesamte Bahn und Warteposition prüfen.','Schritt für Schritt gehen, Blick voraus und Arme zur Balance nutzen.','Am Endmarker vollständig absteigen, stabilisieren und seitlich aussteigen.','Bodenlinie oder breiter niedriger Balken.','2.0'),
  ('club-balance-beam','en','Approved balance beam, non-slip floor, clear side zone and end marker.','Calm walking and controlled dismount; confirm height and width.','Check the full lane and waiting position before stepping up.','Walk one step at a time, look ahead and use the arms for balance.','Dismount fully at the end marker, stabilise and exit to the side.','Floor line or a wide low beam.','2.0'),
  ('club-slackline','de','Freigegebene Slackline, geprüfte Befestigung, Fallschutz und freie Seitenzone.','Sicheres Stehen und kontrolliertes Absteigen; Höhe vor Nutzung bestätigen.','Seitlich warten, Spannung und Befestigung durch den Trainer prüfen lassen.','Mit Hilfestellung aufsteigen, Blick auf einen festen Punkt richten und Gewichtsverlagerungen klein halten.','Vor dem Absteigen stoppen, seitlich auf den Boden treten und Bahn freigeben.','Bodenlinie oder niedrige Balancefläche.','3.0'),
  ('club-slackline','en','Approved slackline, checked anchors, fall protection and clear side zone.','Stable standing and controlled dismount; confirm height before use.','Wait to the side and have the coach check tension and anchors.','Mount with support, focus on a fixed point and keep weight shifts small.','Stop before dismounting, step to the side and clear the lane.','Floor line or low balance surface.','3.0'),
  ('club-anchor-chain-drag','de','Geprüfte Ankerkette, sichere Verbindung, ebene Zugbahn und gesperrte Rücklaufzone.','Hinge-/Zugtechnik, stabiler Stand und Stoppsignal.','Zugrichtung, Verbindung und Abstand zu anderen Stationen prüfen.','Kette mit neutralem Rücken aus Beinen und Hüfte gleichmäßig ziehen; nicht ruckartig reißen.','Spannung kontrolliert lösen, Kette ablegen und seitlich zurückgehen.','Leichter Reifen- oder Schlittenzug.','4.0'),
  ('club-anchor-chain-drag','en','Inspected anchor chain, secure connection, level pulling lane and closed return zone.','Hinge and pulling technique, stable stance and stop signal.','Check pulling direction, attachment and distance from other stations.','Drag steadily from legs and hips with a neutral trunk; do not jerk.','Release tension under control, place the chain down and return to the side.','Light tire or sled drag.','4.0'),
  ('club-atlas-stone-carry','de','Freigegebener Atlasstein, griffige Hebematte, breite Tragbahn und sichere Ablage.','Hebe- und Trageposition mit kontrolliertem Absetzen; Gewicht vorher bestätigen.','Warte hinter der Linie, prüfe Gewicht und freie Wendefläche.','Stein nah am Körper aus Hüfte und Beinen aufnehmen und mit kurzen Schritten tragen.','Über Hüfte und Knie auf die Matte ablegen; nicht aus Schulterhöhe fallen lassen.','Leichter Ball- oder Sandsack-Bear-Hug.','3.0'),
  ('club-atlas-stone-carry','en','Approved atlas stone, grippy lifting mat, wide carry lane and safe set-down area.','Lifting and carrying position with controlled set-down; confirm load first.','Wait behind the line, check load and clear turning space.','Pick the stone close using hips and legs and carry with short steps.','Lower through hips and knees onto the mat; never drop from shoulder height.','Light ball or sandbag bear hug.','3.0')
) AS v(seed_key,locale,setup,prereq,approach,execution,exit_reset,fallback,clear_zone) ON e.seed_key=v.seed_key;

INSERT INTO exercise_details (
  exercise_id,locale,purpose,setup,start_position,finish_reset,breathing_cue,tempo_cue,
  safety_notes,quality_criteria,beginner_prescription,standard_prescription,advanced_prescription,
  work_rest_guidance,level_1,level_2,level_3,child_youth_variant,prerequisites,fallback_exercise,
  difficulty,supervision,space_requirement,setup_seconds,transition_seconds,station_capacity
)
SELECT e.id,v.locale,v.purpose,v.setup,v.start_position,v.finish_reset,v.breathing,v.tempo,v.safety,
  v.quality,v.beginner,v.standard,v.advanced,v.workrest,v.level1,v.level2,v.level3,v.youth,v.prereq,
  v.fallback,e.difficulty,e.supervision,v.space,180,45,1
FROM exercises e JOIN (VALUES
  ('club-olympus','de','Schult Griff- und Übergangskontrolle.','Nur geprüfter Aufbau mit Fallschutz und freier Pendelzone.','Seitlich warten und ersten Griff aus sicherem Stand setzen.','Am Ausgang mit beiden Füßen stabilisieren.','Vor jedem Umgriff ruhig ausatmen.','Langsam und ein Element nach dem anderen.','Direkte Aufsicht, kein Zusatzschwung, kein ermüdeter Versuch.','Griff bleibt geschlossen und der Ausgang wird kontrolliert erreicht.','2 niedrige Kontakte mit Fußhilfe','3–4 kontrollierte Kontakte','5–6 Kontakte ohne Tempozwang','90–120 Sekunden Pause.','Statische Griffhalteübung.','Kurze Traverse mit Fußkontakt.','Längere Traverse nach Trainerfreigabe.','Nur niedrige Bodenvariante.','Aktiver Hang und Stoppsignal.','Niedrige Ringtraverse.','advanced','direct','rig-area'),
  ('club-olympus','en','Trains grip and transfer control.','Use only an inspected build with fall protection and clear swing zone.','Wait to the side and take the first grip from a secure stance.','Stabilise on both feet at the exit.','Exhale calmly before every transfer.','Move slowly, one element at a time.','Direct supervision, no added swing and no fatigued attempt.','Grip stays closed and the exit is reached under control.','2 low contacts with foot support','3–4 controlled contacts','5–6 contacts without chasing speed','Rest 90–120 seconds.','Static grip hold.','Short traverse with foot support.','Longer traverse after coach clearance.','Low ground-based variation only.','Active hang and stop signal.','Low ring traverse.','advanced','direct','rig-area'),
  ('club-escaladierwand','de','Schult Wandaufstieg und Abstieg.','Matten, Wartezone und freie Auf-/Abstiegsseite markieren.','Gehend zur Wand und ersten Tritt prüfen.','Seitlich absteigen und Bahn freigeben.','Beim Hochdrücken ausatmen.','Kontakt für Kontakt, kein Sprung.','Höhe, Oberfläche und Landung vor jeder Nutzung prüfen.','Beide Füße landen stabil und die Wand bleibt frei.','Niedrige Bank mit Fußstütze','2–3 Wandüberstiege','4 kontrollierte Überstiege ohne Zeitdruck','60–90 Sekunden Pause.','Step-up am Boden.','Niedrige Wand mit Griff.','Freigegebene Wand ohne Anlauf.','Niedrige direkte betreute Variante.','Sicherer Step-up und Stoppzeichen.','Niedriger Wand-Step-over.','advanced','direct','rig-area'),
  ('club-escaladierwand','en','Trains wall ascent and dismount.','Mark mats, waiting zone and clear ascent/descent side.','Walk to the wall and check the first foothold.','Dismount to the side and clear the lane.','Exhale while pressing up.','Contact by contact, no jumping.','Check height, surface and landing before every use.','Both feet land stable and the wall stays clear.','Low bench with foot support','2–3 wall step-overs','4 controlled step-overs without time pressure','Rest 60–90 seconds.','Floor step-up.','Low wall with handhold.','Approved wall without run-up.','Low direct-supervision version.','Safe step-up and stop signal.','Low wall step-over.','advanced','direct','rig-area'),
  ('club-inverse-wall','de','Schult kontrollierte inverse Wandübergänge.','Fallschutz, Ein-/Ausstieg und Trainerposition festlegen.','Seitlich warten und Kontaktpunkte prüfen.','Stabil landen und nicht rückwärts abspringen.','Bei der Gewichtsverlagerung ausatmen.','Langsam, ein Kontaktpunkt nach dem anderen.','Nur freigegebene Höhe und direkte Aufsicht.','Kontaktpunkte, Sicht und Abstieg bleiben kontrolliert.','Niedrige Wand mit Fußhilfe','2 langsame Durchgänge','3–4 kontrollierte Durchgänge','90–120 Sekunden Pause.','Bodennahe Wandübung.','Niedrige inverse Variante.','Freigegebene Wand ohne Tempo.','Nur niedrige betreute Variante.','Wand-Step-over und sicherer Abstieg.','Niedrige Wand mit Handhilfe.','advanced','direct','rig-area'),
  ('club-inverse-wall','en','Trains controlled inverse wall passages.','Define fall protection, entry/exit and coach position.','Wait to the side and check contact points.','Land stable and never reverse-jump.','Exhale during weight transfer.','Slowly, one contact at a time.','Use only approved height under direct supervision.','Contact points, sight line and dismount stay controlled.','Low wall with foot support','2 slow passages','3–4 controlled passages','Rest 90–120 seconds.','Low wall drill.','Low inverse variation.','Approved wall without speed.','Low supervised version only.','Wall step-over and safe dismount.','Low wall with hand support.','advanced','direct','rig-area'),
  ('club-balance-beam','de','Schult Balance und Präzision.','Rutschfester Boden, Seitenzone und Endmarker vorbereiten.','Vor dem Aufsteigen die Bahn prüfen.','Seitlich absteigen und stabil stehen.','Ruhig weiteratmen.','Gleichmäßig, ohne zu eilen.','Nur freigegebene Höhe; nicht springen oder schubsen.','Blick voraus, ruhige Schritte und kontrollierter Abstieg.','Bodenlinie','2–3 Durchgänge','4–6 Durchgänge oder leichte Aufgabe','30–60 Sekunden Pause.','Breite Bodenlinie.','Niedriger Balken.','Schmalere oder längere freigegebene Variante.','Spielerisches Balancieren auf Bodenmarkierungen.','Sicheres Auf-/Absteigen.','Bodenlinie.','intermediate','increased','balance-area'),
  ('club-balance-beam','en','Trains balance and precision.','Prepare non-slip floor, side zone and end marker.','Check the lane before stepping up.','Dismount to the side and stand stable.','Keep breathing calmly.','Move steadily without rushing.','Use only approved height; no jumping or pushing.','Eyes forward, quiet steps and controlled dismount.','Floor line','2–3 turns','4–6 turns or a light task','Rest 30–60 seconds.','Wide floor line.','Low beam.','Narrower or longer approved variation.','Playful balance on floor markings.','Safe mounting and dismounting.','Floor line.','intermediate','increased','balance-area'),
  ('club-slackline','de','Schult ruhige Gewichtsverlagerung.','Befestigung, Spannung, Fallschutz und Seitenzone prüfen.','Mit Trainerhilfe aufsteigen.','Seitlich absteigen und Bahn freigeben.','Ruhig ausatmen, nicht pressen.','Kleine Gewichtsverlagerungen.','Höhe und Befestigung vor jedem Durchgang prüfen.','Stabiler Stand und kontrolliertes Absteigen.','Bodenlinie','10–20 Sekunden Stand','Kurze Schritte nach Trainerfreigabe','45–60 Sekunden Pause.','Bodenlinie.','Niedrige Slackline mit Hilfe.','Kurze freie Sequenz.','Nur bodennahe Variante mit Aufsicht.','Sicheres Stehen und Stoppsignal.','Bodenlinie.','intermediate','increased','balance-area'),
  ('club-slackline','en','Trains calm weight transfer.','Check anchors, tension, fall protection and side zone.','Mount with coach support.','Dismount to the side and clear the lane.','Exhale calmly without bracing.','Use small weight shifts.','Check height and anchors before every turn.','Stable standing and controlled dismount.','Floor line','10–20 second stand','Short steps after coach clearance','Rest 45–60 seconds.','Floor line.','Low slackline with support.','Short independent sequence.','Ground-level supervised version only.','Stable stance and stop signal.','Floor line.','intermediate','increased','balance-area'),
  ('club-anchor-chain-drag','de','Schult Zugkraft und Lastbewegung.','Verbindung, Zugbahn und Rücklaufzone markieren.','Stabil hinter der Zuglinie stehen.','Spannung lösen und Kette seitlich ablegen.','Beim Anziehen ausatmen.','Gleichmäßig, ohne Ruck.','Keine Personen in Zug- oder Rücklaufzone; Last vorab bestätigen.','Neutraler Rumpf, kurze Schritte und kontrolliertes Ende.','Leichte Kette oder Bandzug','3 kurze Züge','4–6 Züge über definierte Strecke','60–90 Sekunden Pause.','Bandzug im Stand.','Leichte Kette.','Längere Strecke oder moderate Last.','Leichter Reifen ohne Zeitdruck.','Hinge-/Zugtechnik und Stoppsignal.','Leichter Reifen-Drag.','advanced','direct','carry-lane'),
  ('club-anchor-chain-drag','en','Trains pulling strength and load movement.','Mark attachment, pulling lane and return zone.','Stand stable behind the pulling line.','Release tension and place the chain to the side.','Exhale as the pull starts.','Steady, without jerking.','Keep people out of pull and return zones; confirm load first.','Neutral trunk, short steps and controlled finish.','Light chain or band pull','3 short pulls','4–6 pulls over a defined distance','Rest 60–90 seconds.','Standing band pull.','Light chain.','Longer distance or moderate load.','Light tire without time pressure.','Hinge/pulling technique and stop signal.','Light tire drag.','advanced','direct','carry-lane'),
  ('club-atlas-stone-carry','de','Schult sicheres Heben, Tragen und Ablegen.','Hebematte, Tragbahn und Ablagezone vollständig freihalten.','Gewicht prüfen und nah am Stein in stabile Position gehen.','Über Hüfte und Knie auf der Matte ablegen.','Beim Heben ausatmen.','Kurze Schritte, kontrollierte Wendung.','Keine Würfe, kein Fallenlassen und keine gekreuzte Laufspur.','Stein bleibt nah, Rücken neutral, Ablage ist ruhig.','Leichter Ball in erhöhter Position','2–3 kurze Tragen','3–5 Tragen mit moderater Last','90–120 Sekunden Pause.','Bear-Hug mit leichtem Ball.','Leichter Atlasstein.','Längere Strecke ohne Tempozwang.','Leichter Ball mit Trainerhilfe.','Sichere Hebe- und Ablagetechnik.','Leichter Sand-/Medizinball.','advanced','direct','carry-lane'),
  ('club-atlas-stone-carry','en','Trains safe lifting, carrying and set-down.','Keep lifting mat, carry lane and set-down zone fully clear.','Check the load and take a stable position close to the stone.','Lower through hips and knees onto the mat.','Exhale during the lift.','Use short steps and a controlled turn.','No throws, drops or crossing running lanes.','Stone stays close, trunk neutral and set-down is calm.','Light ball from an elevated position','2–3 short carries','3–5 carries with moderate load','Rest 90–120 seconds.','Bear hug with a light ball.','Light atlas stone.','Longer distance without chasing speed.','Light ball with coach support.','Safe lifting and set-down technique.','Light sand/medicine ball.','advanced','direct','carry-lane')
) AS v(seed_key,locale,purpose,setup,start_position,finish_reset,breathing,tempo,safety,quality,beginner,standard,advanced,workrest,level1,level2,level3,youth,prereq,fallback,space) ON e.seed_key=v.seed_key;

INSERT INTO exercise_execution_steps (exercise_id,locale,step_order,instruction)
SELECT e.id,v.locale,v.step_order,v.instruction FROM exercises e JOIN (VALUES
  ('club-olympus','de',1,'Wartezone, Richtung und ersten Griff prüfen.'),('club-olympus','de',2,'Kontaktpunkt für Kontaktpunkt mit geschlossenem Griff weiterarbeiten.'),('club-olympus','de',3,'Stabil aufsetzen und seitlich aussteigen.'),
  ('club-olympus','en',1,'Check the waiting zone, direction and first grip.'),('club-olympus','en',2,'Move contact by contact with a closed grip.'),('club-olympus','en',3,'Place the feet safely and exit to the side.'),
  ('club-escaladierwand','de',1,'Oberfläche, Tritte und Landefläche prüfen.'),('club-escaladierwand','de',2,'Kontaktpunkt für Kontaktpunkt aufsteigen.'),('club-escaladierwand','de',3,'Kontrolliert absteigen und Bahn freigeben.'),
  ('club-escaladierwand','en',1,'Check surface, footholds and landing area.'),('club-escaladierwand','en',2,'Ascend one contact point at a time.'),('club-escaladierwand','en',3,'Dismount under control and clear the lane.'),
  ('club-inverse-wall','de',1,'Einstiegsrichtung und Kontaktpunkte prüfen.'),('club-inverse-wall','de',2,'Gewicht langsam über Hände und Füße verlagern.'),('club-inverse-wall','de',3,'Stabil landen und seitlich verlassen.'),
  ('club-inverse-wall','en',1,'Check entry direction and contact points.'),('club-inverse-wall','en',2,'Shift weight slowly through hands and feet.'),('club-inverse-wall','en',3,'Land stable and exit to the side.'),
  ('club-balance-beam','de',1,'Bahn und Endmarker prüfen.'),('club-balance-beam','de',2,'Schritt für Schritt mit Blick voraus gehen.'),('club-balance-beam','de',3,'Seitlich absteigen und stabilisieren.'),
  ('club-balance-beam','en',1,'Check the lane and end marker.'),('club-balance-beam','en',2,'Walk one step at a time with eyes forward.'),('club-balance-beam','en',3,'Dismount to the side and stabilise.'),
  ('club-slackline','de',1,'Befestigung und Spannung prüfen lassen.'),('club-slackline','de',2,'Mit Hilfe aufsteigen und klein verlagern.'),('club-slackline','de',3,'Seitlich absteigen und Bahn freigeben.'),
  ('club-slackline','en',1,'Have the anchors and tension checked.'),('club-slackline','en',2,'Mount with support and use small shifts.'),('club-slackline','en',3,'Dismount to the side and clear the lane.'),
  ('club-anchor-chain-drag','de',1,'Verbindung und Zugbahn prüfen.'),('club-anchor-chain-drag','de',2,'Aus Beinen und Hüfte gleichmäßig ziehen.'),('club-anchor-chain-drag','de',3,'Spannung lösen und Kette seitlich ablegen.'),
  ('club-anchor-chain-drag','en',1,'Check attachment and pulling lane.'),('club-anchor-chain-drag','en',2,'Pull steadily from legs and hips.'),('club-anchor-chain-drag','en',3,'Release tension and place the chain to the side.'),
  ('club-atlas-stone-carry','de',1,'Gewicht und Hebezone prüfen.'),('club-atlas-stone-carry','de',2,'Stein nah am Körper aufnehmen und tragen.'),('club-atlas-stone-carry','de',3,'Über Knie und Hüfte kontrolliert ablegen.'),
  ('club-atlas-stone-carry','en',1,'Check the load and lifting zone.'),('club-atlas-stone-carry','en',2,'Pick up close and carry with short steps.'),('club-atlas-stone-carry','en',3,'Lower under control through knees and hips.')
) AS v(seed_key,locale,step_order,instruction) ON e.seed_key=v.seed_key;

INSERT INTO exercise_coaching_cues (exercise_id,locale,cue_order,cue)
SELECT e.id,v.locale,v.cue_order,v.cue FROM exercises e JOIN (VALUES
  ('club-olympus','de',1,'Griff schließen'),('club-olympus','de',2,'Keinen Zusatzschwung'),('club-olympus','en',1,'Close the grip'),('club-olympus','en',2,'Do not add swing'),
  ('club-escaladierwand','de',1,'Ein Kontaktpunkt pro Wechsel'),('club-escaladierwand','de',2,'Nicht abspringen'),('club-escaladierwand','en',1,'One contact per transfer'),('club-escaladierwand','en',2,'Do not jump down'),
  ('club-inverse-wall','de',1,'Sicht- und Stoppzeichen beachten'),('club-inverse-wall','de',2,'Seitlich aussteigen'),('club-inverse-wall','en',1,'Follow sight and stop signals'),('club-inverse-wall','en',2,'Exit to the side'),
  ('club-balance-beam','de',1,'Blick voraus'),('club-balance-beam','de',2,'Ruhige Schritte'),('club-balance-beam','en',1,'Eyes forward'),('club-balance-beam','en',2,'Quiet steps'),
  ('club-slackline','de',1,'Kleine Gewichtsverlagerung'),('club-slackline','de',2,'Seitlich absteigen'),('club-slackline','en',1,'Small weight shifts'),('club-slackline','en',2,'Dismount to the side'),
  ('club-anchor-chain-drag','de',1,'Aus der Hüfte ziehen'),('club-anchor-chain-drag','de',2,'Nicht rucken'),('club-anchor-chain-drag','en',1,'Pull from the hips'),('club-anchor-chain-drag','en',2,'Do not jerk'),
  ('club-atlas-stone-carry','de',1,'Nah am Körper'),('club-atlas-stone-carry','de',2,'Nicht fallen lassen'),('club-atlas-stone-carry','en',1,'Keep it close'),('club-atlas-stone-carry','en',2,'Do not drop it')
) AS v(seed_key,locale,cue_order,cue) ON e.seed_key=v.seed_key;

INSERT INTO exercise_common_mistakes (exercise_id,locale,mistake_order,mistake,correction)
SELECT e.id,v.locale,1,v.mistake,v.correction FROM exercises e JOIN (VALUES
  ('club-olympus','de','Der Griff wird vor dem sicheren Kontakt gelöst.','Zur letzten sicheren Position zurückkehren und nur einen Kontakt wechseln.'),('club-olympus','en','The grip is released before the next contact is secure.','Return to the last secure position and move only one contact.'),
  ('club-escaladierwand','de','Die Wand wird mit Anlauf oder Sprung angegangen.','Tempo reduzieren und den Step-up einzeln mit Trainerfreigabe üben.'),('club-escaladierwand','en','The wall is approached with a run-up or jump.','Slow down and practise the step-up one contact at a time after clearance.'),
  ('club-inverse-wall','de','Der Abstieg erfolgt rückwärts oder ohne freie Landefläche.','Abbruch, Sichtlinie herstellen und seitlich über die markierte Zone absteigen.'),('club-inverse-wall','en','The dismount is backward or the landing area is not clear.','Stop, restore the sight line and dismount to the side through the marked zone.'),
  ('club-balance-beam','de','Das Tempo steigt und der Blick geht nach unten.','Tempo reduzieren, Blick voraus und breitere Regression wählen.'),('club-balance-beam','en','Speed increases and the gaze drops down.','Slow down, look ahead and choose a wider regression.'),
  ('club-slackline','de','Die Person springt ungeplant von der Line.','Stoppsignal, seitlichen Abstieg und bodennahe Regression üben.'),('club-slackline','en','The athlete jumps off the line unexpectedly.','Practise the stop signal, side dismount and a ground-level regression.'),
  ('club-anchor-chain-drag','de','Die Kette wird ruckartig aus rundem Rücken gezogen.','Last reduzieren, Hüfte nutzen und gleichmäßige Schritte wählen.'),('club-anchor-chain-drag','en','The chain is jerked with a rounded back.','Reduce the load, use the hips and choose steady steps.'),
  ('club-atlas-stone-carry','de','Der Stein wird fallen gelassen oder aus dem Rücken gehoben.','Last reduzieren, nah am Körper heben und über Knie/Hüfte ablegen.'),('club-atlas-stone-carry','en','The stone is dropped or lifted from the back.','Reduce the load, lift close and lower through knees and hips.')
) AS v(seed_key,locale,mistake,correction) ON e.seed_key=v.seed_key;

INSERT INTO exercise_seed_quality_reviews (exercise_id,review_version,review_status,notes)
SELECT e.id,'2026-09-ocrfra-additional-obstacles-v1','passed',
  'OCRFRA inventory variant; local dimensions, capacity, inspection and release remain subject to club confirmation.'
FROM exercises e WHERE e.seed_key IN (
  'club-olympus','club-escaladierwand','club-inverse-wall','club-balance-beam',
  'club-slackline','club-anchor-chain-drag','club-atlas-stone-carry'
);

INSERT INTO search_documents_de (document_id,entity_type,entity_id,title,aliases,summary,tags,body_regions,equipment,instructions)
SELECT 'exercise:' || e.id::VARCHAR,'exercise',e.id::VARCHAR,t.name,
  COALESCE((SELECT string_agg(a.alias,' ') FROM exercise_aliases a WHERE a.exercise_id=e.id AND a.locale='de'),''),t.summary,
  COALESCE((SELECT string_agg(tag.tag_id,' ') FROM exercise_tags tag WHERE tag.exercise_id=e.id),''),
  COALESCE((SELECT string_agg(b.body_region_id,' ') FROM exercise_body_regions b WHERE b.exercise_id=e.id),''),
  COALESCE((SELECT string_agg(q.seed_key,' ') FROM exercise_equipment x JOIN equipment q ON q.id=x.equipment_id WHERE x.exercise_id=e.id),''),
  COALESCE((SELECT string_agg(s.instruction,' ' ORDER BY s.step_order) FROM exercise_execution_steps s WHERE s.exercise_id=e.id AND s.locale='de'),'')
FROM exercises e JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='de'
WHERE e.seed_key IN ('club-olympus','club-escaladierwand','club-inverse-wall','club-balance-beam','club-slackline','club-anchor-chain-drag','club-atlas-stone-carry');

INSERT INTO search_documents_en (document_id,entity_type,entity_id,title,aliases,summary,tags,body_regions,equipment,instructions)
SELECT 'exercise:' || e.id::VARCHAR,'exercise',e.id::VARCHAR,t.name,
  COALESCE((SELECT string_agg(a.alias,' ') FROM exercise_aliases a WHERE a.exercise_id=e.id AND a.locale='en'),''),t.summary,
  COALESCE((SELECT string_agg(tag.tag_id,' ') FROM exercise_tags tag WHERE tag.exercise_id=e.id),''),
  COALESCE((SELECT string_agg(b.body_region_id,' ') FROM exercise_body_regions b WHERE b.exercise_id=e.id),''),
  COALESCE((SELECT string_agg(q.seed_key,' ') FROM exercise_equipment x JOIN equipment q ON q.id=x.equipment_id WHERE x.exercise_id=e.id),''),
  COALESCE((SELECT string_agg(s.instruction,' ' ORDER BY s.step_order) FROM exercise_execution_steps s WHERE s.exercise_id=e.id AND s.locale='en'),'')
FROM exercises e JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='en'
WHERE e.seed_key IN ('club-olympus','club-escaladierwand','club-inverse-wall','club-balance-beam','club-slackline','club-anchor-chain-drag','club-atlas-stone-carry');

UPDATE search_index_state SET status='dirty',last_error=NULL WHERE locale IN ('de','en');
INSERT INTO schema_migrations(version,name) VALUES (81,'ocrfra_additional_obstacles');
COMMIT;
