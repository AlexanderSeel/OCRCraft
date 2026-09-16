BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS exercise_carry_guidance (
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  locale VARCHAR NOT NULL CHECK (locale IN ('de','en')),
  task_kind VARCHAR NOT NULL CHECK (task_kind IN ('carry','drag','flip','team-carry')),
  intensity_rpe_min SMALLINT NOT NULL CHECK (intensity_rpe_min BETWEEN 1 AND 10),
  intensity_rpe_max SMALLINT NOT NULL CHECK (intensity_rpe_max BETWEEN intensity_rpe_min AND 10),
  load_guidance VARCHAR NOT NULL,
  route_setup VARCHAR NOT NULL,
  lifting_setup VARCHAR NOT NULL,
  movement_cue VARCHAR NOT NULL,
  turning_cue VARCHAR NOT NULL,
  finish_reset VARCHAR NOT NULL,
  fallback_exercise VARCHAR NOT NULL,
  station_capacity SMALLINT NOT NULL CHECK (station_capacity > 0),
  route_length_metres SMALLINT NOT NULL CHECK (route_length_metres > 0),
  PRIMARY KEY (exercise_id, locale)
);

CREATE TEMP TABLE carry_seed_guidance AS SELECT * FROM (VALUES
('farmer-carry','carry',3,6,1,1,'Wähle zwei gleich schwere Lasten, die du aufrecht ohne Griffverlust tragen kannst.','Choose two equal loads you can carry upright without losing grip.','Markiere eine 10–20-m-Bahn mit breiter Wendefläche und freiem Rückweg.','Mark a 10–20 m lane with a wide turn and clear return route.','Hebe beide Lasten aus Hüfte und Knien an; Rücken lang, Lasten seitlich am Körper.','Lift both loads using hips and knees; keep back long and loads beside you.','Gehe mit kurzen gleichmäßigen Schritten; wende in weitem Bogen, ohne die Lasten zu schwingen.','Walk with short even steps; turn in a wide arc without swinging the loads.','Stelle beide Lasten einzeln und kontrolliert am markierten Ende ab.','Set each load down under control at the marked end.','Kürzere Strecke oder leichtere Gegenstände; ohne Gewicht zügig marschieren.','Shorten the route or use lighter objects; brisk march without load.'),
('suitcase-carry','carry',3,6,1,1,'Nutze eine einzelne Last, bei der du aufrecht bleiben kannst, ohne zur Lastseite zu kippen.','Use one load that lets you stay upright without leaning toward it.','Markiere eine freie 10–15-m-Bahn; plane den Richtungswechsel ohne enge Drehung.','Mark a clear 10–15 m lane; plan a direction change without a tight pivot.','Hebe die Last neben einer Hüfte auf; freie Hand bleibt locker, Rippen über dem Becken.','Lift the load beside one hip; keep free hand relaxed and ribs stacked over pelvis.','Gehe geradeaus mit ruhigem Oberkörper; wechsle die Hand erst nach sicherem Absetzen.','Walk straight with a quiet torso; switch hands only after setting the load down safely.','Setze die Last am Ende kontrolliert ab und richte dich auf, bevor du die Hand wechselst.','Set the load down at the end and stand tall before switching hands.','Leichtere Last oder Marschieren ohne Gewicht mit ruhigem Oberkörper.','Use a lighter load or march without weight while keeping the torso steady.'),
('sandbag-bearhug-carry','carry',3,6,1,1,'Wähle einen Sandbag, den du nah am Rumpf halten und sicher aufnehmen kannst.','Choose a sandbag you can hold close to the torso and lift safely.','Lege den Sack auf rutschfesten Boden; markiere kurze Bahn und ausreichend breite Wendefläche.','Place bag on non-slip ground; mark a short lane and wide turn area.','Gehe in die Hüfte, umfasse den Sack eng und richte dich mit Last nah am Brustkorb auf.','Hinge at hips, hug the bag close and stand with load near the chest.','Gehe kontrolliert; wende mit kleinen Schritten und halte den Sack nah am Körper.','Walk under control; turn with small steps and keep the bag close.','Gehe in die Hüfte und setze den Sack mit beiden Armen kontrolliert ab, nicht fallen lassen.','Hinge and lower the bag with both arms; do not drop it.','Leichterer Sack oder enger Bear-Hug-Halt im Stand ohne Wegstrecke.','Use a lighter bag or practise a stationary bear-hug hold.'),
('sandbag-shoulder-carry','carry',3,6,1,1,'Nutze einen leichten Sack, der ohne ruckartiges Reißen auf eine Schulter gehoben werden kann.','Use a light bag that can be placed on one shoulder without jerking.','Markiere eine kurze freie Route; beachte Sicht und ausgeglichene Seitenwechsel.','Mark a short clear route; maintain visibility and alternate sides.','Hebe den Sack nah am Körper an und bringe ihn mit beiden Armen kontrolliert auf die Schulter.','Lift bag close to the body and place it on the shoulder with both arms under control.','Gehe mit aufrechtem Rumpf; halte den Kopf frei und wechsle die Seite nur nach Absetzen.','Walk with upright torso; keep head clear and switch sides only after setting down.','Stütze den Sack mit beiden Händen und senke ihn kontrolliert auf den Boden.','Support the bag with both hands and lower it to the floor under control.','Bear-Hug-Carry mit leichterem Sack oder kurze Halteposition beidseitig.','Use a lighter bear-hug carry or short holds on both sides.'),
('sandbag-front-carry','carry',3,6,1,1,'Belade leicht genug, dass du frei atmen und die Sicht vor dir behalten kannst.','Use a light enough load to breathe freely and see ahead.','Lege den Sack auf sicheren Boden; halte den Weg eben, kurz und frei von Gegenverkehr.','Place bag on safe ground; keep route level, short and free of opposing traffic.','Hebe den Sack körpernah und halte ihn vor dem Rumpf, ohne den Nacken einzuklemmen.','Lift bag close and hold it in front without compressing the neck.','Gehe ruhig mit kurzen Schritten; atme weiter und drehe den ganzen Körper in weitem Bogen.','Walk steadily with short steps; keep breathing and turn the whole body in a wide arc.','Setze den Sack über Hüfte und Knie kontrolliert ab und prüfe die Atmung.','Lower the bag using hips and knees and check breathing.','Leichtere Last oder Farmer-March ohne Last.','Use a lighter load or march without a load.'),
('bucket-carry','carry',3,6,1,1,'Fülle Eimer nur so, dass Griff und Inhalt sicher bleiben; vermeide schwappendes Übergewicht.','Fill buckets only so handles and contents stay secure; avoid unstable sloshing loads.','Prüfe Henkel und Boden, markiere eine kurze ebene Route und halte sie trocken.','Check handles and floor, mark a short level route and keep it dry.','Hebe den Eimer mit neutralem Rücken am Henkel an; halte ihn nahe am Bein.','Lift bucket by handle with neutral back; keep it close to the leg.','Gehe langsam genug, damit der Inhalt kontrolliert bleibt; wende weit und ohne Ruck.','Walk slowly enough to control contents; turn wide without jerking.','Stelle den Eimer aufrecht ab und lasse den Henkel erst nach sicherem Stand los.','Set the bucket upright and release handle only once stable.','Leerer oder leichter Eimer auf kürzerer Strecke.','Use an empty or lighter bucket over a shorter route.'),
('atlas-ball-carry','carry',3,6,1,1,'Verwende eine aufnehmbare Ballmasse; nur aus erhöhter Ablage oder nach geprüfter Bodenhebe-Technik starten.','Choose a manageable ball; start from a raised surface or after checking floor-lift technique.','Direkte Aufsicht, griffige ebene Bahn und breite Wendefläche; keine Laufspur kreuzen.','Provide direct supervision, grippy level lane and wide turn; do not cross running routes.','Umfasse den Ball tief, spanne den Rumpf an und hebe ihn eng am Körper mit Beinen und Hüfte.','Wrap arms low around the ball, brace and lift close using legs and hips.','Trage langsam und halte Sicht frei; wende in mehreren kleinen Schritten statt auf einem Fuß.','Carry slowly with clear vision; turn in several small steps, not on a planted foot.','Senke den Ball über Hüfte und Knie auf eine freie Matte; nicht aus Schulterhöhe fallen lassen.','Lower ball through hips and knees onto a clear mat; do not drop from shoulder height.','Erhöhte leichtere Medizinball-Aufnahme oder Bear-Hug mit kleinem Ball.','Use a raised lighter medicine-ball pick-up or a small ball bear hug.'),
('team-object-carry','team-carry',2,5,2,2,'Wähle einen gemeinsamen Gegenstand, den alle Beteiligten stabil halten können; keine Person darf das Gewicht allein auffangen.','Choose a shared object everyone can hold steadily; no one should have to catch the load alone.','Markiere eine kurze freie Route; Team bestimmt vorab Start, Halt, Wendung und Absetzen.','Mark a short clear route; team agrees start, stop, turn and set-down commands first.','Stellt euch gleichmäßig um den Gegenstand, greift sichere Stellen und hebt gemeinsam auf ein klares Signal.','Space evenly around object, use secure holds and lift together on a clear signal.','Eine Person gibt Tempo und Wendung an; alle gehen in kleinen Schritten und melden Griffprobleme sofort.','One person calls pace and turns; everyone takes small steps and reports grip problems immediately.','Auf gemeinsames Signal gemeinsam absetzen; niemand lässt ein Ende plötzlich los.','Set down together on a shared cue; nobody releases one end suddenly.','Leichterer oder kleinerer Gegenstand; synchrones Gehen ohne Last üben.','Use a lighter or smaller object; practise synchronised walking without load.'),
('sled-drag','drag',3,6,1,1,'Stelle den Schlitten so leicht ein, dass du gleichmäßig ziehen kannst, ohne ruckartig rückwärts zu stolpern.','Load sled so you can pull steadily without jerking or stumbling backward.','Prüfe Zugleine und Schlitten; markiere gerade Bahn, freie Endzone und Wendepunkt.','Check rope and sled; mark a straight lane, clear end zone and turn point.','Greife die Leine sicher, richte dich zur Zugrichtung aus und spanne sie vor dem ersten Schritt.','Grip rope securely, face direction of travel and take slack out before stepping.','Gehe rückwärts oder vorwärts wie demonstriert; halte Zug konstant und blicke regelmäßig in Laufrichtung.','Walk backward or forward as demonstrated; keep pull steady and check travel path.','Löse Spannung kontrolliert, sichere die Leine und gehe um den Schlitten zurück.','Release tension gradually, secure rope and walk back around the sled.','Leichterer Schlitten oder isometrischer Seilzug mit stabiler Verankerung.','Use a lighter sled or isometric rope pull from a stable anchor.'),
('tire-drag','drag',3,6,1,1,'Nutze einen intakten Reifen mit sicherer Zugverbindung und Belastung, die gleichmäßiges Ziehen erlaubt.','Use an intact tire with secure tether and a load that allows steady pulling.','Prüfe Befestigung, Untergrund und Zugbahn; halte Zuschauer außerhalb der Zugrichtung.','Check attachment, surface and lane; keep bystanders outside the pulling line.','Stelle dich stabil vor die Leine, greife beidseitig und spanne ohne Ruck an.','Stand firmly in front of rope, grip with both hands and take tension without jerking.','Ziehe mit kurzen gleichmäßigen Schritten aus Beinen und Hüfte; halte Hände und Leine weg vom Gesicht.','Pull with short even steps using legs and hips; keep hands and rope away from face.','Stoppe vollständig, lege die Leine spannungsfrei ab und gehe außen zurück.','Come to a full stop, release rope tension and return around the lane.','Leichter leerer Reifen oder Bandzug im Stand.','Use a lighter empty tire or standing band pull.'),
('tire-flip','flip',3,6,1,1,'Nur kleiner stabiler Reifen; Trainer demonstriert. Last erlaubt kontrolliertes Kippen ohne Springen oder Rundrücken.','Use only a small stable tire; coach demonstrates. Load must allow a controlled tip without jumping or rounding back.','Ebener griffiger Boden, freie Rollrichtung und direkte Aufsicht; niemand steht vor oder hinter dem Reifen.','Use level grippy ground, clear roll path and direct supervision; nobody stands in front or behind tire.','Gehe nah heran, Füße stabil; greife unter die Reifenkante und spanne den Rumpf an.','Stand close with stable feet; grip beneath tire edge and brace trunk.','Drücke aus Beinen und Hüfte nach vorn-oben; Hände wechseln erst, wenn der Reifen stabil kippt.','Drive forward and up through legs and hips; reposition hands only once tire tips steadily.','Weiche seitlich aus, begleite den Reifen bis zum sicheren Liegen und richte dich neu auf.','Step to the side, guide tire to a stable rest and reset posture.','Erhöhten leichten Sandsack vom Boden auf eine Ablage heben, ohne Wurf.','Lift a light elevated sandbag from floor to a platform without throwing.')
) AS v(seed_key,task_kind,rpe_min,rpe_max,station_capacity,route_length_metres,load_de,load_en,route_de,route_en,movement_de,movement_en,turn_de,turn_en,finish_de,finish_en,fallback_de,fallback_en);

INSERT INTO exercise_carry_guidance
SELECT e.id,l.locale,v.task_kind,v.rpe_min,v.rpe_max,
  CASE l.locale WHEN 'de' THEN v.load_de ELSE v.load_en END,
  CASE l.locale WHEN 'de' THEN v.route_de ELSE v.route_en END,
  CASE l.locale WHEN 'de' THEN 'Stelle dich dicht an die Last, spanne den Rumpf an und hebe aus Hüfte und Knien.' ELSE 'Stand close to the load, brace your trunk and lift through hips and knees.' END,
  CASE l.locale WHEN 'de' THEN v.movement_de ELSE v.movement_en END,
  CASE l.locale WHEN 'de' THEN v.turn_de ELSE v.turn_en END,
  CASE l.locale WHEN 'de' THEN v.finish_de ELSE v.finish_en END,
  CASE l.locale WHEN 'de' THEN v.fallback_de ELSE v.fallback_en END,
  v.station_capacity,v.route_length_metres
FROM carry_seed_guidance v
JOIN exercises e ON e.seed_key=v.seed_key
CROSS JOIN (VALUES ('de'),('en')) l(locale);

UPDATE exercise_details d SET
  purpose=CASE d.locale WHEN 'de' THEN t.name || ': ' || g.load_guidance ELSE t.name || ': ' || g.load_guidance END,
  setup=g.route_setup || ' ' || g.lifting_setup,
  start_position=g.lifting_setup,
  tempo_cue=g.load_guidance || ' RPE ' || CAST(g.intensity_rpe_min AS VARCHAR) || '–' || CAST(g.intensity_rpe_max AS VARCHAR) || '/10.',
  quality_criteria=g.movement_cue || ' ' || g.turning_cue,
  beginner_prescription=CASE d.locale WHEN 'de' THEN '2 × 10 m bei RPE ' || CAST(g.intensity_rpe_min AS VARCHAR) || '–4; Last bei sauberer Haltung steigern.' ELSE '2 × 10 m at RPE ' || CAST(g.intensity_rpe_min AS VARCHAR) || '–4; increase load only while posture stays sound.' END,
  standard_prescription=CASE d.locale WHEN 'de' THEN '3 × ' || CAST(g.route_length_metres AS VARCHAR) || ' m bei RPE ' || CAST(g.intensity_rpe_min AS VARCHAR) || '–' || CAST(g.intensity_rpe_max AS VARCHAR) || '/10.' ELSE '3 × ' || CAST(g.route_length_metres AS VARCHAR) || ' m at RPE ' || CAST(g.intensity_rpe_min AS VARCHAR) || '–' || CAST(g.intensity_rpe_max AS VARCHAR) || '/10.' END,
  advanced_prescription=CASE d.locale WHEN 'de' THEN 'Bis 4 Durchgänge; erst Strecke oder Last einzeln erhöhen, nicht beides zusammen.' ELSE 'Build to 4 rounds; increase distance or load separately, not both together.' END,
  work_rest_guidance=CASE d.locale WHEN 'de' THEN 'Zwischen Durchgängen 60–120 Sekunden oder bis Atmung und Griff sicher kontrolliert sind.' ELSE 'Rest 60–120 seconds between rounds or until breathing and grip are controlled.' END,
  finish_reset=g.finish_reset,
  fallback_exercise=g.fallback_exercise,
  safety_notes=CASE WHEN e.risk_level='high'
    THEN CASE d.locale WHEN 'de' THEN 'Direkte Aufsicht. Last und Befestigung vor jedem Versuch prüfen, Route vollständig freihalten und Lasten nicht aus Schulterhöhe fallen lassen. Bei Schmerz, Griffverlust oder Kontrollverlust abbrechen.' ELSE 'Direct supervision. Check load and attachment before each attempt, keep the full route clear and do not drop loads from shoulder height. Stop for pain, grip failure or loss of control.' END
    ELSE CASE d.locale WHEN 'de' THEN 'Untergrund und Griff vor dem Start prüfen; Last kontrolliert aufnehmen und absetzen. Bei Schmerzen, Stolpern oder unsicherem Griff stoppen.' ELSE 'Check surface and grip before starting; lift and set down under control. Stop for pain, stumbling or insecure grip.' END END,
  station_capacity=g.station_capacity,
  supervision=CASE WHEN e.risk_level='high' THEN 'direct' ELSE 'increased' END
FROM exercise_carry_guidance g
JOIN exercises e ON e.id=g.exercise_id
JOIN exercise_translations t ON t.exercise_id=e.id
WHERE d.exercise_id=e.id AND d.locale=g.locale AND t.locale=g.locale;

DELETE FROM exercise_execution_steps s USING exercise_carry_guidance g WHERE s.exercise_id=g.exercise_id AND s.locale=g.locale;
INSERT INTO exercise_execution_steps
SELECT g.exercise_id,g.locale,n.step_order,
  CASE n.step_order WHEN 1 THEN g.route_setup || ' ' || g.lifting_setup
    WHEN 2 THEN g.movement_cue || ' ' || g.turning_cue
    ELSE g.finish_reset END
FROM exercise_carry_guidance g CROSS JOIN (VALUES (1),(2),(3)) n(step_order);

UPDATE exercise_coaching_cues c SET cue=CASE c.locale
  WHEN 'de' THEN CASE c.cue_order WHEN 1 THEN 'Last nah am Körper' WHEN 2 THEN 'Kurze ruhige Schritte' ELSE 'Kontrolliert absetzen' END
  ELSE CASE c.cue_order WHEN 1 THEN 'Keep load close' WHEN 2 THEN 'Short steady steps' ELSE 'Set down with control' END END
FROM exercise_carry_guidance g WHERE c.exercise_id=g.exercise_id AND c.locale=g.locale;

UPDATE exercise_common_mistakes m SET
  mistake=CASE m.locale WHEN 'de' THEN 'Last wird mit rundem Rücken aufgenommen, geschwungen oder unkontrolliert abgesetzt.' ELSE 'Load is lifted with a rounded back, swung or set down without control.' END,
  correction=CASE m.locale WHEN 'de' THEN 'Last näher heranholen, Hüfte und Knie beugen, leichter wählen und Aufnahme sowie Absetzen erneut vormachen.' ELSE 'Bring the load closer, bend hips and knees, reduce the load and demonstrate the lift and set-down again.' END
FROM exercise_carry_guidance g WHERE m.exercise_id=g.exercise_id AND m.locale=g.locale AND m.mistake_order=1;

INSERT INTO schema_migrations (version,name) VALUES (8,'carry_lift_seed_guidance');
DROP TABLE carry_seed_guidance;
COMMIT;
