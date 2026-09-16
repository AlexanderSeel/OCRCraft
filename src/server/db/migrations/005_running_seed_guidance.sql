BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS exercise_running_guidance (
  exercise_id UUID PRIMARY KEY REFERENCES exercises(id),
  running_kind VARCHAR NOT NULL CHECK (running_kind IN ('technique','endurance','interval','transition','team')),
  intensity_rpe_min SMALLINT NOT NULL CHECK (intensity_rpe_min BETWEEN 1 AND 10),
  intensity_rpe_max SMALLINT NOT NULL CHECK (intensity_rpe_max BETWEEN intensity_rpe_min AND 10),
  intensity_de VARCHAR NOT NULL,
  intensity_en VARCHAR NOT NULL,
  technique_focus_de VARCHAR NOT NULL,
  technique_focus_en VARCHAR NOT NULL
);

CREATE TEMP TABLE running_seed_guidance AS SELECT * FROM (VALUES
('easy-run','endurance',2,4,'RPE 2–4/10: Gesprächstempo; ganze Sätze bleiben möglich.','RPE 2–4/10: conversational pace; full sentences remain possible.','Halte die Schritte locker und gleichmäßig; beende den Lauf mit Reserve.','Keep steps relaxed and even; finish with some reserve.'),
('run-walk-interval','endurance',2,5,'RPE 2–5/10: laufe locker, gehe so lange, bis die Atmung wieder ruhig ist.','RPE 2–5/10: jog easily and walk until breathing settles.','Wechsle an festen Zeit- oder Streckenpunkten; beschleunige nicht, um Gehpausen zu überspringen.','Switch at set time or distance points; do not speed up to skip walk breaks.'),
('tempo-run','endurance',5,7,'RPE 5–7/10: zügig und gleichmäßig, kurze Sätze sind noch möglich; kein Sprint.','RPE 5–7/10: comfortably hard and steady; short phrases are possible, no sprinting.','Finde nach dem Einlaufen ein gleichmäßiges Tempo und halte es ohne Endspurt.','After warming up, settle into an even pace and hold it without a finishing sprint.'),
('fartlek','interval',3,7,'RPE 3–7/10: locker in Erholungsabschnitten, zügig in den Belastungen.','RPE 3–7/10: easy during recovery, brisk during work periods.','Wechsle nach klaren Landmarken oder Zeitfenstern; jede schnelle Passage bleibt technisch kontrolliert.','Alternate at clear landmarks or timed windows; keep every faster segment technically controlled.'),
('short-intervals','interval',6,8,'RPE 6–8/10: kurze zügige Abschnitte; erhole dich vollständig genug für gleichmäßige Wiederholungen.','RPE 6–8/10: short brisk efforts; recover enough to keep repetitions even.','Nutze 10–30 Sekunden oder 60–150 m; brich die Serie ab, wenn Tempo oder Haltung deutlich zerfallen.','Use 10–30 seconds or 60–150 m; end the set if pace or posture clearly breaks down.'),
('long-intervals','interval',5,7,'RPE 5–7/10: längere kontrollierte Abschnitte, deutlich unter maximalem Tempo.','RPE 5–7/10: longer controlled efforts, well below maximum pace.','Arbeite etwa 2–5 Minuten und trabe oder gehe 1–3 Minuten; halte die Wiederholungen gleichmäßig.','Work for about 2–5 minutes and jog or walk for 1–3 minutes; keep repetitions even.'),
('hill-repeats','interval',5,7,'RPE 5–7/10 bergauf; gehe locker bergab zurück und starte erst erholt.','RPE 5–7/10 uphill; walk down easily and restart recovered.','Wähle einen mäßigen, griffigen Hang; verkürze bergauf den Schritt und vermeide aggressives Abstoßen.','Choose a moderate grippy slope; shorten the uphill stride and avoid aggressive push-off.'),
('shuttle-run','interval',5,7,'RPE 5–7/10: kontrollierte Pendelläufe mit vollständigem Abbremsen an jeder Linie.','RPE 5–7/10: controlled shuttles with a full deceleration at each line.','Setze vor der Linie mehrere kurze Bremsschritte; drehe erst stabil und laufe dann zurück.','Take several short braking steps before the line; turn only when stable, then run back.'),
('strides','technique',4,6,'RPE 4–6/10: 10–20 Sekunden flüssig steigern, schnell aber entspannt; lange gehen zwischen Läufen.','RPE 4–6/10: build smoothly for 10–20 seconds, fast but relaxed; walk fully between runs.','Steigere über die Strecke allmählich und rolle locker aus; kein maximaler Sprint.','Build gradually across the distance and ease off smoothly; do not sprint maximally.'),
('acceleration-run','technique',4,7,'RPE 4–7/10: beginne leicht und steigere in mehreren Schritten, ohne abrupten Start.','RPE 4–7/10: start easy and build over several steps, with no sudden launch.','Drücke den Boden zunehmend kräftig nach hinten; halte Kopf und Rumpf ruhig.','Push the ground progressively backward; keep head and torso quiet.'),
('deceleration-drill','technique',2,5,'RPE 2–5/10: Anlauf zunächst locker; steigere erst, wenn das Abbremsen sicher gelingt.','RPE 2–5/10: begin with an easy approach; increase only when braking is secure.','Bremse über mehrere Schritte, senke den Körperschwerpunkt leicht und halte Knie über den Füßen.','Brake over several steps, lower your centre of mass slightly and keep knees aligned over feet.'),
('a-skip','technique',2,4,'RPE 2–4/10: kurze Technikdurchgänge mit Geh-Erholung; Höhe ist kein Ziel.','RPE 2–4/10: short technique bouts with walking recovery; height is not the goal.','Heb ein Knie locker an, setze den Fuß unter dem Körper auf und koordiniere den Gegenarm.','Lift one knee loosely, place the foot under the body and coordinate the opposite arm.'),
('b-skip','technique',2,4,'RPE 2–4/10: kurze Technikdurchgänge; reduziere die Bewegung auf A-Skip, wenn die Kontrolle fehlt.','RPE 2–4/10: short technique bouts; reduce to A-skip if control is lost.','Führe den Unterschenkel nur sanft nach vorn und setze aktiv unter dem Körperschwerpunkt auf.','Extend the lower leg gently and actively place the foot under your centre of mass.'),
('ankling','technique',2,4,'RPE 2–4/10: kurze lockere Bahnen; kein schmerzhaftes oder maximales Federn.','RPE 2–4/10: short relaxed runs; avoid painful or maximal bouncing.','Laufe mit kleinen Schritten aus dem Sprunggelenk und halte Knie und Rumpf entspannt.','Use small ankle-driven steps and keep knees and torso relaxed.'),
('running-high-knees','technique',2,5,'RPE 2–5/10: Techniktempo, bei dem Haltung und Rhythmus sauber bleiben.','RPE 2–5/10: use a technical pace that preserves posture and rhythm.','Heb die Knie nur so weit, wie das Becken stabil bleibt; lande leise unter dem Körper.','Lift knees only as high as the pelvis stays stable; land quietly under the body.'),
('running-butt-kicks','technique',2,5,'RPE 2–5/10: kurze lockere Abschnitte, keine erzwungene Fersenhöhe.','RPE 2–5/10: short relaxed bouts; do not force heel height.','Lass die Ferse locker nach hinten schwingen und führe das Knie wieder nach vorn.','Let the heel swing loosely back and then drive the knee forward again.'),
('bounding','technique',4,6,'RPE 4–6/10: wenige federnde Schritte mit voller Erholung; abbrechen, wenn Landungen laut werden.','RPE 4–6/10: use a few springing steps with full recovery; stop if landings become loud.','Nutze einen elastischen, nicht maximalen Abdruck und lande stabil unter dem Körper.','Use a springy but submaximal push-off and land steadily under the body.'),
('cadence-run','technique',3,5,'RPE 3–5/10: komfortables Lauftempo; ändere die Schrittfrequenz nur leicht.','RPE 3–5/10: comfortable running effort; adjust cadence only slightly.','Nutze einen kurzen Zeitabschnitt zum Zählen und verkürze bei höherer Frequenz den Schritt.','Count for a short timed segment and shorten the stride when cadence rises.'),
('cone-slalom-run','technique',3,5,'RPE 3–5/10: kontrolliertes Tempo; genügend Abstand zwischen Hütchen und Läufern.','RPE 3–5/10: controlled pace; leave enough space between cones and runners.','Blicke zur nächsten freien Lücke, lenke mit kleinen Schritten und schneide keine Kurve eng ab.','Look to the next open gap, steer with small steps and do not cut turns tightly.'),
('lateral-shuffle-run','technique',2,4,'RPE 2–4/10: kurze kontrollierte Bahnen; Füße kreuzen sich nicht.','RPE 2–4/10: use short controlled lanes; do not cross your feet.','Bleib seitlich ausgerichtet, halte die Knie weich und stoße gleichmäßig vom äußeren Fuß ab.','Stay side-on, keep knees soft and push evenly from the outside foot.'),
('relay-run','team',3,6,'RPE 3–6/10: Staffeln als kontrollierte Teamaufgabe; jede Person startet erst bei freier Bahn.','RPE 3–6/10: treat the relay as controlled teamwork; each runner starts only when the lane is clear.','Markiere eine Übergabezone; übergib ruhig in die Hand und vermeide Gegenverkehr.','Mark a handover zone; pass calmly into the hand and prevent opposing traffic.'),
('trail-run','endurance',3,6,'RPE 3–6/10: richte das Tempo nach Untergrund und Sicht; Gehen an unsicheren Stellen ist passend.','RPE 3–6/10: match effort to footing and visibility; walking on unsafe sections is appropriate.','Blicke einige Schritte voraus, verkürze den Schritt auf losem Boden und halte Abstand.','Look a few steps ahead, shorten stride on loose ground and leave space.'),
('run-exercise-100m','interval',3,6,'RPE 3–6/10: 100 m locker laufen, dann die angekündigte Übung in ruhiger Qualität ausführen.','RPE 3–6/10: run 100 m easily, then perform the announced exercise with calm quality.','Lege Übung und Wiederholungszahl vor dem Start fest; halte die Laufstrecke frei und zähle die Gesamtdosis.','Set the exercise and reps before starting; keep the route clear and count total volume.'),
('run-obstacle-transition','transition',3,6,'RPE 3–6/10: laufe den Anlauf kontrolliert und gehe vor dem Hindernis in eine sichere Arbeitsgeschwindigkeit.','RPE 3–6/10: approach at a controlled pace and slow to a safe working speed before the obstacle.','Markiere Brems- und Wartezone; erst starten, wenn das Hindernis frei und freigegeben ist.','Mark a braking and waiting zone; start only when the obstacle is clear and approved.'),
('stairs-run','interval',3,6,'RPE 3–6/10: zügig, aber kontrolliert aufsteigen; für den Abstieg gehen und nicht überholen.','RPE 3–6/10: climb briskly but under control; walk down and do not overtake.','Nutze eine freie Treppe mit griffigen Stufen; setze jeden Schritt sicher auf und laufe nicht abwärts.','Use clear stairs with grippy steps; place each foot securely and never run down.')
) AS values_table(seed_key,running_kind,rpe_min,rpe_max,intensity_de,intensity_en,technique_de,technique_en);

INSERT INTO exercise_running_guidance
SELECT e.id,g.running_kind,g.rpe_min,g.rpe_max,
  g.intensity_de,g.intensity_en,g.technique_de,g.technique_en
FROM running_seed_guidance g
JOIN exercises e ON e.seed_key=g.seed_key;

UPDATE exercise_details d SET
  purpose=CASE l.locale WHEN 'de' THEN t.name || ': ' || g.technique_focus_de ELSE t.name || ': ' || g.technique_focus_en END,
  setup=CASE WHEN g.running_kind IN ('technique','interval','transition')
    THEN CASE l.locale WHEN 'de' THEN 'Markiere eine freie, ebene Bahn mit Start- und Endpunkt; trenne Wartebereich und Laufrichtung.' ELSE 'Mark a clear, level lane with start and finish points; separate the waiting area from the running direction.' END
    ELSE CASE l.locale WHEN 'de' THEN 'Lege eine passende, freie Route fest; prüfe Untergrund, Sicht und sichere Wendepunkte.' ELSE 'Choose an appropriate clear route; check footing, visibility and safe turn points.' END END,
  start_position=CASE l.locale WHEN 'de' THEN 'Stehe hinter der Startmarkierung, prüfe die freie Bahn und beginne nach dem Signal im vorgegebenen Rhythmus.' ELSE 'Stand behind the start marker, check the clear lane and begin on the signal at the prescribed rhythm.' END,
  tempo_cue=CASE l.locale WHEN 'de' THEN g.intensity_de || ' ' || g.technique_focus_de ELSE g.intensity_en || ' ' || g.technique_focus_en END,
  quality_criteria=CASE l.locale WHEN 'de' THEN 'Die Wiederholungen bleiben gleichmäßig; Laufhaltung und ' || g.technique_focus_de || ' bleiben auch zum Ende kontrolliert.' ELSE 'Repetitions remain even; running posture and ' || g.technique_focus_en || ' stay controlled through the finish.' END,
  beginner_prescription=CASE l.locale WHEN 'de' THEN CASE g.running_kind WHEN 'technique' THEN '3 × 15–20 m; gehend zurück, Technik vor Tempo.' WHEN 'endurance' THEN '8–12 Minuten am unteren Ende der RPE-Vorgabe; Gehpausen erlaubt.' WHEN 'team' THEN '2 kurze Läufe pro Person; erst bei freier Bahn starten.' ELSE '4 kurze Durchgänge am unteren Ende der RPE-Vorgabe; vollständig erholen.' END ELSE CASE g.running_kind WHEN 'technique' THEN '3 × 15–20 m; walk back, technique before speed.' WHEN 'endurance' THEN '8–12 minutes at the lower end of the RPE range; walk breaks allowed.' WHEN 'team' THEN '2 short runs per person; start only when the lane is clear.' ELSE '4 short bouts at the lower end of the RPE range; recover fully.' END END,
  standard_prescription=CASE l.locale WHEN 'de' THEN g.intensity_de || ' 4–6 Durchgänge; für Technik 15–30 m, für Intervalle 30–120 Sekunden.' ELSE g.intensity_en || ' 4–6 bouts; use 15–30 m for drills and 30–120 seconds for intervals.' END,
  advanced_prescription=CASE l.locale WHEN 'de' THEN 'Bis zu 6–8 Durchgänge oder längere Belastung; nur steigern, wenn alle Wiederholungen technisch gleichmäßig bleiben.' ELSE 'Build to 6–8 bouts or a longer effort; progress only while all repetitions remain technically even.' END,
  work_rest_guidance=CASE l.locale WHEN 'de' THEN g.intensity_de || ' Bei Technik und kurzen Intervallen mindestens 1:2 Belastung zu Erholung; bei Dauerläufen bleibt die Belastung durchgehend locker.' ELSE g.intensity_en || ' For drills and short intervals, allow at least a 1:2 work-to-recovery ratio; keep continuous runs easy throughout.' END
FROM exercise_running_guidance g
JOIN exercises e ON e.id=g.exercise_id
JOIN exercise_translations t ON t.exercise_id=e.id
JOIN (VALUES ('de'),('en')) l(locale) ON true
WHERE d.exercise_id=e.id AND t.locale=d.locale AND l.locale=d.locale;

-- Replace generic seed steps with a route-specific run sequence and the actual
-- technique target for that exercise, in both supported languages.
DELETE FROM exercise_execution_steps s USING exercise_running_guidance g WHERE s.exercise_id=g.exercise_id;
INSERT INTO exercise_execution_steps
SELECT g.exercise_id,l.locale,n.step_order,
  CASE l.locale WHEN 'de' THEN CASE n.step_order
    WHEN 1 THEN 'Prüfe die markierte Laufbahn und beginne erst, wenn sie frei ist; wärme dich mit lockerem Laufen und dynamischen Bewegungen auf.'
    WHEN 2 THEN g.technique_focus_de || ' ' || g.intensity_de
    ELSE 'Beende den Abschnitt kontrolliert, gehe zur Erholung zurück und starte die nächste Wiederholung erst, wenn die geforderte Technik wieder möglich ist.' END
  ELSE CASE n.step_order
    WHEN 1 THEN 'Check the marked running lane and start only when it is clear; warm up with easy running and dynamic movement.'
    WHEN 2 THEN g.technique_focus_en || ' ' || g.intensity_en
    ELSE 'Finish under control, walk to recover and begin the next repetition only when the required technique is available again.' END END
FROM exercise_running_guidance g CROSS JOIN (VALUES ('de'),('en')) l(locale) CROSS JOIN (VALUES (1),(2),(3)) n(step_order);

UPDATE exercise_coaching_cues c SET cue=CASE c.locale
  WHEN 'de' THEN CASE c.cue_order WHEN 1 THEN 'Ruhig anlaufen' WHEN 2 THEN 'Schritt und Tempo kontrollieren' ELSE 'Erst erholt wiederholen' END
  ELSE CASE c.cue_order WHEN 1 THEN 'Start smoothly' WHEN 2 THEN 'Control stride and pace' ELSE 'Repeat when recovered' END END
FROM exercise_running_guidance g WHERE c.exercise_id=g.exercise_id;

UPDATE exercise_common_mistakes m SET
  mistake=CASE m.locale WHEN 'de' THEN 'Tempo oder Schrittlänge steigt so weit, dass ' || g.technique_focus_de || ' verloren geht.' ELSE 'Pace or stride length increases until ' || g.technique_focus_en || ' is lost.' END,
  correction=CASE m.locale WHEN 'de' THEN 'Tempo senken, Strecke verkürzen und erst wieder steigern, wenn die Technik stabil bleibt.' ELSE 'Reduce pace, shorten the distance and progress only when technique stays stable.' END
FROM exercise_running_guidance g WHERE m.exercise_id=g.exercise_id AND m.mistake_order=1;

INSERT INTO schema_migrations (version,name) VALUES (5,'running_seed_guidance');
DROP TABLE running_seed_guidance;
COMMIT;
