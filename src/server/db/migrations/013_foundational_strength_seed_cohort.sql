BEGIN TRANSACTION;

INSERT INTO exercises (seed_key, canonical_name, category, default_phase, risk_level, min_age, indoor, outdoor)
SELECT v.seed_key, v.name_en, v.category, 'main', 'low', v.min_age, true, true
FROM (VALUES
  ('wall-pushup','Wandliegestütz','Wall Push-up','strength',6),
  ('chair-sit-to-stand','Aufstehen vom Stuhl','Chair Sit-to-Stand','strength',6),
  ('double-leg-calf-raise','Beidbeiniger Fersenheber','Double-Leg Calf Raise','strength',6),
  ('supported-single-leg-hinge','Einbeinige Hüftbeuge mit Halt','Supported Single-Leg Hip Hinge','strength',10),
  ('band-anti-rotation-press','Band Anti-Rotation Press','Band Anti-Rotation Press','core',10)
) AS v(seed_key,name_de,name_en,category,min_age)
WHERE NOT EXISTS (SELECT 1 FROM exercises e WHERE e.seed_key=v.seed_key);

UPDATE exercises SET
  exercise_type='strength', difficulty='beginner', impact_level='low', coordination_complexity='moderate',
  progression_required=false, space_requirement='small', supports_reps=true, supports_seconds=false,
  supports_minutes=false, supports_metres=false, supports_rounds=true, supports_attempts=false,
  setup_seconds=45, transition_seconds=20, station_capacity=4, suitable_for_kids=true,
  suitable_for_youth=true, suitable_for_adults=true, supervision='normal', indoor_suitable=true,
  outdoor_suitable=true
WHERE seed_key IN ('wall-pushup','chair-sit-to-stand','double-leg-calf-raise','supported-single-leg-hinge','band-anti-rotation-press');

INSERT INTO exercise_translations (exercise_id,locale,name,summary)
SELECT e.id,v.locale,v.name,v.summary
FROM exercises e JOIN (VALUES
  ('wall-pushup','de','Wandliegestütz','Drücke dich mit den Händen an einer stabilen Wand kontrolliert von der Wand weg und zurück.'),
  ('wall-pushup','en','Wall Push-up','Press away from a stable wall with control, then return.'),
  ('chair-sit-to-stand','de','Aufstehen vom Stuhl','Stehe von einer stabilen Sitzfläche auf und setze dich langsam wieder hin.'),
  ('chair-sit-to-stand','en','Chair Sit-to-Stand','Stand up from a stable seat and sit back down slowly.'),
  ('double-leg-calf-raise','de','Beidbeiniger Fersenheber','Hebe beide Fersen im Stand an und senke sie langsam wieder ab.'),
  ('double-leg-calf-raise','en','Double-Leg Calf Raise','Rise onto both feet in standing and lower the heels slowly.'),
  ('supported-single-leg-hinge','de','Einbeinige Hüftbeuge mit Halt','Beuge dich mit einer Hand an der Wand aus der Hüfte nach vorn und führe ein Bein nach hinten.'),
  ('supported-single-leg-hinge','en','Supported Single-Leg Hip Hinge','Hinge forward from the hips with one hand supported and move the other leg back.'),
  ('band-anti-rotation-press','de','Band Anti-Rotation Press','Drücke ein seitlich befestigtes Band vor dem Oberkörper nach vorn, ohne dich mitzudrehen.'),
  ('band-anti-rotation-press','en','Band Anti-Rotation Press','Press a band anchored to the side straight ahead without rotating your trunk.')
) AS v(seed_key,locale,name,summary) ON e.seed_key=v.seed_key;

INSERT INTO exercise_aliases (exercise_id,locale,alias)
SELECT e.id,v.locale,v.alias
FROM exercises e JOIN (VALUES
  ('wall-pushup','de','Liegestütz an der Wand'),('wall-pushup','en','Wall press-up'),
  ('chair-sit-to-stand','de','Stuhl-Kniebeuge'),('chair-sit-to-stand','en','Chair squat'),
  ('double-leg-calf-raise','de','Wadenheben'),('double-leg-calf-raise','en','Standing calf raise'),
  ('supported-single-leg-hinge','de','Einbeiniger Hip Hinge'),('supported-single-leg-hinge','en','Supported single-leg deadlift'),
  ('band-anti-rotation-press','de','Pallof Press'),('band-anti-rotation-press','en','Pallof press')
) AS v(seed_key,locale,alias) ON e.seed_key=v.seed_key;

INSERT INTO exercise_body_regions (exercise_id,body_region_id,emphasis)
SELECT e.id,v.body_region_id,v.emphasis
FROM exercises e JOIN (VALUES
  ('wall-pushup','chest','primary'),('wall-pushup','shoulders','secondary'),('wall-pushup','upper-arms','secondary'),
  ('chair-sit-to-stand','quadriceps','primary'),('chair-sit-to-stand','glutes','primary'),('chair-sit-to-stand','core','secondary'),
  ('double-leg-calf-raise','calves','primary'),('double-leg-calf-raise','ankles-feet','secondary'),
  ('supported-single-leg-hinge','glutes','primary'),('supported-single-leg-hinge','hamstrings','primary'),('supported-single-leg-hinge','core','secondary'),
  ('band-anti-rotation-press','obliques','primary'),('band-anti-rotation-press','core','primary'),('band-anti-rotation-press','shoulders','secondary')
) AS v(seed_key,body_region_id,emphasis) ON e.seed_key=v.seed_key;

INSERT INTO movement_patterns (id,label_de,label_en)
SELECT 'sit-to-stand','Aufstehen und Hinsetzen','Sit to Stand'
WHERE NOT EXISTS (SELECT 1 FROM movement_patterns WHERE id='sit-to-stand');

INSERT INTO exercise_movement_patterns (exercise_id,movement_pattern_id)
SELECT e.id,v.movement_pattern_id
FROM exercises e JOIN (VALUES
  ('wall-pushup','push'),('chair-sit-to-stand','squat'),('chair-sit-to-stand','sit-to-stand'),
  ('double-leg-calf-raise','balance'),('supported-single-leg-hinge','hinge'),('supported-single-leg-hinge','balance'),
  ('band-anti-rotation-press','rotate'),('band-anti-rotation-press','brace')
) AS v(seed_key,movement_pattern_id) ON e.seed_key=v.seed_key;

INSERT INTO exercise_tags (exercise_id,tag_id)
SELECT e.id,CASE e.category WHEN 'core' THEN 'core' ELSE 'strength' END
FROM exercises e WHERE e.seed_key IN ('wall-pushup','chair-sit-to-stand','double-leg-calf-raise','supported-single-leg-hinge','band-anti-rotation-press');

INSERT INTO exercise_equipment (exercise_id,equipment_id,quantity_required)
SELECT e.id,q.id,1 FROM exercises e JOIN equipment q ON q.seed_key='resistance-band'
WHERE e.seed_key='band-anti-rotation-press';

INSERT INTO exercise_details (
  exercise_id,locale,purpose,setup,start_position,finish_reset,breathing_cue,tempo_cue,safety_notes,
  quality_criteria,beginner_prescription,standard_prescription,advanced_prescription,work_rest_guidance,
  level_1,level_2,level_3,child_youth_variant,prerequisites,fallback_exercise,difficulty,supervision,
  space_requirement,setup_seconds,transition_seconds,station_capacity
)
SELECT e.id,v.locale,v.purpose,v.setup,v.start_position,v.finish_reset,v.breathing_cue,v.tempo_cue,v.safety_notes,
  v.quality_criteria,v.beginner_prescription,v.standard_prescription,v.advanced_prescription,v.work_rest_guidance,
  v.level_1,v.level_2,v.level_3,v.child_youth_variant,v.prerequisites,v.fallback_exercise,'beginner','normal',
  'small',45,20,4
FROM exercises e JOIN (VALUES
  ('wall-pushup','de','Trainiert die Druckbewegung mit geringer, leicht skalierbarer Last.','Nutze eine feste, nicht rollende Wand mit freier Fläche davor.','Stelle dich etwa eine Armlänge von der Wand entfernt hin und setze die Hände auf Brusthöhe auf.','Drücke dich zurück in den aufrechten Stand und lockere die Arme.','Atme beim Wegdrücken aus und beim Heranbeugen ein.','Beuge und strecke die Arme ruhig, ohne in der Endposition einzuschnappen.','Wähle einen rutschfesten Stand; stoppe bei Schulter- oder Handgelenkschmerz.','Kopf, Rumpf und Becken bleiben in einer Linie; die Brust nähert sich kontrolliert der Wand.','2 x 6 Wiederholungen','3 x 8–12 Wiederholungen','3 x 12–15 oder Füße etwas weiter zurück','30–45 Sekunden Pause; Bewegungsqualität geht vor Wiederholungszahl.','Näher an der Wand stehen und nur den halben Weg beugen.','Armlänge Abstand und voller schmerzfreier Bewegungsweg.','Füße weiter zurückstellen, ohne die Rumpflinie zu verlieren.','Als kurzes Bewegungsspiel an der Wand; Abstand so wählen, dass jede Wiederholung sicher gelingt.','Stabiler Stand und beschwerdefreies Abstützen an der Wand.','Wanddrücken im Stand ohne Armbeugung.'),
  ('wall-pushup','en','Trains the pushing pattern with a low, easily scaled load.','Use a firm, non-moving wall with clear space in front.','Stand about an arm length from the wall and place hands at chest height.','Press back to an upright stand and relax the arms.','Exhale as you press away and inhale as you lean in.','Bend and straighten the arms smoothly without locking out.','Use non-slip footing; stop for shoulder or wrist pain.','Head, trunk and hips stay aligned; the chest approaches the wall under control.','2 x 6 repetitions','3 x 8–12 repetitions','3 x 12–15 or move feet slightly farther back','Rest 30–45 seconds; movement quality comes before repetitions.','Stand closer to the wall and use a short range.','Use an arm-length distance and a full pain-free range.','Move feet farther back while keeping the trunk aligned.','Use as a short movement game at a distance where every repetition stays safe.','Stable standing and pain-free hand support on the wall.','Standing wall press without bending the arms.'),
  ('chair-sit-to-stand','de','Übt das kontrollierte Aufstehen und Hinsetzen als alltagsnahe Knie- und Hüftstreckung.','Stelle einen stabilen Stuhl ohne Rollen auf rutschfesten Boden; sichere genug Platz davor.','Setze dich vorn auf die Sitzfläche, Füße hüftbreit unter oder leicht hinter die Knie.','Setze dich langsam zurück und richte die Füße für die nächste Wiederholung neu aus.','Atme beim Aufstehen aus und beim Hinsetzen ein.','Stehe gleichmäßig auf; senke dich deutlich langsamer ab.','Der Stuhl darf nicht kippen oder rutschen; nutze bei Bedarf eine Wand oder Trainerhilfe.','Die Knie bleiben in Richtung der Fußspitzen und das Hinsetzen bleibt leise und kontrolliert.','2 x 5 Wiederholungen mit Handhilfe','3 x 8–12 Wiederholungen','3 x 12–15 oder mit leichter Zusatzlast','45–60 Sekunden Pause; bei nachlassender Kontrolle früher pausieren.','Mit höherer Sitzfläche und beiden Händen unterstützen.','Von normaler Sitzhöhe ohne Schwung aufstehen.','Arme vor der Brust verschränken oder eine kleine Last halten.','Sitzhöhe passend wählen und jede Wiederholung als ruhige Aufsteh-Challenge ausführen.','Sicher auf einem Stuhl sitzen und mit Unterstützung aufstehen können.','Teilaufstehen von einer höheren Bank mit Handstütze.'),
  ('chair-sit-to-stand','en','Practises controlled standing up and sitting down as a functional knee and hip extension.','Place a stable chair without wheels on a non-slip floor with clear space in front.','Sit near the front edge with feet hip-width and under or slightly behind the knees.','Sit back slowly and reset the feet before the next repetition.','Exhale while standing and inhale while sitting down.','Stand up evenly and lower yourself more slowly.','The chair must not tip or slide; use wall or coach support when needed.','Knees track toward the toes and each sit-down is quiet and controlled.','2 x 5 repetitions with hand support','3 x 8–12 repetitions','3 x 12–15 or hold a light load','Rest 45–60 seconds; pause sooner if control declines.','Use a higher seat and assist with both hands.','Stand from a standard seat without momentum.','Fold arms across the chest or hold a light load.','Choose a suitable seat height and make each repetition a calm stand-up challenge.','Able to sit safely and stand with support.','Partial stand from a higher bench with hand support.'),
  ('double-leg-calf-raise','de','Kräftigt die Waden und übt kontrolliertes Abrollen und Gleichgewicht im Stand.','Stelle dich neben eine stabile Wand oder ein Geländer als leichte Sicherung.','Stehe hüftbreit mit gleichmäßig belasteten Füßen und locker aufgerichtetem Oberkörper.','Senke die Fersen langsam bis zum Boden und löse die Hände von der Stütze nur, wenn stabil.','Atme beim Anheben aus und beim Absenken ein.','Hebe zügig, aber ohne Schwung; senke in etwa zwei Sekunden ab.','Nutze eine Stütze bei Unsicherheit und trainiere nicht auf einer erhöhten Kante ohne Aufsicht.','Beide Fersen steigen gleich hoch; Fußgelenke kippen nicht nach außen oder innen.','2 x 8 Wiederholungen mit Wandkontakt','3 x 10–15 Wiederholungen','3 x 15–20 mit dreisekündigem Absenken','30–45 Sekunden Pause; bei Wadenkrampf pausieren und ausschütteln.','Kleiner Bewegungsweg mit sicherem Wandkontakt.','Volle schmerzfreie Bewegung auf beiden Füßen.','Einbeinige Ausführung nur mit sicherer Handstütze.','Spielerisch auf die Zehenspitzen steigen und langsam wieder ganz absetzen.','Sicherer Stand; eine Handstütze ist jederzeit erlaubt.','Im Sitzen die Fersen anheben und senken.'),
  ('double-leg-calf-raise','en','Strengthens the calves and practises controlled foot movement and standing balance.','Stand beside a stable wall or rail for light support.','Stand hip-width with even pressure through both feet and a relaxed upright torso.','Lower the heels slowly to the floor; release the support only if steady.','Exhale while rising and inhale while lowering.','Rise smoothly without momentum; lower for about two seconds.','Use support when balance is uncertain and do not use a raised edge without supervision.','Both heels rise evenly; ankles do not roll inward or outward.','2 x 8 repetitions with wall support','3 x 10–15 repetitions','3 x 15–20 with a three-second lowering phase','Rest 30–45 seconds; pause and shake out if the calves cramp.','Use a short range with secure wall support.','Use a full pain-free range on both feet.','Try a single-leg version only with secure hand support.','Rise onto the toes as a simple game, then lower all the way with control.','Stable standing; one hand may stay on support throughout.','Raise and lower the heels while seated.'),
  ('supported-single-leg-hinge','de','Trainiert Hüftbeuge, hintere Muskelkette und Gleichgewicht mit einer Hand als Sicherung.','Stelle dich seitlich neben eine feste Wand oder einen stabilen Pfosten.','Lege eine Hand leicht an die Stütze, belaste ein Bein und halte das andere Bein locker bereit.','Kehre in den aufrechten Einbeinstand zurück und setze bei Bedarf den freien Fuß kurz ab.','Atme beim Vorbeugen aus und beim Aufrichten ein.','Schiebe die Hüfte langsam zurück; halte die Bewegung ruhig und ohne Schwung.','Die Stütze muss fest sein; bei Gleichgewichtsverlust den freien Fuß sofort absetzen.','Rücken bleibt lang, Becken bleibt weitgehend gerade und Standknie stabil.','2 x 5 pro Seite mit kleiner Vorbeuge','3 x 6–8 pro Seite','3 x 8–10 pro Seite mit leichter Last in der freien Hand','45–60 Sekunden Pause zwischen den Seiten.','Beide Füße am Boden lassen und die Hüfte zurückschieben.','Einbeinstand mit Handkontakt und kurzer Vorbeuge.','Bewegungsweg vergrößern oder eine leichte Last halten.','Kurzer Bewegungsweg mit fester Handstütze und häufigem Fußabsetzen.','Sicherer Einbeinstand mit Handstütze und schmerzfreie Hüftbeuge.','Beidbeinige Hüftbeuge zur Wand.'),
  ('supported-single-leg-hinge','en','Trains the hip hinge, posterior chain and balance with one hand available for support.','Stand beside a firm wall or stable post.','Rest one hand lightly on support, load one leg and keep the other leg relaxed and ready.','Return to a tall single-leg stand and briefly place the free foot down if needed.','Exhale while hinging and inhale as you rise.','Send the hips back slowly and keep the movement smooth.','Support must be firm; place the free foot down immediately if balance is lost.','Back stays long, pelvis mostly level and the standing knee controlled.','2 x 5 each side with a short hinge','3 x 6–8 each side','3 x 8–10 each side holding a light load in the free hand','Rest 45–60 seconds between sides.','Keep both feet down and practise sending the hips back.','Use hand support and a short single-leg hinge.','Increase the range or hold a light load.','Use a short range, firm hand support and frequent foot resets.','Steady supported single-leg stance and a pain-free hip hinge.','Two-leg hip hinge toward a wall.'),
  ('band-anti-rotation-press','de','Trainiert Rumpfspannung, während das Band den Oberkörper kontrolliert zur Seite drehen möchte.','Befestige ein leichtes Band sicher auf Brusthöhe; prüfe Knoten, Anker und freie Zugrichtung.','Stelle dich seitlich zum Anker, halte das Band vor der Brust und stehe stabil mit leicht gebeugten Knien.','Führe die Hände kontrolliert zur Brust zurück, bevor du dich zum Anker drehst.','Atme beim Wegdrücken aus und beim Zurückführen ein.','Drücke langsam vor und halte die Endposition kurz ohne Rumpfdrehung.','Nur einen geprüften, zugelassenen Anker verwenden; niemand darf in der Zuglinie stehen.','Brustbein und Becken zeigen nach vorn; das Band zieht, aber der Rumpf bleibt ruhig.','2 x 6 pro Seite mit leichtem Band','3 x 8–10 pro Seite','3 x 10–12 pro Seite oder mit längerem Hebel','30–45 Sekunden Pause beim Seitenwechsel.','Band sehr leicht wählen und nur wenige Zentimeter wegdrücken.','Arme auf Brusthöhe nach vorn strecken und stabil halten.','Stand schmaler wählen oder den Hebel durch gestreckte Arme verlängern.','Leichtes Band, breite stabile Stellung und kurze Haltezeit.','Sichere Bandbefestigung und Fähigkeit, stabil seitlich zum Zug zu stehen.','Rumpfspannung im Stand ohne Band üben.'),
  ('band-anti-rotation-press','en','Trains trunk control while the band attempts to rotate the body sideways.','Secure a light band at chest height; check the anchor and clear pull path.','Stand side-on to the anchor, hold the band at the chest and use a stable stance with soft knees.','Bring the hands back to the chest under control before turning toward the anchor.','Exhale while pressing away and inhale while returning.','Press slowly and pause briefly without rotating the trunk.','Use only an approved secure anchor; keep everyone clear of the pull line.','Chest and pelvis face forward; the band pulls but the trunk stays steady.','2 x 6 each side with a light band','3 x 8–10 each side','3 x 10–12 each side or use a longer lever','Rest 30–45 seconds when changing sides.','Use a very light band and press only a short distance.','Extend the arms at chest height and hold steady.','Narrow the stance or lengthen the lever with straighter arms.','Use a light band, wide stable stance and short holds.','Secure band attachment and ability to stand steadily side-on to the pull.','Practise standing trunk bracing without a band.')
) AS v(seed_key,locale,purpose,setup,start_position,finish_reset,breathing_cue,tempo_cue,safety_notes,quality_criteria,beginner_prescription,standard_prescription,advanced_prescription,work_rest_guidance,level_1,level_2,level_3,child_youth_variant,prerequisites,fallback_exercise) ON e.seed_key=v.seed_key;

INSERT INTO exercise_execution_steps (exercise_id,locale,step_order,instruction)
SELECT e.id,v.locale,v.step_order,v.instruction
FROM exercises e JOIN (VALUES
  ('wall-pushup','de',1,'Prüfe die Wand und stelle die Füße rutschfest auf.'),('wall-pushup','de',2,'Beuge die Arme und führe den Körper als Einheit zur Wand.'),('wall-pushup','de',3,'Drücke die Wand weg und kehre ruhig in den Stand zurück.'),
  ('wall-pushup','en',1,'Check the wall and place your feet on non-slip flooring.'),('wall-pushup','en',2,'Bend your arms and move your body toward the wall as one unit.'),('wall-pushup','en',3,'Press away from the wall and return calmly to standing.'),
  ('chair-sit-to-stand','de',1,'Prüfe, dass der Stuhl nicht rutscht, und setze dich stabil hin.'),('chair-sit-to-stand','de',2,'Beuge den Oberkörper leicht vor und drücke dich über beide Füße nach oben.'),('chair-sit-to-stand','de',3,'Schiebe die Hüfte zurück und setze dich langsam wieder hin.'),
  ('chair-sit-to-stand','en',1,'Check that the chair cannot slide, then sit with control.'),('chair-sit-to-stand','en',2,'Lean forward slightly and push through both feet to stand.'),('chair-sit-to-stand','en',3,'Send the hips back and sit down slowly.'),
  ('double-leg-calf-raise','de',1,'Stelle dich hüftbreit neben eine sichere Stütze.'),('double-leg-calf-raise','de',2,'Hebe beide Fersen gleichmäßig an.'),('double-leg-calf-raise','de',3,'Senke die Fersen langsam bis zum Boden.'),
  ('double-leg-calf-raise','en',1,'Stand hip-width beside secure support.'),('double-leg-calf-raise','en',2,'Rise evenly onto both forefeet.'),('double-leg-calf-raise','en',3,'Lower the heels slowly to the floor.'),
  ('supported-single-leg-hinge','de',1,'Stelle dich neben eine feste Stütze und halte sie locker mit einer Hand.'),('supported-single-leg-hinge','de',2,'Schiebe die Hüfte zurück und führe das freie Bein nach hinten.'),('supported-single-leg-hinge','de',3,'Richte dich auf und setze den freien Fuß bei Bedarf sicher ab.'),
  ('supported-single-leg-hinge','en',1,'Stand beside firm support and hold it lightly with one hand.'),('supported-single-leg-hinge','en',2,'Send the hips back and move the free leg behind you.'),('supported-single-leg-hinge','en',3,'Stand tall and place the free foot down safely if needed.'),
  ('band-anti-rotation-press','de',1,'Prüfe Band und Anker; stelle dich seitlich zum Band.'),('band-anti-rotation-press','de',2,'Spanne den Rumpf an und drücke die Hände vor die Brust.'),('band-anti-rotation-press','de',3,'Halte den Oberkörper ruhig und führe die Hände kontrolliert zurück.'),
  ('band-anti-rotation-press','en',1,'Check the band and anchor, then stand side-on to the band.'),('band-anti-rotation-press','en',2,'Brace gently and press your hands forward from the chest.'),('band-anti-rotation-press','en',3,'Keep the trunk still and return your hands under control.')
) AS v(seed_key,locale,step_order,instruction) ON e.seed_key=v.seed_key;

INSERT INTO exercise_coaching_cues (exercise_id,locale,cue_order,cue)
SELECT e.id,v.locale,v.cue_order,v.cue FROM exercises e JOIN (VALUES
  ('wall-pushup','de',1,'Körper bleibt lang'),('wall-pushup','de',2,'Ruhig von der Wand wegdrücken'),('wall-pushup','en',1,'Keep your body long'),('wall-pushup','en',2,'Press away smoothly'),
  ('chair-sit-to-stand','de',1,'Druck über beide Füße'),('chair-sit-to-stand','de',2,'Leise hinsetzen'),('chair-sit-to-stand','en',1,'Push through both feet'),('chair-sit-to-stand','en',2,'Sit down quietly'),
  ('double-leg-calf-raise','de',1,'Fersen gleich hoch'),('double-leg-calf-raise','de',2,'Langsam absenken'),('double-leg-calf-raise','en',1,'Lift both heels evenly'),('double-leg-calf-raise','en',2,'Lower slowly'),
  ('supported-single-leg-hinge','de',1,'Hüfte nach hinten'),('supported-single-leg-hinge','de',2,'Standknie ruhig halten'),('supported-single-leg-hinge','en',1,'Send hips back'),('supported-single-leg-hinge','en',2,'Keep the standing knee steady'),
  ('band-anti-rotation-press','de',1,'Brust zeigt nach vorn'),('band-anti-rotation-press','de',2,'Band langsam bewegen'),('band-anti-rotation-press','en',1,'Keep chest facing forward'),('band-anti-rotation-press','en',2,'Move the band slowly')
) AS v(seed_key,locale,cue_order,cue) ON e.seed_key=v.seed_key;

INSERT INTO exercise_common_mistakes (exercise_id,locale,mistake_order,mistake,correction)
SELECT e.id,v.locale,1,v.mistake,v.correction FROM exercises e JOIN (VALUES
  ('wall-pushup','de','Die Hüfte hängt durch.','Spanne den Bauch leicht an und bewege Schultern und Becken gemeinsam.'),('wall-pushup','en','The hips sag.','Brace gently and move shoulders and hips together.'),
  ('chair-sit-to-stand','de','Die Knie fallen nach innen.','Richte die Knie über dem zweiten und dritten Zeh aus.'),('chair-sit-to-stand','en','The knees collapse inward.','Track the knees over the second and third toes.'),
  ('double-leg-calf-raise','de','Der Körper wippt und die Fersen steigen unterschiedlich.','Nutze eine Stütze und hebe beide Fersen gleichmäßig.'),('double-leg-calf-raise','en','The body bounces and the heels rise unevenly.','Use support and raise both heels evenly.'),
  ('supported-single-leg-hinge','de','Der Rücken rundet sich beim Vorbeugen.','Verkleinere den Weg und schiebe die Hüfte nach hinten.'),('supported-single-leg-hinge','en','The back rounds during the hinge.','Shorten the range and send the hips back.'),
  ('band-anti-rotation-press','de','Der Oberkörper dreht zum Band.','Wähle weniger Bandzug und richte Brustbein und Becken nach vorn.'),('band-anti-rotation-press','en','The trunk rotates toward the band.','Use less band tension and face the chest and pelvis forward.')
) AS v(seed_key,locale,mistake,correction) ON e.seed_key=v.seed_key;

INSERT INTO search_documents_de (document_id,entity_type,entity_id,title,aliases,summary,tags,body_regions,equipment,instructions)
SELECT 'exercise:' || e.id::VARCHAR,'exercise',e.id::VARCHAR,t.name,
  COALESCE((SELECT string_agg(a.alias,' ') FROM exercise_aliases a WHERE a.exercise_id=e.id AND a.locale='de'),''),
  COALESCE(t.summary,''),
  COALESCE((SELECT string_agg(tag.tag_id,' ') FROM exercise_tags tag WHERE tag.exercise_id=e.id),''),
  COALESCE((SELECT string_agg(body.body_region_id,' ') FROM exercise_body_regions body WHERE body.exercise_id=e.id),''),
  COALESCE((SELECT string_agg(eq.name_de,' ') FROM exercise_equipment mapping JOIN equipment eq ON eq.id=mapping.equipment_id WHERE mapping.exercise_id=e.id),''),
  d.purpose || ' ' || d.setup || ' ' || d.start_position || ' ' || d.safety_notes || ' ' || d.quality_criteria || ' ' ||
    COALESCE((SELECT string_agg(step.instruction,' ' ORDER BY step.step_order) FROM exercise_execution_steps step WHERE step.exercise_id=e.id AND step.locale='de'),'')
FROM exercises e JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='de'
JOIN exercise_details d ON d.exercise_id=e.id AND d.locale='de'
WHERE e.seed_key IN ('wall-pushup','chair-sit-to-stand','double-leg-calf-raise','supported-single-leg-hinge','band-anti-rotation-press');

INSERT INTO search_documents_en (document_id,entity_type,entity_id,title,aliases,summary,tags,body_regions,equipment,instructions)
SELECT 'exercise:' || e.id::VARCHAR,'exercise',e.id::VARCHAR,t.name,
  COALESCE((SELECT string_agg(a.alias,' ') FROM exercise_aliases a WHERE a.exercise_id=e.id AND a.locale='en'),''),
  COALESCE(t.summary,''),
  COALESCE((SELECT string_agg(tag.tag_id,' ') FROM exercise_tags tag WHERE tag.exercise_id=e.id),''),
  COALESCE((SELECT string_agg(body.body_region_id,' ') FROM exercise_body_regions body WHERE body.exercise_id=e.id),''),
  COALESCE((SELECT string_agg(COALESCE(eq.name_en,eq.name_de),' ') FROM exercise_equipment mapping JOIN equipment eq ON eq.id=mapping.equipment_id WHERE mapping.exercise_id=e.id),''),
  d.purpose || ' ' || d.setup || ' ' || d.start_position || ' ' || d.safety_notes || ' ' || d.quality_criteria || ' ' ||
    COALESCE((SELECT string_agg(step.instruction,' ' ORDER BY step.step_order) FROM exercise_execution_steps step WHERE step.exercise_id=e.id AND step.locale='en'),'')
FROM exercises e JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='en'
JOIN exercise_details d ON d.exercise_id=e.id AND d.locale='en'
WHERE e.seed_key IN ('wall-pushup','chair-sit-to-stand','double-leg-calf-raise','supported-single-leg-hinge','band-anti-rotation-press');

UPDATE search_index_state SET status='dirty',last_error=NULL WHERE locale IN ('de','en');

INSERT INTO schema_migrations (version,name) VALUES (13,'foundational_strength_seed_cohort');
COMMIT;
