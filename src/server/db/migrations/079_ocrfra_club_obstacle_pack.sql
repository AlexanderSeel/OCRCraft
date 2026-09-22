BEGIN TRANSACTION;

-- OCR Frankfurt club pack. Names and guidance are OCRCraft-original operational
-- records based on the club inventory; dimensions remain unset until confirmed.
INSERT INTO exercises (
  seed_key,canonical_name,category,default_phase,risk_level,min_age,indoor,outdoor,
  exercise_type,difficulty,impact_level,coordination_complexity,progression_required,
  space_requirement,supports_reps,supports_seconds,supports_minutes,supports_metres,
  supports_rounds,supports_attempts,setup_seconds,transition_seconds,station_capacity,
  suitable_for_kids,suitable_for_youth,suitable_for_adults,supervision,
  indoor_suitable,outdoor_suitable,laterality,movement_plane
)
SELECT v.seed_key,v.name_en,'ocr-skill','main',v.risk,v.min_age,true,true,'obstacle',v.difficulty,
  v.impact,'complex',true,'rig-area',true,true,false,false,true,true,180,45,1,
  false,v.min_age<=16,true,v.supervision,true,true,'locomotion','multiplanar'
FROM (VALUES
  ('club-irish-table','Irish Table – OCRFRA','medium',14,'intermediate','moderate','increased'),
  ('club-weaver','Weaver – OCRFRA','high',14,'advanced','moderate','direct'),
  ('club-rotating-rig-elements','Rotierende Rig-Elemente – OCRFRA','high',16,'advanced','moderate','direct'),
  ('club-multirig-ring-traverse','Multirig-Ringtraverse – OCRFRA','high',14,'advanced','moderate','direct'),
  ('club-incline-wall-traverse','Schrägwand-Traverse – OCRFRA','high',14,'advanced','high','direct'),
  ('club-tire-obstacle-transit','Reifen-Hindernisübergang – OCRFRA','medium',12,'intermediate','moderate','increased')
) AS v(seed_key,name_en,risk,min_age,difficulty,impact,supervision)
WHERE NOT EXISTS (SELECT 1 FROM exercises e WHERE e.seed_key=v.seed_key);

INSERT INTO exercise_translations (exercise_id,locale,name,summary)
SELECT e.id,v.locale,v.name,v.summary FROM exercises e JOIN (VALUES
  ('club-irish-table','de','Irish Table – OCRFRA','Übe das kontrollierte Übersteigen eines freigegebenen Irish Table mit klarer Anlauf-, Warte- und Ausstiegszone.'),
  ('club-irish-table','en','Irish Table – OCRFRA','Practise stepping over an approved Irish table with clear approach, waiting and exit zones.'),
  ('club-weaver','de','Weaver – OCRFRA','Bewege dich kontrolliert durch eine versetzte Griff- und Trittfolge des freigegebenen Weaver-Hindernisses.'),
  ('club-weaver','en','Weaver – OCRFRA','Move under control through the staggered hand and foot sequence of the approved Weaver obstacle.'),
  ('club-rotating-rig-elements','de','Rotierende Rig-Elemente – OCRFRA','Übe den Übergang zwischen freigegebenen rotierenden Rig-Elementen mit ruhigem Griff und kontrolliertem Abstieg.'),
  ('club-rotating-rig-elements','en','Rotating Rig Elements – OCRFRA','Practise transitions between approved rotating rig elements with a secure grip and controlled dismount.'),
  ('club-multirig-ring-traverse','de','Multirig-Ringtraverse – OCRFRA','Traverse einen freigegebenen Ringabschnitt des Multirigs mit einem Element nach dem anderen.'),
  ('club-multirig-ring-traverse','en','Multirig Ring Traverse – OCRFRA','Traverse an approved multirig ring section one element at a time.'),
  ('club-incline-wall-traverse','de','Schrägwand-Traverse – OCRFRA','Überwinde den freigegebenen Abschnitt der Schrägwand mit kontrollierten Kontaktpunkten und sicherem Ausstieg.'),
  ('club-incline-wall-traverse','en','Incline Wall Traverse – OCRFRA','Negotiate the approved incline-wall section with controlled contact points and a safe exit.'),
  ('club-tire-obstacle-transit','de','Reifen-Hindernisübergang – OCRFRA','Übersteige oder durchquere eine freigegebene Reifenstation mit festen Tritt- und Ausstiegspunkten.'),
  ('club-tire-obstacle-transit','en','Tire Obstacle Transit – OCRFRA','Step over or move through an approved tire station using fixed footholds and exit points.')
) AS v(seed_key,locale,name,summary) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO exercise_aliases (exercise_id,locale,alias)
SELECT e.id,v.locale,v.alias FROM exercises e JOIN (VALUES
  ('club-irish-table','de','Irish Table'),('club-irish-table','en','Irish Table'),('club-irish-table','de','OCRFRA Table'),('club-irish-table','en','OCRFRA table'),
  ('club-weaver','de','Weaver Hindernis'),('club-weaver','en','Weaver obstacle'),('club-rotating-rig-elements','de','Rotierende Hindernisse'),('club-rotating-rig-elements','en','Rotating obstacles'),
  ('club-multirig-ring-traverse','de','Ringtraverse'),('club-multirig-ring-traverse','en','Ring traverse'),('club-incline-wall-traverse','de','Schrägwand'),('club-incline-wall-traverse','en','Incline wall'),
  ('club-tire-obstacle-transit','de','Reifenstation'),('club-tire-obstacle-transit','en','Tire station'),
  ('club-irish-table','de','OCR Hindernistechnik'),('club-irish-table','en','OCR obstacle technique'),('club-weaver','de','OCR Hindernistechnik'),('club-weaver','en','OCR obstacle technique'),
  ('club-rotating-rig-elements','de','OCR Hindernistechnik'),('club-rotating-rig-elements','en','OCR obstacle technique'),('club-multirig-ring-traverse','de','OCR Hindernistechnik'),('club-multirig-ring-traverse','en','OCR obstacle technique'),
  ('club-incline-wall-traverse','de','OCR Hindernistechnik'),('club-incline-wall-traverse','en','OCR obstacle technique'),('club-tire-obstacle-transit','de','OCR Hindernistechnik'),('club-tire-obstacle-transit','en','OCR obstacle technique')
) AS v(seed_key,locale,alias) ON e.seed_key=v.seed_key;

-- Keep the bilingual catalog searchable from either UI language.
INSERT OR IGNORE INTO exercise_aliases (exercise_id, locale, alias)
SELECT e.id, 'de', en.name
FROM exercises e
JOIN exercise_translations de ON de.exercise_id=e.id AND de.locale='de'
JOIN exercise_translations en ON en.exercise_id=e.id AND en.locale='en'
WHERE e.seed_key LIKE 'club-%' AND lower(trim(de.name)) <> lower(trim(en.name));

INSERT OR IGNORE INTO exercise_aliases (exercise_id, locale, alias)
SELECT e.id, 'en', de.name
FROM exercises e
JOIN exercise_translations de ON de.exercise_id=e.id AND de.locale='de'
JOIN exercise_translations en ON en.exercise_id=e.id AND en.locale='en'
WHERE e.seed_key LIKE 'club-%' AND lower(trim(de.name)) <> lower(trim(en.name));

INSERT OR IGNORE INTO exercise_body_regions (exercise_id,body_region_id,emphasis)
SELECT e.id,v.region,v.emphasis FROM exercises e JOIN (VALUES
  ('club-irish-table','full-body','primary'),('club-irish-table','shoulders','secondary'),('club-irish-table','forearms-grip','secondary'),
  ('club-weaver','forearms-grip','primary'),('club-weaver','shoulders','primary'),('club-weaver','core','secondary'),
  ('club-rotating-rig-elements','forearms-grip','primary'),('club-rotating-rig-elements','shoulders','primary'),('club-rotating-rig-elements','core','secondary'),
  ('club-multirig-ring-traverse','forearms-grip','primary'),('club-multirig-ring-traverse','shoulders','secondary'),('club-multirig-ring-traverse','core','secondary'),
  ('club-incline-wall-traverse','full-body','primary'),('club-incline-wall-traverse','shoulders','secondary'),('club-incline-wall-traverse','quadriceps','secondary'),
  ('club-tire-obstacle-transit','full-body','primary'),('club-tire-obstacle-transit','quadriceps','secondary'),('club-tire-obstacle-transit','ankles-feet','secondary')
) AS v(seed_key,region,emphasis) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO exercise_movement_patterns (exercise_id,movement_pattern_id)
SELECT e.id,v.pattern FROM exercises e JOIN (VALUES
  ('club-irish-table','climb'),('club-irish-table','brace'),('club-irish-table','balance'),
  ('club-weaver','hang'),('club-weaver','climb'),('club-weaver','balance'),
  ('club-rotating-rig-elements','hang'),('club-rotating-rig-elements','swing'),('club-rotating-rig-elements','brace'),
  ('club-multirig-ring-traverse','hang'),('club-multirig-ring-traverse','pull'),('club-multirig-ring-traverse','brace'),
  ('club-incline-wall-traverse','climb'),('club-incline-wall-traverse','balance'),('club-incline-wall-traverse','brace'),
  ('club-tire-obstacle-transit','climb'),('club-tire-obstacle-transit','balance'),('club-tire-obstacle-transit','squat')
) AS v(seed_key,pattern) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO exercise_tags (exercise_id,tag_id)
SELECT e.id,v.tag FROM exercises e JOIN (VALUES
  ('club-irish-table','ocr'),('club-irish-table','obstacle'),('club-weaver','ocr'),('club-weaver','obstacle'),
  ('club-rotating-rig-elements','ocr'),('club-rotating-rig-elements','obstacle'),('club-multirig-ring-traverse','ocr'),('club-multirig-ring-traverse','obstacle'),
  ('club-incline-wall-traverse','ocr'),('club-incline-wall-traverse','obstacle'),('club-tire-obstacle-transit','ocr'),('club-tire-obstacle-transit','obstacle'),
  ('club-irish-table','technique'),('club-weaver','technique'),('club-rotating-rig-elements','technique'),('club-multirig-ring-traverse','technique'),('club-incline-wall-traverse','technique'),('club-tire-obstacle-transit','technique')
) AS v(seed_key,tag) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO exercise_training_phases (exercise_id,phase)
SELECT e.id,v.phase FROM exercises e JOIN (VALUES
  ('club-irish-table','main'),('club-weaver','main'),('club-rotating-rig-elements','main'),('club-multirig-ring-traverse','main'),('club-incline-wall-traverse','main'),('club-tire-obstacle-transit','warmup'),('club-tire-obstacle-transit','main')
) AS v(seed_key,phase) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO exercise_training_goals (exercise_id,goal)
SELECT e.id,v.goal FROM exercises e JOIN (VALUES
  ('club-irish-table','ocr_technique'),('club-irish-table','coordination'),('club-weaver','ocr_technique'),('club-weaver','grip'),
  ('club-rotating-rig-elements','ocr_technique'),('club-rotating-rig-elements','grip'),('club-multirig-ring-traverse','ocr_technique'),('club-multirig-ring-traverse','grip'),
  ('club-incline-wall-traverse','ocr_technique'),('club-incline-wall-traverse','balance'),('club-tire-obstacle-transit','ocr_technique'),('club-tire-obstacle-transit','coordination')
) AS v(seed_key,goal) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO exercise_equipment (exercise_id,equipment_id,quantity_required)
SELECT e.id,q.id,1 FROM exercises e JOIN (VALUES
  ('club-irish-table','wall'),('club-weaver','monkey-bars'),('club-rotating-rig-elements','rings'),('club-multirig-ring-traverse','rings'),('club-incline-wall-traverse','wall'),('club-tire-obstacle-transit','tire')
) AS v(seed_key,equipment_key) ON e.seed_key=v.seed_key JOIN equipment q ON q.seed_key=v.equipment_key;

INSERT INTO exercise_obstacle_guidance (exercise_id,locale,equipment_configuration,prerequisites,approach,execution,exit_reset,fallback_exercise,station_capacity,clear_zone_metres)
SELECT e.id,v.locale,v.setup,v.prereq,v.approach,v.execution,v.exit_reset,v.fallback,1,v.clear_zone
FROM exercises e JOIN (VALUES
  ('club-irish-table','de','Freigegebener Irish Table, Matten/Fallschutz, markierte Warte- und Ausstiegszone.','Kontrollierter Step-over und sicherer Abstieg; Clubhöhe noch bestätigen.','Aus der Wartezone gehend an die markierte Einstiegsseite kommen und Aufbau prüfen.','Hände oder vorgesehenen Griff setzen, Gewicht kontrolliert verlagern und den Tisch Schritt für Schritt übersteigen.','Beidbeinig stabil landen, seitlich aussteigen und Station vollständig freigeben.','Niedriger Step-over über eine stabile Bank.','3.0'),
  ('club-irish-table','en','Approved Irish table, mats/fall protection and marked waiting and exit zones.','Controlled step-over and safe dismount; confirm club height before use.','Walk from the waiting zone to the marked entry side and inspect the setup.','Use the designated handhold, shift weight under control and step over one action at a time.','Land stable on both feet, move aside and fully clear the station.','Low step-over over a stable bench.','3.0'),
  ('club-weaver','de','Freigegebener Weaver mit Matten, markiertem Ein-/Ausstieg und nur einem Teilnehmenden.','Mehrere kontrollierte Hang-/Trittwechsel und sicherer Abstieg.','Warten, bis der Weaver frei ist; erste Griff- und Trittposition vom sicheren Stand prüfen.','Hände und Füße versetzt durch die Station führen; jeweils nur einen Kontaktpunkt lösen.','Am Endmarker kontrolliert absteigen, nicht abspringen, und den Ausgang freigeben.','Niedrige seitliche Traverse mit Fußkontakt.','3.0'),
  ('club-weaver','en','Approved Weaver with mats, marked entry/exit and one athlete at a time.','Several controlled hang/step transfers and a safe dismount.','Wait until the Weaver is clear and check the first hand and foot positions from standing.','Move hands and feet through the station in sequence, releasing only one contact at a time.','Dismount under control at the end marker; never jump and clear the exit.','Low side traverse with foot support.','3.0'),
  ('club-rotating-rig-elements','de','Geprüfte rotierende Rig-Elemente, Fallschutz, direkte Aufsicht und gesperrte Pendelzone.','Sicherer aktiver Hang und klares Abbruchsignal; Elementrotation vorab prüfen.','Seitlich warten, Rotation beobachten und nur auf Trainerfreigabe greifen.','Ein Element nach dem anderen greifen, Rotation kontrolliert mitgehen und den Körper nicht aktiv in Schwung bringen.','Am vorgesehenen Ausstieg mit Bodenkontakt lösen; bei Kontrollverlust sofort abbrechen.','Ring-Hang oder statischer Dead Hang an einer niedrigen Station.','4.0'),
  ('club-rotating-rig-elements','en','Inspected rotating rig elements, fall protection, direct supervision and closed swing zone.','Secure active hang and known stop signal; inspect rotation before use.','Wait to the side, observe the rotation and grip only on coach clearance.','Take one element at a time, follow the rotation under control and do not generate extra swing.','Release at the designated exit with ground contact; stop immediately if control is lost.','Ring hang or static dead hang at a low station.','4.0'),
  ('club-multirig-ring-traverse','de','Freigegebene Ringe am Multirig, Fallschutz, klare Richtung und direkte Aufsicht.','Aktiver Hang, sicherer Ringgriff und kontrollierter Abstieg.','Warten bis der Abschnitt frei ist; ersten Ring aus sicherem Stand greifen.','Ring für Ring greifen, Körper ruhig halten und erst nach geschlossenem Griff weiterziehen.','Am Ausgang beide Füße sicher aufsetzen und seitlich aus der Fallzone gehen.','Ring-Hang oder unterstützte Ringtraverse mit Fußkontakt.','3.0'),
  ('club-multirig-ring-traverse','en','Approved multirig rings, fall protection, clear direction and direct supervision.','Active hang, secure ring grip and controlled dismount.','Wait until the section is clear and reach the first ring from a secure stance.','Take one ring at a time, keep the body controlled and move only after the grip is closed.','Place both feet safely at the exit and move to the side of the fall zone.','Ring hang or assisted ring traverse with foot support.','3.0'),
  ('club-incline-wall-traverse','de','Geprüfte Schrägwand, rutschfeste Oberfläche, Matten und freie Seiten-/Ausstiegszone.','Niedriger Wand-Step-over und kontrolliertes Abbremsen ohne Sprung.','Anlauf nur gehend oder langsam; Trainer prüft Oberfläche, Neigung und Ausstieg.','Kontaktpunkte einzeln setzen, Gewicht über Hände/Füße verlagern und die markierte Linie kontrolliert überwinden.','Am oberen/seitlichen Ausgang stabilisieren, absteigen und die Landefläche freigeben.','Niedrige Wand oder Step-over ohne Anlauf.','4.0'),
  ('club-incline-wall-traverse','en','Inspected incline wall, non-slip surface, mats and clear side/exit zones.','Low wall step-over and controlled deceleration without jumping.','Use only a walk or slow approach; coach checks surface, incline and exit.','Place contact points one at a time, shift weight through hands/feet and cross the marked line under control.','Stabilise at the upper/side exit, dismount and clear the landing area.','Low wall or step-over without a run-up.','4.0'),
  ('club-tire-obstacle-transit','de','Freigegebene Reifenstation, rutschfester Untergrund, eindeutige Trittfolge und freie Ausstiegszone.','Sicheres Auf-/Absteigen und kontrollierte Fußplatzierung.','Vor dem Start Reifenlage und Abstand prüfen; keine Gegenrichtung in der Station.','Einen Reifen nach dem anderen betreten oder übersteigen, Blick auf die nächste sichere Trittfläche.','Letzten Reifen vollständig verlassen, stabilisieren und seitlich aussteigen.','Bodenmarker oder niedrige Step-over-Station.','2.0'),
  ('club-tire-obstacle-transit','en','Approved tire station, non-slip surface, clear foot sequence and clear exit zone.','Safe stepping on/off and controlled foot placement.','Check tire placement and spacing before starting; no opposing traffic in the station.','Enter or step over one tire at a time while looking toward the next safe foothold.','Fully clear the last tire, stabilise and exit to the side.','Floor markers or a low step-over station.','2.0')
) AS v(seed_key,locale,setup,prereq,approach,execution,exit_reset,fallback,clear_zone) ON e.seed_key=v.seed_key;

INSERT INTO exercise_details (exercise_id,locale,purpose,setup,start_position,finish_reset,breathing_cue,tempo_cue,safety_notes,quality_criteria,beginner_prescription,standard_prescription,advanced_prescription,work_rest_guidance,level_1,level_2,level_3,child_youth_variant,prerequisites,fallback_exercise,difficulty,supervision,space_requirement,setup_seconds,transition_seconds,station_capacity)
SELECT e.id,v.locale,v.purpose,v.setup,v.start_position,v.finish_reset,v.breathing,v.tempo,v.safety,v.quality,v.beginner,v.standard,v.advanced,v.workrest,v.level1,v.level2,v.level3,v.youth,v.prereq,v.fallback,e.difficulty,e.supervision,'rig-area',180,45,1
FROM exercises e JOIN (VALUES
  ('club-irish-table','de','Übt einen kontrollierten Club-Obstacle-Übergang.','Freigegebener Table mit Matten und markierten Zonen.','Warte hinter der Linie und prüfe den Einstieg.','Stabil landen und seitlich aussteigen.','Ruhig ausatmen beim Übersteigen.','Schritt für Schritt, kein Sprung.','Nur Vereinsfreigabe, sichere Höhe und freie Landefläche.','Kontaktpunkte bleiben kontrolliert und der Ausstieg ist stabil.','2 technische Durchgänge mit Trainerhilfe','3–4 kontrollierte Durchgänge','4–5 Durchgänge mit ruhigerem Übergang','60–90 Sekunden Pause.','Niedrige Bank nutzen.','Table mit Fußstütze übersteigen.','Freie Variante ohne zusätzliche Geschwindigkeit.','Nur niedrige, direkte betreute Variante.','Step-over sicher beherrschen.','Niedrige Bank.','intermediate','increased','3'),
  ('club-irish-table','en','Practises a controlled club obstacle transition.','Approved table with mats and marked zones.','Wait behind the line and inspect the entry.','Land stable and exit to the side.','Exhale calmly while stepping over.','One step at a time, no jumping.','Use only after club approval with safe height and clear landing.','Contact points stay controlled and the exit is stable.','2 technical turns with coach help','3–4 controlled turns','4–5 turns with a calmer transition','Rest 60–90 seconds.','Use a low bench.','Step over with foot support.','Use the free version without added speed.','Low direct-supervision version only.','Master a safe step-over.','Low bench.','intermediate','increased','3'),
  ('club-weaver','de','Schult versetzte Griff-, Tritt- und Orientierungswechsel.','Weaver mit Matten, Endmarker und freiem Abstieg.','Ersten Kontaktpunkt im Stand sichern.','Am Ende über die vorgesehene Seite absteigen.','Atmung ruhig halten.','Nur einen Kontaktpunkt nach dem anderen lösen.','Direkte Aufsicht und keine ermüdete Nutzung.','Griff und Tritt bleiben vor jedem Wechsel sicher.','2 kurze Abschnitte mit Fußkontakt','3 kontrollierte Abschnitte','4 Abschnitte ohne unnötige Pausen','90 Sekunden Pause.','Niedrige Traverse mit Fußkontakt.','Normale Weaver-Sequenz.','Längere Sequenz nur bei stabiler Technik.','Nicht als freie Kids-Station.','Sicherer Hang und kontrollierter Abstieg.','Niedrige Traverse.','advanced','direct','3'),
  ('club-weaver','en','Trains staggered hand, foot and orientation changes.','Weaver with mats, end marker and clear dismount.','Secure the first contact point from standing.','Dismount on the designated side at the end.','Keep breathing steadily.','Release only one contact point at a time.','Direct supervision and no fatigued attempts.','Grip and foothold are secure before every transfer.','2 short sections with foot support','3 controlled sections','4 sections without unnecessary pauses','Rest 90 seconds.','Low traverse with foot support.','Standard Weaver sequence.','Longer sequence only with stable technique.','Not a free-use kids station.','Secure hang and controlled dismount.','Low traverse.','advanced','direct','3'),
  ('club-rotating-rig-elements','de','Entwickelt Griffkontrolle und Orientierung an rotierenden Elementen.','Geprüfte Elemente, Fallschutz und gesperrte Pendelzone.','Seitlich warten und erst auf Freigabe greifen.','Rotation mitgehen, ohne zusätzlichen Schwung zu erzeugen.','Vor dem Griff ausatmen und nicht pressen.','Langsam und Element für Element.','Direkte Aufsicht; bei Kontrollverlust sofort absteigen.','Der Griff bleibt geschlossen und die Pendelzone frei.','2 einzelne Elemente statisch','3 kurze Übergänge','4 Übergänge mit sicherem Rhythmus','120 Sekunden Pause.','Statischer Ring-Hang.','Ein rotierendes Element.','Mehrere Elemente ohne aktiven Zusatzschwung.','Nicht für freie Kinderbenutzung.','Aktiver Hang und Stoppsignal.','Ring-Hang.','advanced','direct','4'),
  ('club-rotating-rig-elements','en','Develops grip control and orientation on rotating elements.','Inspected elements, fall protection and closed swing zone.','Wait to the side and grip only on clearance.','Follow the rotation without generating extra swing.','Exhale before gripping and do not brace by holding breath.','Move slowly, one element at a time.','Direct supervision; dismount immediately if control is lost.','Grip stays closed and the swing zone remains clear.','2 single elements statically','3 short transitions','4 transitions with a secure rhythm','Rest 120 seconds.','Static ring hang.','One rotating element.','Several elements without added swing.','No free-use kids station.','Active hang and stop signal.','Ring hang.','advanced','direct','4'),
  ('club-multirig-ring-traverse','de','Schult die Ringtraverse im lokalen Multirig.','Ringe, Fallschutz, Richtung und Ein-/Ausstieg markieren.','Ersten Ring aus sicherem Stand greifen.','Ring für Ring mit geschlossenem Griff weiterziehen.','Ruhig atmen und vor jedem Wechsel ausatmen.','Keine hektischen Umgriffe.','Nur freigegebene Ringhöhe und direkte Aufsicht.','Jeder Umgriff wird erst nach sicherem Griff begonnen.','2 Ringe mit Fußentlastung','3–4 Ringe kontrolliert','5–6 Ringe bei stabiler Schulterposition','90–120 Sekunden Pause.','Ring-Hang mit Füßen.','Kurze Ringtraverse.','Längere Traverse ohne Tempozwang.','Nur niedrig und assistiert.','Aktiver Hang und Ringgriff.','Ring-Hang.','advanced','direct','3'),
  ('club-multirig-ring-traverse','en','Practises ring traversal on the local multirig.','Mark rings, fall protection, direction and entry/exit.','Reach the first ring from a secure stance.','Move ring by ring with a closed grip.','Breathe steadily and exhale before each transfer.','Avoid rushed hand changes.','Use only the approved ring height under direct supervision.','Each transfer starts only after the grip is secure.','2 rings with foot support','3–4 rings under control','5–6 rings with stable shoulders','Rest 90–120 seconds.','Ring hang with feet.','Short ring traverse.','Longer traverse without chasing speed.','Low assisted version only.','Active hang and ring grip.','Ring hang.','advanced','direct','3'),
  ('club-incline-wall-traverse','de','Übt sicheren Kontaktwechsel an der lokalen Schrägwand.','Geprüfte Wand, Matten und freie Seitenzone.','Langsam zur markierten Einstiegsseite gehen.','Kontaktpunkte setzen und über die freigegebene Linie steigen.','Ausatmen bei der Gewichtsverlagerung.','Kein Anlauf- oder Absprungtempo.','Wandneigung, Oberfläche und Landung vor jeder Nutzung prüfen.','Hände und Füße bleiben an freigegebenen Kontaktpunkten.','Step-over am Boden','2 niedrige Durchgänge','3–4 kontrollierte Wandübergänge','90 Sekunden Pause.','Niedrige Wand.','Schrägwand mit Fußkontakt.','Längerer Abschnitt ohne Zeitdruck.','Niedrige betreute Version.','Niedriger Wand-Step-over.','Niedrige Wand.','advanced','direct','4'),
  ('club-incline-wall-traverse','en','Practises safe contact changes on the local incline wall.','Inspected wall, mats and clear side zone.','Walk slowly to the marked entry side.','Place contact points and cross the approved line.','Exhale during weight transfer.','No run-up or jump speed.','Check incline, surface and landing before every use.','Hands and feet stay on approved contact points.','Floor-level step-over','2 low turns','3–4 controlled wall transitions','Rest 90 seconds.','Low wall.','Incline wall with foot support.','Longer section without chasing time.','Low supervised version.','Low wall step-over.','Low wall.','advanced','direct','4'),
  ('club-tire-obstacle-transit','de','Verbindet Fußarbeit, Orientierung und kontrolliertes Übersteigen.','Freigegebene Reifen, trockener Untergrund und markierter Ausgang.','Vor dem ersten Reifen stabil stehen.','Letzten Reifen vollständig verlassen und aussteigen.','Ruhig atmen und Blick auf den nächsten Tritt richten.','Ein Reifen nach dem anderen.','Keine Gegenrichtung und keine Sprünge zwischen unsicheren Reifen.','Jeder Fuß landet sichtbar und kontrolliert in der vorgesehenen Zone.','2 Reifen mit Handhilfe','3–5 Reifen kontrolliert','Längere Folge ohne Tempoverlust','45–60 Sekunden Pause.','Bodenmarker.','Niedrige Reifenstation.','Längere Reifenfolge bei sicherem Rhythmus.','Niedrige Reifen mit direkter Aufsicht.','Sicheres Step-over.','Bodenmarker.','intermediate','increased','2'),
  ('club-tire-obstacle-transit','en','Combines footwork, orientation and controlled stepping over.','Approved tires, dry surface and marked exit.','Stand stable before the first tire.','Fully clear the final tire and exit.','Breathe steadily and look toward the next foothold.','Use one tire at a time.','No opposing traffic and no jumps between uncertain tires.','Each foot lands visibly and under control in the intended zone.','2 tires with hand support','3–5 tires under control','Longer sequence without losing rhythm','Rest 45–60 seconds.','Floor markers.','Low tire station.','Longer tire sequence with a secure rhythm.','Low tires with direct supervision.','Safe step-over.','Floor markers.','intermediate','increased','2')
) AS v(seed_key,locale,purpose,setup,start_position,finish_reset,breathing,tempo,safety,quality,beginner,standard,advanced,workrest,level1,level2,level3,youth,prereq,fallback,difficulty,supervision,capacity) ON e.seed_key=v.seed_key;

INSERT INTO exercise_execution_steps (exercise_id,locale,step_order,instruction)
SELECT e.id,v.locale,v.step_order,v.instruction FROM exercises e JOIN (VALUES
  ('club-irish-table','de',1,'Warteposition, Hindernis und Landefläche prüfen.'),('club-irish-table','de',2,'Kontaktpunkte setzen und kontrolliert übersteigen.'),('club-irish-table','de',3,'Stabil landen, seitlich aussteigen und Bahn freigeben.'),
  ('club-irish-table','en',1,'Check the waiting position, obstacle and landing area.'),('club-irish-table','en',2,'Set contact points and step over under control.'),('club-irish-table','en',3,'Land stable, exit to the side and clear the lane.'),
  ('club-weaver','de',1,'Ersten Griff und Tritt aus sicherem Stand sichern.'),('club-weaver','de',2,'Kontaktpunkt für Kontaktpunkt durch den Weaver bewegen.'),('club-weaver','de',3,'Am Endmarker kontrolliert absteigen.'),
  ('club-weaver','en',1,'Secure the first grip and foothold from standing.'),('club-weaver','en',2,'Move through the Weaver one contact at a time.'),('club-weaver','en',3,'Dismount under control at the end marker.'),
  ('club-rotating-rig-elements','de',1,'Rotation und freie Pendelzone prüfen.'),('club-rotating-rig-elements','de',2,'Ein Element greifen und die Bewegung kontrolliert mitgehen.'),('club-rotating-rig-elements','de',3,'Am markierten Ausgang mit Bodenkontakt lösen.'),
  ('club-rotating-rig-elements','en',1,'Check rotation and the clear swing zone.'),('club-rotating-rig-elements','en',2,'Grip one element and follow the movement under control.'),('club-rotating-rig-elements','en',3,'Release at the marked exit with ground contact.'),
  ('club-multirig-ring-traverse','de',1,'Ersten Ring aus sicherem Stand greifen.'),('club-multirig-ring-traverse','de',2,'Ring für Ring mit geschlossenem Griff weiterziehen.'),('club-multirig-ring-traverse','de',3,'Am Ausgang stabil aufsetzen und seitlich aussteigen.'),
  ('club-multirig-ring-traverse','en',1,'Reach the first ring from a secure stance.'),('club-multirig-ring-traverse','en',2,'Move ring by ring with a closed grip.'),('club-multirig-ring-traverse','en',3,'Place the feet safely at the exit and move aside.'),
  ('club-incline-wall-traverse','de',1,'Oberfläche, Neigung und Landefläche prüfen.'),('club-incline-wall-traverse','de',2,'Kontaktpunkte einzeln setzen und die Linie überwinden.'),('club-incline-wall-traverse','de',3,'Stabilisieren, absteigen und Ausstieg freigeben.'),
  ('club-incline-wall-traverse','en',1,'Check the surface, incline and landing area.'),('club-incline-wall-traverse','en',2,'Place contact points one at a time and cross the line.'),('club-incline-wall-traverse','en',3,'Stabilise, dismount and clear the exit.'),
  ('club-tire-obstacle-transit','de',1,'Reifenlage und nächste Trittfläche prüfen.'),('club-tire-obstacle-transit','de',2,'Einen Reifen nach dem anderen kontrolliert betreten oder übersteigen.'),('club-tire-obstacle-transit','de',3,'Letzten Reifen verlassen, stabilisieren und aussteigen.'),
  ('club-tire-obstacle-transit','en',1,'Check tire placement and the next foothold.'),('club-tire-obstacle-transit','en',2,'Enter or step over one tire at a time under control.'),('club-tire-obstacle-transit','en',3,'Clear the last tire, stabilise and exit.')
) AS v(seed_key,locale,step_order,instruction) ON e.seed_key=v.seed_key;

INSERT INTO exercise_coaching_cues (exercise_id,locale,cue_order,cue)
SELECT e.id,v.locale,v.cue_order,v.cue FROM exercises e JOIN (VALUES
  ('club-irish-table','de',1,'Kontakt vor Tempo'),('club-irish-table','de',2,'Seitlich aussteigen'),('club-irish-table','en',1,'Contact before speed'),('club-irish-table','en',2,'Exit to the side'),
  ('club-weaver','de',1,'Ein Kontaktpunkt pro Wechsel'),('club-weaver','de',2,'Abstieg vorbereiten'),('club-weaver','en',1,'One contact per transfer'),('club-weaver','en',2,'Prepare the dismount'),
  ('club-rotating-rig-elements','de',1,'Rotation nicht verstärken'),('club-rotating-rig-elements','de',2,'Stoppsignal beachten'),('club-rotating-rig-elements','en',1,'Do not add swing'),('club-rotating-rig-elements','en',2,'Respect the stop signal'),
  ('club-multirig-ring-traverse','de',1,'Griff schließen'),('club-multirig-ring-traverse','de',2,'Schulter ruhig halten'),('club-multirig-ring-traverse','en',1,'Close the grip'),('club-multirig-ring-traverse','en',2,'Keep the shoulder quiet'),
  ('club-incline-wall-traverse','de',1,'Füße und Hände einzeln'),('club-incline-wall-traverse','de',2,'Nicht abspringen'),('club-incline-wall-traverse','en',1,'Place feet and hands singly'),('club-incline-wall-traverse','en',2,'Do not jump down'),
  ('club-tire-obstacle-transit','de',1,'Nächsten Tritt sehen'),('club-tire-obstacle-transit','de',2,'Reifen vollständig verlassen'),('club-tire-obstacle-transit','en',1,'See the next foothold'),('club-tire-obstacle-transit','en',2,'Fully clear each tire')
) AS v(seed_key,locale,cue_order,cue) ON e.seed_key=v.seed_key;

INSERT INTO exercise_common_mistakes (exercise_id,locale,mistake_order,mistake,correction)
SELECT e.id,v.locale,1,v.mistake,v.correction FROM exercises e JOIN (VALUES
  ('club-irish-table','de','Der Table wird mit Schwung oder ohne freie Landefläche angegangen.','Zur Wartezone zurückkehren und Schrittfolge mit Trainerfreigabe wiederholen.'),('club-irish-table','en','The table is approached with momentum or without a clear landing area.','Return to the waiting zone and repeat the steps after coach clearance.'),
  ('club-weaver','de','Mehrere Kontaktpunkte werden gleichzeitig gelöst.','Auf den letzten sicheren Griff zurückgehen und nur einen Punkt wechseln.'),('club-weaver','en','Several contact points are released at once.','Return to the last secure grip and move only one contact at a time.'),
  ('club-rotating-rig-elements','de','Zusätzlicher Schwung wird aktiv erzeugt.','Absteigen, Zone prüfen und mit statischem Hang regressieren.'),('club-rotating-rig-elements','en','Additional swing is actively generated.','Dismount, recheck the zone and regress to a static hang.'),
  ('club-multirig-ring-traverse','de','Der nächste Ring wird vor geschlossenem Griff belastet.','Griff schließen, Schulterposition prüfen und erst dann weiterziehen.'),('club-multirig-ring-traverse','en','The next ring is loaded before the grip closes.','Close the grip, check the shoulder position and then transfer.'),
  ('club-incline-wall-traverse','de','Der Ausstieg wird übersprungen oder die Landefläche nicht geprüft.','Kontaktpunkte verkürzen und über die markierte Ausstiegsseite absteigen.'),('club-incline-wall-traverse','en','The exit is jumped or the landing area is not checked.','Shorten the contact sequence and dismount on the marked exit side.'),
  ('club-tire-obstacle-transit','de','Der Fuß landet auf einer unsicheren Reifen- oder Zwischenfläche.','Tempo reduzieren und nur freigegebene Trittflächen verwenden.'),('club-tire-obstacle-transit','en','The foot lands on an unstable tire or gap.','Reduce speed and use only approved footholds.')
) AS v(seed_key,locale,mistake,correction) ON e.seed_key=v.seed_key;

INSERT INTO exercise_seed_quality_reviews (exercise_id,review_version,review_status,notes)
SELECT e.id,'2026-09-ocrfra-club-pack-v1','passed','OCRFRA club obstacle pack; dimensions and local availability remain subject to club confirmation.'
FROM exercises e WHERE e.seed_key IN ('club-irish-table','club-weaver','club-rotating-rig-elements','club-multirig-ring-traverse','club-incline-wall-traverse','club-tire-obstacle-transit');

INSERT INTO search_documents_de (document_id,entity_type,entity_id,title,aliases,summary,tags,body_regions,equipment,instructions)
SELECT 'exercise:' || e.id::VARCHAR,'exercise',e.id::VARCHAR,t.name,COALESCE((SELECT string_agg(a.alias,' ') FROM exercise_aliases a WHERE a.exercise_id=e.id AND a.locale='de'),''),t.summary,
  COALESCE((SELECT string_agg(tag.tag_id,' ') FROM exercise_tags tag WHERE tag.exercise_id=e.id),''),COALESCE((SELECT string_agg(b.body_region_id,' ') FROM exercise_body_regions b WHERE b.exercise_id=e.id),''),COALESCE((SELECT string_agg(q.seed_key,' ') FROM exercise_equipment x JOIN equipment q ON q.id=x.equipment_id WHERE x.exercise_id=e.id),''),COALESCE((SELECT string_agg(s.instruction,' ' ORDER BY s.step_order) FROM exercise_execution_steps s WHERE s.exercise_id=e.id AND s.locale='de'),'')
FROM exercises e JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='de' WHERE e.seed_key LIKE 'club-%';

INSERT INTO search_documents_en (document_id,entity_type,entity_id,title,aliases,summary,tags,body_regions,equipment,instructions)
SELECT 'exercise:' || e.id::VARCHAR,'exercise',e.id::VARCHAR,t.name,COALESCE((SELECT string_agg(a.alias,' ') FROM exercise_aliases a WHERE a.exercise_id=e.id AND a.locale='en'),''),t.summary,
  COALESCE((SELECT string_agg(tag.tag_id,' ') FROM exercise_tags tag WHERE tag.exercise_id=e.id),''),COALESCE((SELECT string_agg(b.body_region_id,' ') FROM exercise_body_regions b WHERE b.exercise_id=e.id),''),COALESCE((SELECT string_agg(q.seed_key,' ') FROM exercise_equipment x JOIN equipment q ON q.id=x.equipment_id WHERE x.exercise_id=e.id),''),COALESCE((SELECT string_agg(s.instruction,' ' ORDER BY s.step_order) FROM exercise_execution_steps s WHERE s.exercise_id=e.id AND s.locale='en'),'')
FROM exercises e JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='en' WHERE e.seed_key LIKE 'club-%';

UPDATE search_index_state SET status='dirty',last_error=NULL WHERE locale IN ('de','en');
INSERT INTO schema_migrations(version,name) VALUES (79,'ocrfra_club_obstacle_pack');
COMMIT;
