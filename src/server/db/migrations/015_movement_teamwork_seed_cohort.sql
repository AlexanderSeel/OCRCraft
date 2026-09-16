BEGIN TRANSACTION;

INSERT INTO exercises (seed_key,canonical_name,category,default_phase,risk_level,min_age,indoor,outdoor)
SELECT v.seed_key,v.name_en,v.category,v.default_phase,'low',v.min_age,true,true
FROM (VALUES
  ('partner-mirror-movement','Partner-Spiegelbewegung','Partner Mirror Movement','warmup','warmup',6),
  ('cooperative-cone-collect','Kooperatives Hütchensammeln','Cooperative Cone Collect','warmup','warmup',6),
  ('quiet-landing-practice','Leise Landung üben','Quiet Landing Practice','balance-agility','main',8)
) AS v(seed_key,name_de,name_en,category,default_phase,min_age)
WHERE NOT EXISTS (SELECT 1 FROM exercises e WHERE e.seed_key=v.seed_key);

UPDATE exercises SET
  exercise_type=CASE seed_key WHEN 'partner-mirror-movement' THEN 'game' WHEN 'cooperative-cone-collect' THEN 'game' ELSE 'skill' END,
  difficulty='beginner',impact_level=CASE seed_key WHEN 'quiet-landing-practice' THEN 'moderate' ELSE 'low' END,
  coordination_complexity=CASE seed_key WHEN 'partner-mirror-movement' THEN 'moderate' WHEN 'cooperative-cone-collect' THEN 'moderate' ELSE 'simple' END,
  progression_required=false,space_requirement=CASE seed_key WHEN 'cooperative-cone-collect' THEN 'medium' WHEN 'quiet-landing-practice' THEN 'small' ELSE 'medium' END,
  supports_reps=true,supports_seconds=true,supports_minutes=false,supports_metres=false,supports_rounds=true,supports_attempts=true,
  setup_seconds=CASE seed_key WHEN 'cooperative-cone-collect' THEN 90 ELSE 45 END,
  transition_seconds=20,station_capacity=CASE seed_key WHEN 'quiet-landing-practice' THEN 1 ELSE 8 END,
  suitable_for_kids=true,suitable_for_youth=true,suitable_for_adults=true,
  supervision=CASE seed_key WHEN 'quiet-landing-practice' THEN 'increased' ELSE 'normal' END,
  indoor_suitable=true,outdoor_suitable=true
WHERE seed_key IN ('partner-mirror-movement','cooperative-cone-collect','quiet-landing-practice');

INSERT INTO exercise_translations (exercise_id,locale,name,summary)
SELECT e.id,v.locale,v.name,v.summary FROM exercises e JOIN (VALUES
  ('partner-mirror-movement','de','Partner-Spiegelbewegung','Zwei Personen spiegeln langsame Schritte und Richtungswechsel, um Aufmerksamkeit, Gleichgewicht und abgestimmte Bewegung zu üben.'),
  ('partner-mirror-movement','en','Partner Mirror Movement','Two people mirror slow steps and direction changes to practise attention, balance and coordinated movement.'),
  ('cooperative-cone-collect','de','Kooperatives Hütchensammeln','Ein Team sammelt Hütchen nacheinander über getrennte Laufwege und löst die Aufgabe gemeinsam ohne Wettlauf.'),
  ('cooperative-cone-collect','en','Cooperative Cone Collect','A team collects cones one at a time along separate lanes and completes the task together without racing.'),
  ('quiet-landing-practice','de','Leise Landung üben','Kurze, niedrige Sprünge mit stabiler und leiser Landung schulen die Kontrolle beim Abbremsen.'),
  ('quiet-landing-practice','en','Quiet Landing Practice','Short, low jumps with stable and quiet landings practise control while decelerating.')
) AS v(seed_key,locale,name,summary) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO exercise_aliases (exercise_id,locale,alias)
SELECT e.id,v.locale,v.alias FROM exercises e JOIN (VALUES
  ('partner-mirror-movement','de','Spiegelspiel zu zweit'),('partner-mirror-movement','de','Partner Mirror Movement'),
  ('partner-mirror-movement','en','Partner-Spiegelbewegung'),('partner-mirror-movement','en','Partner-Spiegelübung'),('partner-mirror-movement','en','Mirroring game'),
  ('cooperative-cone-collect','de','Hütchen-Teamspiel'),('cooperative-cone-collect','de','Cooperative Cone Collect'),
  ('cooperative-cone-collect','en','Team cone game'),('cooperative-cone-collect','en','Kooperatives Hütchensammeln'),
  ('quiet-landing-practice','de','Landeschule'),('quiet-landing-practice','de','Quiet Landing Practice'),
  ('quiet-landing-practice','en','Landing mechanics drill'),('quiet-landing-practice','en','Leise Landung üben')
) AS v(seed_key,locale,alias) ON e.seed_key=v.seed_key;

INSERT INTO exercise_body_regions (exercise_id,body_region_id,emphasis)
SELECT e.id,v.body_region_id,v.emphasis FROM exercises e JOIN (VALUES
  ('partner-mirror-movement','full-body','primary'),('partner-mirror-movement','ankles-feet','secondary'),
  ('cooperative-cone-collect','full-body','primary'),('cooperative-cone-collect','calves','secondary'),
  ('quiet-landing-practice','quadriceps','primary'),('quiet-landing-practice','glutes','primary'),
  ('quiet-landing-practice','calves','secondary'),('quiet-landing-practice','ankles-feet','secondary')
) AS v(seed_key,body_region_id,emphasis) ON e.seed_key=v.seed_key;

INSERT INTO exercise_movement_patterns (exercise_id,movement_pattern_id)
SELECT e.id,v.movement_pattern_id FROM exercises e JOIN (VALUES
  ('partner-mirror-movement','agility'),('partner-mirror-movement','balance'),
  ('cooperative-cone-collect','run'),('cooperative-cone-collect','agility'),
  ('quiet-landing-practice','jump'),('quiet-landing-practice','land'),('quiet-landing-practice','balance')
) AS v(seed_key,movement_pattern_id) ON e.seed_key=v.seed_key;

INSERT INTO exercise_tags (exercise_id,tag_id)
SELECT e.id,v.tag_id FROM exercises e JOIN (VALUES
  ('partner-mirror-movement','warmup'),('partner-mirror-movement','coordination'),('partner-mirror-movement','team'),('partner-mirror-movement','kids'),
  ('cooperative-cone-collect','warmup'),('cooperative-cone-collect','coordination'),('cooperative-cone-collect','team'),('cooperative-cone-collect','kids'),
  ('quiet-landing-practice','technique'),('quiet-landing-practice','balance'),('quiet-landing-practice','low-impact'),('quiet-landing-practice','kids')
) AS v(seed_key,tag_id) ON e.seed_key=v.seed_key;

INSERT INTO exercise_equipment (exercise_id,equipment_id,quantity_required)
SELECT e.id,q.id,6 FROM exercises e JOIN equipment q ON q.seed_key='cones'
WHERE e.seed_key='cooperative-cone-collect';

INSERT INTO exercise_details (
  exercise_id,locale,purpose,setup,start_position,finish_reset,breathing_cue,tempo_cue,safety_notes,
  quality_criteria,beginner_prescription,standard_prescription,advanced_prescription,work_rest_guidance,
  level_1,level_2,level_3,child_youth_variant,prerequisites,fallback_exercise,difficulty,supervision,
  space_requirement,setup_seconds,transition_seconds,station_capacity
)
SELECT e.id,v.locale,v.purpose,v.setup,v.start_position,v.finish_reset,v.breathing_cue,v.tempo_cue,v.safety_notes,
  v.quality_criteria,v.beginner_prescription,v.standard_prescription,v.advanced_prescription,v.work_rest_guidance,
  v.level_1,v.level_2,v.level_3,v.child_youth_variant,v.prerequisites,v.fallback_exercise,
  'beginner',CASE WHEN e.seed_key='quiet-landing-practice' THEN 'increased' ELSE 'normal' END,
  e.space_requirement,e.setup_seconds,e.transition_seconds,e.station_capacity
FROM exercises e JOIN (VALUES
  ('partner-mirror-movement','de','Schult Reaktion, Gleichgewicht und nonverbale Abstimmung bei niedriger Belastung.','Markiere zwei parallele, ebene Bewegungsfelder mit genügend Abstand; erkläre, dass nur eine Person führt und kein Körperkontakt nötig ist.','Stellt euch einander gegenüber, mit weichen Knien und einem freien Schritt Abstand zur Feldgrenze.','Stoppt auf das vereinbarte Signal, tretet zurück und wechselt die führende Person.','Atmet ruhig weiter und sprecht bei Bedarf das Tempo ab.','Die führende Person bewegt sich langsam; die spiegelnde Person bleibt mindestens einen Schritt entfernt.','Keine schnellen Ausfallschritte oder überraschenden Sprints; Boden trocken halten und bei Gedränge stoppen.','Beide bleiben im markierten Feld, sehen den Bewegungsweg und können jederzeit kontrolliert anhalten.','2 x 20 Sekunden mit wenigen Seit- und Vorwärtsschritten.','3 x 30 Sekunden; nach jeder Runde Führung wechseln.','4 x 40 Sekunden mit angekündigten Tempo- und Richtungswechseln.','Zwischen Runden 30 Sekunden pausieren; Gespräche und sichere Kontrolle haben Vorrang.','Nur Schritte am Platz und eine Richtung spiegeln.','Langsame Schritte vor, zurück und seitwärts spiegeln.','Die führende Person ergänzt ruhige Vierteldrehungen und wechselt das Tempo leicht.','Kurze Runden mit vertrauter Partnerperson; Schrittweite klein halten und Erfolg statt Geschwindigkeit betonen.','Eine Schrittbewegung sicher ausführen und auf ein Stoppsignal reagieren können.','Einzelne Schrittfolgen auf Bodenmarkierungen nachmachen.'),
  ('partner-mirror-movement','en','Builds reaction, balance and non-verbal coordination at low effort.','Mark two parallel, level movement areas with enough separation; explain that one person leads and touching is not needed.','Face each other with soft knees and at least one step of space from the edge of the area.','Stop on the agreed signal, step back and change the leader.','Keep breathing calmly and agree on the pace when needed.','The leader moves slowly; the partner stays at least one step away.','Avoid quick lunges or surprise sprints; use a dry floor and stop if the area becomes crowded.','Both stay inside their marked areas, watch the movement path and can stop under control at any time.','2 x 20 seconds with a few side and forward steps.','3 x 30 seconds; change leader after each round.','4 x 40 seconds with announced pace and direction changes.','Rest 30 seconds between rounds; conversation and safe control come before speed.','Use steps in place and mirror one direction only.','Mirror slow forward, backward and side steps.','Add calm quarter turns and slight pace changes as leader.','Use short rounds with a familiar partner; keep steps small and reward success rather than speed.','Able to step safely and respond to a stop signal.','Copy a short sequence of steps on floor markers.'),
  ('cooperative-cone-collect','de','Verbindet lockere Fortbewegung, Orientierung und Teamabsprachen in einer kooperativen Aufgabe.','Stelle sechs Hütchen in eine Sammelzone und markiere zwei getrennte, hindernisfreie Laufwege mit je einer Ablagezone.','Die Gruppe steht hinter der Startlinie; pro Laufweg startet höchstens eine Person und die nächste wartet auf freie Bahn.','Nach jeder Runde Hütchen sicher in die Teamablage legen, zurückgehen und den nächsten Start freigeben.','Atmet gleichmäßig; niemand muss sprinten oder die Luft anhalten.','Lauft oder geht in kontrolliertem Tempo, wendet mit mehreren kleinen Schritten und kehrt gehend zurück.','Laufwege kreuzen sich nicht; keine Hütchen werfen; bei Zusammenstoßgefahr sofort stoppen und neu ordnen.','Alle Hütchen werden ohne Kollision gesammelt, die Wege bleiben frei und das Team beendet die Aufgabe gemeinsam.','2 Minuten mit Gehen und drei Hütchen.','3 Minuten; alle sechs Hütchen nacheinander sammeln und gemeinsam zählen.','4 Minuten mit vereinbarter Zusatzaufgabe wie Rückwärtsgehen nur auf markiertem, freiem Abschnitt.','Nach jeweils 60 Sekunden kurz sammeln; das Teamtempo richtet sich nach der langsamsten Person.','Nur vier Hütchen direkt neben der Startlinie sammeln.','Zwei getrennte Wege mit sechs Hütchen im lockeren Lauftempo nutzen.','Zusätzlich nach Farben sortieren oder eine ruhige Bewegungsart vorgeben.','Kurze Wege und leicht erreichbare Hütchen; gemeinsam zählen, ohne Ausscheiden oder Zeitdruck.','Auf ein Start-/Stoppsignal reagieren und einen freien Laufweg erkennen können.','Hütchen in getrennten Gehwegen einzeln einsammeln.'),
  ('cooperative-cone-collect','en','Combines easy locomotion, orientation and team communication in a cooperative task.','Place six cones in a collection area and mark two separate, obstacle-free lanes with one drop-off area each.','The group waits behind the start line; at most one person uses each lane and the next person waits until it is clear.','After each turn, place the cone safely in the team area, walk back and release the next start.','Breathe steadily; nobody needs to sprint or hold their breath.','Move at a controlled jog or walk, turn with several small steps and walk back.','Lanes must not cross; never throw cones; stop and reset if there is a collision risk.','All cones are collected without collision, lanes stay clear and the team completes the task together.','2 minutes walking and collecting three cones.','3 minutes; collect all six cones one at a time and count them together.','4 minutes with an agreed extra task such as backward walking only on a marked, clear section.','Regroup every 60 seconds; set the team pace by the slowest participant.','Collect only four cones placed beside the start line.','Use two separate lanes and collect six cones at an easy jog.','Add colour sorting or assign a calm movement pattern.','Use short lanes and easy-to-reach cones; count together without elimination or time pressure.','Able to respond to a start/stop signal and identify a clear lane.','Collect cones one at a time by walking in separated lanes.'),
  ('quiet-landing-practice','de','Übt das Abbremsen nach einem sehr niedrigen beidbeinigen Sprung und stärkt die Wahrnehmung für stabile Landungen.','Nutze ebenen, rutschfesten Boden und markiere pro Person eine freie Landefläche; keine Boxen oder erhöhten Absprünge verwenden.','Stehe hüftbreit, Knie locker, Arme entspannt und Blick nach vorn; beginne mit einem kleinen federnden Kniebeugenimpuls.','Halte die Landeposition zwei Sekunden, richte dich auf und setze für die nächste Wiederholung neu an.','Atme beim kleinen Absprung aus und lande mit weiterlaufender ruhiger Atmung.','Springe nur wenige Zentimeter; lande weich und halte stabil, statt Wiederholungen schnell aneinanderzureihen.','Nur niedrige Sprünge auf geeignetem Boden; bei Schmerz, Unsicherheit oder lauter unkontrollierter Landung auf Schrittvariante wechseln.','Beide Füße landen leise und gleichzeitig, Knie folgen den Fußspitzen und der Rumpf bleibt kontrolliert.','2 x 4 kleine Sprünge mit jeweils zwei Sekunden Halten.','3 x 5 Sprünge; jede Landung einzeln kontrollieren.','3 x 6 Sprünge mit leicht variierter, angekündigter Fußstellung; keine Höhe hinzufügen.','Zwischen Wiederholungen kurz lösen und 45 Sekunden zwischen Sätzen pausieren.','Ohne Sprung in eine Viertelkniebeuge gehen und stabil halten.','Kleiner beidbeiniger Sprung am Platz mit stabiler Landung.','Die Sprungweite geringfügig nach vorn variieren, ohne Höhe oder Tempo zu steigern.','Nur wenn die Bewegung sicher gelingt: kleine Sprünge, viele Pausen und keine Wettkampfwertung.','Schmerzfreies beidbeiniges Stehen und kontrolliertes Beugen der Knie.','Zügig auf die Zehenspitzen steigen und kontrolliert in eine Viertelkniebeuge sinken.'),
  ('quiet-landing-practice','en','Practises deceleration after a very low two-foot jump and builds awareness of stable landings.','Use level, non-slip flooring and mark a clear landing area for each person; do not use boxes or raised take-offs.','Stand hip-width with soft knees, relaxed arms and eyes forward; begin with a small knee bend.','Hold the landing for two seconds, stand tall and reset before the next repetition.','Exhale during the small take-off and keep breathing calmly through the landing.','Jump only a few centimetres; land softly and hold steady instead of linking repetitions quickly.','Use only low jumps on a suitable surface; switch to a step version for pain, uncertainty or a loud uncontrolled landing.','Both feet land quietly together, knees track toward the toes and the trunk stays controlled.','2 x 4 small jumps, holding each landing for two seconds.','3 x 5 jumps; control each landing separately.','3 x 6 jumps with a small announced change in foot position; do not add height.','Reset briefly between repetitions and rest 45 seconds between sets.','Step into a quarter squat without jumping and hold steady.','Use a small two-foot jump in place and land under control.','Vary the jump distance slightly forward without increasing height or speed.','Only when movement is safe: small jumps, frequent rests and no competitive scoring.','Pain-free two-foot standing and controlled knee bending.','Rise quickly onto the toes and lower into a quarter squat under control.')
) AS v(seed_key,locale,purpose,setup,start_position,finish_reset,breathing_cue,tempo_cue,safety_notes,quality_criteria,beginner_prescription,standard_prescription,advanced_prescription,work_rest_guidance,level_1,level_2,level_3,child_youth_variant,prerequisites,fallback_exercise)
ON e.seed_key=v.seed_key;

INSERT INTO exercise_execution_steps (exercise_id,locale,step_order,instruction)
SELECT e.id,v.locale,v.step_order,v.instruction FROM exercises e JOIN (VALUES
  ('partner-mirror-movement','de',1,'Stellt euch mit genügend Abstand in die markierten Felder und bestimmt die führende Person.'),('partner-mirror-movement','de',2,'Spiegelt langsame Schritte und angekündigte Richtungswechsel, ohne euch zu berühren.'),('partner-mirror-movement','de',3,'Stoppt gemeinsam auf Signal und wechselt anschließend die Führung.'),
  ('partner-mirror-movement','en',1,'Stand with enough space in the marked areas and choose who leads first.'),('partner-mirror-movement','en',2,'Mirror slow steps and announced direction changes without touching.'),('partner-mirror-movement','en',3,'Stop together on the signal, then change the leader.'),
  ('cooperative-cone-collect','de',1,'Prüft freie, getrennte Laufwege und verteilt die Startreihenfolge.'),('cooperative-cone-collect','de',2,'Geht oder lauft kontrolliert zu einem Hütchen und legt es in der Teamzone ab.'),('cooperative-cone-collect','de',3,'Geht auf dem eigenen Weg zurück und startet erst, wenn die Bahn frei ist.'),
  ('cooperative-cone-collect','en',1,'Check that the lanes are clear and separate, then agree on the start order.'),('cooperative-cone-collect','en',2,'Walk or jog under control to one cone and place it in the team area.'),('cooperative-cone-collect','en',3,'Return in your own lane and start again only when it is clear.'),
  ('quiet-landing-practice','de',1,'Prüfe die freie Landefläche und beuge Knie und Hüfte leicht.'),('quiet-landing-practice','de',2,'Springe nur wenige Zentimeter gerade nach oben und lande auf beiden Füßen.'),('quiet-landing-practice','de',3,'Halte die stabile Landung zwei Sekunden und setze neu an.'),
  ('quiet-landing-practice','en',1,'Check the clear landing area and bend the knees and hips slightly.'),('quiet-landing-practice','en',2,'Jump only a few centimetres straight up and land on both feet.'),('quiet-landing-practice','en',3,'Hold the stable landing for two seconds and reset.')
) AS v(seed_key,locale,step_order,instruction) ON e.seed_key=v.seed_key;

INSERT INTO exercise_coaching_cues (exercise_id,locale,cue_order,cue)
SELECT e.id,v.locale,v.cue_order,v.cue FROM exercises e JOIN (VALUES
  ('partner-mirror-movement','de',1,'Kleine Schritte, klarer Abstand'),('partner-mirror-movement','de',2,'Führung ruhig wechseln'),('partner-mirror-movement','en',1,'Small steps, clear space'),('partner-mirror-movement','en',2,'Change leaders calmly'),
  ('cooperative-cone-collect','de',1,'Weg frei? Dann starten'),('cooperative-cone-collect','de',2,'Gemeinsam ans Ziel'),('cooperative-cone-collect','en',1,'Lane clear? Then go'),('cooperative-cone-collect','en',2,'Finish as a team'),
  ('quiet-landing-practice','de',1,'Leise landen'),('quiet-landing-practice','de',2,'Knie zeigen zu den Zehen'),('quiet-landing-practice','en',1,'Land quietly'),('quiet-landing-practice','en',2,'Knees track over toes')
) AS v(seed_key,locale,cue_order,cue) ON e.seed_key=v.seed_key;

INSERT INTO exercise_common_mistakes (exercise_id,locale,mistake_order,mistake,correction)
SELECT e.id,v.locale,v.mistake_order,v.mistake,v.correction FROM exercises e JOIN (VALUES
  ('partner-mirror-movement','de',1,'Die führende Person bewegt sich plötzlich schnell.','Tempo reduzieren und Richtungswechsel vorher ankündigen.'),('partner-mirror-movement','en',1,'The leader moves suddenly fast.','Slow down and announce direction changes first.'),
  ('partner-mirror-movement','de',2,'Beide kommen der Feldgrenze oder einander zu nahe.','Schrittweite verkleinern und die markierten Abstände wiederherstellen.'),('partner-mirror-movement','en',2,'Both move too close to the edge or to each other.','Shorten the steps and restore the marked spacing.'),
  ('cooperative-cone-collect','de',1,'Zwei Personen laufen gleichzeitig in dieselbe Bahn.','Startreihenfolge neu festlegen und erst bei freier Bahn losgehen.'),('cooperative-cone-collect','en',1,'Two people enter the same lane at once.','Reset the order and move only when the lane is clear.'),
  ('cooperative-cone-collect','de',2,'Das Hütchen wird geworfen oder die Wendung erfolgt abrupt.','Hütchen ablegen und die Richtung mit mehreren kleinen Schritten wechseln.'),('cooperative-cone-collect','en',2,'A cone is thrown or the turn is abrupt.','Place the cone down and turn with several small steps.'),
  ('quiet-landing-practice','de',1,'Die Landung ist laut und die Knie kippen nach innen.','Sprunghöhe senken oder auf die Schrittvariante wechseln; Knie über den Füßen halten.'),('quiet-landing-practice','en',1,'The landing is loud and the knees collapse inward.','Lower the jump or use the step version; keep knees aligned over the feet.'),
  ('quiet-landing-practice','de',2,'Die nächste Wiederholung beginnt vor der stabilen Halteposition.','Zwei Sekunden ruhig stehen und erst dann neu abspringen.'),('quiet-landing-practice','en',2,'The next repetition starts before the landing is stable.','Stand quietly for two seconds before jumping again.')
) AS v(seed_key,locale,mistake_order,mistake,correction) ON e.seed_key=v.seed_key;

INSERT INTO search_documents_de (document_id,entity_type,entity_id,title,aliases,summary,tags,body_regions,equipment,instructions)
SELECT 'exercise:' || e.id::VARCHAR,'exercise',e.id::VARCHAR,t.name,
  COALESCE((SELECT string_agg(a.alias,' ') FROM exercise_aliases a WHERE a.exercise_id=e.id AND a.locale='de'),''),t.summary,
  COALESCE((SELECT string_agg(x.tag_id,' ') FROM exercise_tags x WHERE x.exercise_id=e.id),''),
  COALESCE((SELECT string_agg(x.body_region_id,' ') FROM exercise_body_regions x WHERE x.exercise_id=e.id),''),
  COALESCE((SELECT string_agg(eq.name_de,' ') FROM exercise_equipment x JOIN equipment eq ON eq.id=x.equipment_id WHERE x.exercise_id=e.id),''),
  d.purpose || ' ' || d.setup || ' ' || d.start_position || ' ' || d.safety_notes || ' ' || d.quality_criteria || ' ' ||
    COALESCE((SELECT string_agg(x.instruction,' ' ORDER BY x.step_order) FROM exercise_execution_steps x WHERE x.exercise_id=e.id AND x.locale='de'),'')
FROM exercises e JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='de'
JOIN exercise_details d ON d.exercise_id=e.id AND d.locale='de'
WHERE e.seed_key IN ('partner-mirror-movement','cooperative-cone-collect','quiet-landing-practice');

INSERT INTO search_documents_en (document_id,entity_type,entity_id,title,aliases,summary,tags,body_regions,equipment,instructions)
SELECT 'exercise:' || e.id::VARCHAR,'exercise',e.id::VARCHAR,t.name,
  COALESCE((SELECT string_agg(a.alias,' ') FROM exercise_aliases a WHERE a.exercise_id=e.id AND a.locale='en'),''),t.summary,
  COALESCE((SELECT string_agg(x.tag_id,' ') FROM exercise_tags x WHERE x.exercise_id=e.id),''),
  COALESCE((SELECT string_agg(x.body_region_id,' ') FROM exercise_body_regions x WHERE x.exercise_id=e.id),''),
  COALESCE((SELECT string_agg(COALESCE(eq.name_en,eq.name_de),' ') FROM exercise_equipment x JOIN equipment eq ON eq.id=x.equipment_id WHERE x.exercise_id=e.id),''),
  d.purpose || ' ' || d.setup || ' ' || d.start_position || ' ' || d.safety_notes || ' ' || d.quality_criteria || ' ' ||
    COALESCE((SELECT string_agg(x.instruction,' ' ORDER BY x.step_order) FROM exercise_execution_steps x WHERE x.exercise_id=e.id AND x.locale='en'),'')
FROM exercises e JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='en'
JOIN exercise_details d ON d.exercise_id=e.id AND d.locale='en'
WHERE e.seed_key IN ('partner-mirror-movement','cooperative-cone-collect','quiet-landing-practice');

UPDATE search_index_state SET status='dirty',last_error=NULL WHERE locale IN ('de','en');
INSERT INTO schema_migrations (version,name) VALUES (15,'movement_teamwork_seed_cohort');
COMMIT;
