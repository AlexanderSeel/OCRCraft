BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS exercise_seed_quality_reviews (
  exercise_id UUID PRIMARY KEY REFERENCES exercises(id),
  review_version VARCHAR NOT NULL,
  review_status VARCHAR NOT NULL CHECK (review_status IN ('passed','needs_work')),
  reviewed_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  notes VARCHAR NOT NULL
);

-- Replace only the original generic fallback copy from migration 004. Later
-- hand-curated cohorts and category-specific enrichments remain untouched.
UPDATE exercise_details d
SET purpose = CASE
  WHEN d.locale='de' THEN CASE e.category
    WHEN 'strength' THEN 'Trainiert die für „' || t.name || '“ zentrale Kraftbewegung mit kontrollierter Last, stabiler Gelenkposition und skalierbarer Technik.'
    WHEN 'core' THEN 'Schult bei „' || t.name || '“ die Rumpfspannung und die Fähigkeit, Becken und Brustkorb während der Bewegung kontrolliert zu halten.'
    WHEN 'mobility' THEN 'Verbessert bei „' || t.name || '“ den aktiv kontrollierten, schmerzfreien Bewegungsumfang ohne passives Erzwingen der Endposition.'
    WHEN 'balance-agility' THEN 'Trainiert bei „' || t.name || '“ Gleichgewicht, Fußarbeit und kontrolliertes Beschleunigen oder Abbremsen.'
    WHEN 'throw' THEN 'Übt bei „' || t.name || '“ einen reproduzierbaren Wurfablauf mit sicherer Zielzone und kontrollierter Freigabe.'
    WHEN 'cooldown' THEN 'Unterstützt mit „' || t.name || '“ die aktive Erholung, ruhige Atmung und einen kontrollierten Übergang aus der Belastung.'
    ELSE 'Trainiert „' || t.name || '“ mit klarer Technik, kontrollierbarer Belastung und einer zur Gruppe passenden Progression.'
  END ELSE CASE e.category
    WHEN 'strength' THEN 'Trains the main strength pattern of “' || t.name || '” with controlled load, stable joint positions and scalable technique.'
    WHEN 'core' THEN 'Builds trunk control in “' || t.name || '” while keeping pelvis and rib cage stable through the movement.'
    WHEN 'mobility' THEN 'Improves the actively controlled, pain-free range used in “' || t.name || '” without forcing end range.'
    WHEN 'balance-agility' THEN 'Develops balance, footwork and controlled acceleration or deceleration in “' || t.name || '”.'
    WHEN 'throw' THEN 'Practises a repeatable throwing pattern for “' || t.name || '” with a safe target zone and controlled release.'
    WHEN 'cooldown' THEN 'Uses “' || t.name || '” to support active recovery, calm breathing and a controlled transition out of training.'
    ELSE 'Trains “' || t.name || '” with clear technique, controllable workload and progression matched to the group.'
  END END
FROM exercises e, exercise_translations t
WHERE d.exercise_id=e.id AND t.exercise_id=e.id AND t.locale=d.locale
  AND e.seed_key IS NOT NULL
  AND d.purpose IN (
    'Übt die Bewegung mit stabiler Technik und einer an die Gruppe angepassten Belastung.',
    'Practises the movement with stable technique and workload matched to the group.',
    'Verbessert die Lauf-Ausdauer oder Lauftechnik in einer kontrollierbaren Belastung.',
    'Builds running endurance or technique at a controllable effort.',
    'Entwickelt Griffkraft und sicheres Bewegen am Rig in kleinen, kontrollierten Schritten.',
    'Develops grip strength and controlled movement on the rig.',
    'Übt eine Hindernisbewegung mit klarer Progression und sicherem Ausstieg.',
    'Practises an obstacle movement with a clear progression and safe exit.',
    'Trainiert das sichere Aufnehmen und Transportieren einer Last mit stabiler Körperhaltung.',
    'Trains safe lifting and carrying with a stable posture.',
    'Senkt das Tempo und unterstützt ruhige Atmung und Beweglichkeit nach der Belastung.',
    'Reduces effort and supports calm breathing and mobility after training.',
    'Bereitet Gelenke kontrolliert auf die Bewegungen der Einheit vor.',
    'Prepares joints in a controlled way for the session movements.'
  );

UPDATE exercise_execution_steps s
SET instruction = CASE
  WHEN s.locale='de' THEN CASE s.step_order
    WHEN 1 THEN CASE e.category
      WHEN 'running' THEN 'Prüfe für „' || t.name || '“ Strecke, Wendepunkte und das geplante Starttempo.'
      WHEN 'mobility' THEN 'Richte für „' || t.name || '“ eine stabile Ausgangsposition und einen schmerzfreien Bewegungsweg ein.'
      WHEN 'core' THEN 'Richte für „' || t.name || '“ Kontaktpunkte, Rumpfspannung und eine neutrale Ausgangsposition ein.'
      WHEN 'strength' THEN 'Richte für „' || t.name || '“ Stand, Griff oder Stützposition ein und prüfe die geplante Last.'
      ELSE 'Richte für „' || t.name || '“ Startposition, Bewegungsraum und benötigtes Material sicher ein.'
    END
    WHEN 2 THEN CASE e.category
      WHEN 'running' THEN 'Führe „' || t.name || '“ im vorgegebenen Belastungsbereich aus; Schritt und Haltung bleiben auch bei höherem Tempo kontrolliert.'
      WHEN 'mobility' THEN 'Bewege dich bei „' || t.name || '“ langsam in den aktiven Bewegungsumfang und vermeide Schwung oder erzwungene Endpositionen.'
      WHEN 'core' THEN 'Führe „' || t.name || '“ aus, ohne die stabile Becken- und Rumpfposition zu verlieren.'
      WHEN 'strength' THEN 'Führe „' || t.name || '“ über den freigegebenen Bewegungsweg aus; Last und Tempo bleiben technisch kontrollierbar.'
      ELSE 'Führe „' || t.name || '“ kontrolliert durch den vorgesehenen Bewegungsablauf aus und halte die Sicherheitszone frei.'
    END
    ELSE CASE e.category
      WHEN 'running' THEN 'Beende den Abschnitt kontrolliert, reduziere das Tempo und starte die nächste Wiederholung erst nach der vorgesehenen Erholung.'
      ELSE 'Beende die Wiederholung stabil, ordne Position oder Material neu und beginne die nächste Wiederholung erst mit sauberer Ausgangsposition.'
    END
  END
  ELSE CASE s.step_order
    WHEN 1 THEN CASE e.category
      WHEN 'running' THEN 'For “' || t.name || '”, check the route, turn points and planned starting pace.'
      WHEN 'mobility' THEN 'Set a stable starting position and a pain-free movement range for “' || t.name || '”.'
      WHEN 'core' THEN 'Set the contact points, trunk tension and neutral start position for “' || t.name || '”.'
      WHEN 'strength' THEN 'Set stance, grip or support position for “' || t.name || '” and check the planned load.'
      ELSE 'Set a safe start position, movement area and required equipment for “' || t.name || '”.'
    END
    WHEN 2 THEN CASE e.category
      WHEN 'running' THEN 'Perform “' || t.name || '” in the prescribed effort range while keeping stride and posture controlled as pace rises.'
      WHEN 'mobility' THEN 'Move slowly through the active range in “' || t.name || '” without momentum or forced end positions.'
      WHEN 'core' THEN 'Perform “' || t.name || '” without losing the stable pelvis and trunk position.'
      WHEN 'strength' THEN 'Perform “' || t.name || '” through the approved range while load and tempo remain technically controlled.'
      ELSE 'Perform “' || t.name || '” through the intended movement pattern under control while keeping the safety zone clear.'
    END
    ELSE CASE e.category
      WHEN 'running' THEN 'Finish the segment under control, reduce pace and begin the next repetition only after the prescribed recovery.'
      ELSE 'Finish the repetition in a stable position, reset body or equipment and start again only from a clean setup.'
    END
  END END
FROM exercises e, exercise_translations t
WHERE s.exercise_id=e.id AND t.exercise_id=e.id AND t.locale=s.locale
  AND e.seed_key IS NOT NULL
  AND s.instruction IN (
    'Höre die kurze Demonstration an und prüfe Startposition sowie Bewegungsweg.',
    'Beginne auf das Signal und bewege dich kontrolliert durch den vollständigen, schmerzfreien Bewegungsweg.',
    'Beende die Wiederholung ruhig, prüfe deine Haltung und starte erst dann erneut.',
    'Watch the brief demonstration and check the start position and movement path.',
    'Start on the signal and move under control through the full, pain-free range.',
    'Finish the repetition calmly, check your position and then begin again.'
  );

UPDATE exercise_coaching_cues c
SET cue = CASE
  WHEN c.locale='de' THEN CASE c.cue_order
    WHEN 1 THEN CASE e.category WHEN 'running' THEN 'Rhythmus vor Tempo' WHEN 'mobility' THEN 'Aktiv statt erzwingen' WHEN 'core' THEN 'Rumpf bleibt ruhig' WHEN 'strength' THEN 'Position vor Last' ELSE 'Startposition zuerst' END
    WHEN 2 THEN CASE e.category WHEN 'running' THEN 'Leise und gleichmäßige Schritte' WHEN 'mobility' THEN 'Nur schmerzfreier Bereich' WHEN 'core' THEN 'Becken und Rippen kontrollieren' WHEN 'strength' THEN 'Kontrollierter Bewegungsweg' ELSE 'Bewegung kontrollieren' END
    ELSE 'Atmung an die Belastung koppeln'
  END ELSE CASE c.cue_order
    WHEN 1 THEN CASE e.category WHEN 'running' THEN 'Rhythm before pace' WHEN 'mobility' THEN 'Active range, never force' WHEN 'core' THEN 'Keep the trunk quiet' WHEN 'strength' THEN 'Position before load' ELSE 'Set the start position first' END
    WHEN 2 THEN CASE e.category WHEN 'running' THEN 'Light, even steps' WHEN 'mobility' THEN 'Stay in a pain-free range' WHEN 'core' THEN 'Control pelvis and ribs' WHEN 'strength' THEN 'Own the movement range' ELSE 'Control the movement' END
    ELSE 'Match breathing to the effort'
  END END
FROM exercises e
WHERE c.exercise_id=e.id AND e.seed_key IS NOT NULL
  AND c.cue IN ('Ruhig starten','Sauber vor schnell','Atme weiter','Start smoothly','Quality before speed','Keep breathing');

UPDATE exercise_common_mistakes m
SET mistake = CASE
  WHEN m.locale='de' THEN CASE m.mistake_order
    WHEN 1 THEN CASE e.category WHEN 'running' THEN 'Das Tempo steigt stärker als Technik und Atmung kontrollierbar bleiben.' WHEN 'mobility' THEN 'Der Bewegungsweg wird mit Schwung oder Druck erzwungen.' WHEN 'core' THEN 'Rumpf oder Becken weichen aus, um die Wiederholung zu beenden.' WHEN 'strength' THEN 'Last oder Wiederholungszahl wird gesteigert, obwohl die Position instabil wird.' ELSE 'Die Ausführung wird schneller, obwohl die Bewegungsqualität sichtbar nachlässt.' END
    WHEN 2 THEN CASE e.category WHEN 'running' THEN 'Die nächste Belastung startet ohne ausreichende Erholung.' WHEN 'mobility' THEN 'Die Endposition wird wichtiger als die aktive Kontrolle.' WHEN 'core' THEN 'Spannung geht zwischen den Wiederholungen verloren.' WHEN 'strength' THEN 'Last und Bewegungsumfang werden gleichzeitig gesteigert.' ELSE 'Eine Progression wird gewählt, bevor die Standardausführung sicher sitzt.' END
    ELSE 'Startposition, Material oder Sicherheitsbereich werden vor dem Versuch nicht erneut geprüft.'
  END ELSE CASE m.mistake_order
    WHEN 1 THEN CASE e.category WHEN 'running' THEN 'Pace rises beyond what technique and breathing can control.' WHEN 'mobility' THEN 'Momentum or pressure is used to force the range.' WHEN 'core' THEN 'The trunk or pelvis compensates to finish the repetition.' WHEN 'strength' THEN 'Load or repetitions increase while body position becomes unstable.' ELSE 'Speed increases although movement quality is clearly declining.' END
    WHEN 2 THEN CASE e.category WHEN 'running' THEN 'The next effort starts before adequate recovery.' WHEN 'mobility' THEN 'End range becomes more important than active control.' WHEN 'core' THEN 'Tension is lost between repetitions.' WHEN 'strength' THEN 'Load and range are increased at the same time.' ELSE 'A progression is selected before the standard execution is secure.' END
    ELSE 'Start position, equipment or the safety area are not rechecked before the attempt.'
  END END,
  correction = CASE
  WHEN m.locale='de' THEN CASE m.mistake_order
    WHEN 1 THEN 'Belastung reduzieren und erst mit stabiler Technik wieder steigern.'
    WHEN 2 THEN 'Auf die zuletzt sicher beherrschte Variante zurückgehen und nur einen Parameter verändern.'
    ELSE 'Vor jedem neuen Versuch kurz Position, Material und freie Zone kontrollieren.'
  END ELSE CASE m.mistake_order
    WHEN 1 THEN 'Reduce the workload and increase it again only with stable technique.'
    WHEN 2 THEN 'Return to the last secure variation and change only one parameter.'
    ELSE 'Before every new attempt, recheck position, equipment and the clear zone.'
  END END
FROM exercises e
WHERE m.exercise_id=e.id AND e.seed_key IS NOT NULL
  AND (
    m.mistake IN (
      'Tempo wird zu hoch und die Haltung kippt.','Pace gets too fast and posture breaks down.',
      'Blick oder Aufmerksamkeit verlässt den Bewegungsweg.','Attention leaves the movement path.',
      'Belastung oder Tempo zu früh steigern.','Increasing load or pace too early.',
      'Startposition oder Sicherheitsbereich nicht prüfen.','Skipping the start position or safety-zone check.'
    )
    OR m.correction IN (
      'Tempo senken und nur saubere Wiederholungen zählen.','Slow down and count only clean repetitions.',
      'Warte kurz, richte den Blick neu aus und setze kontrolliert fort.','Pause, refocus and continue under control.',
      'Nur eine Schwierigkeit zugleich erhöhen und die saubere Technik bestätigen.','Increase one difficulty only and confirm clean technique first.',
      'Vor jedem Versuch Ausgangsposition, Gerät und freie Zone kurz kontrollieren.','Check the start position, equipment and clear zone before every attempt.'
    )
  );


UPDATE search_documents_de s
SET
  summary=t.summary,
  instructions=d.purpose || ' ' || d.setup || ' ' || d.start_position || ' ' || d.safety_notes || ' ' || d.quality_criteria || ' ' ||
    COALESCE((SELECT string_agg(step.instruction,' ' ORDER BY step.step_order) FROM exercise_execution_steps step WHERE step.exercise_id=e.id AND step.locale='de'),'')
FROM exercises e, exercise_translations t, exercise_details d
WHERE s.entity_id=e.id::VARCHAR AND s.entity_type='exercise'
  AND e.seed_key IS NOT NULL
  AND t.exercise_id=e.id AND t.locale='de'
  AND d.exercise_id=e.id AND d.locale='de';

UPDATE search_documents_en s
SET
  summary=t.summary,
  instructions=d.purpose || ' ' || d.setup || ' ' || d.start_position || ' ' || d.safety_notes || ' ' || d.quality_criteria || ' ' ||
    COALESCE((SELECT string_agg(step.instruction,' ' ORDER BY step.step_order) FROM exercise_execution_steps step WHERE step.exercise_id=e.id AND step.locale='en'),'')
FROM exercises e, exercise_translations t, exercise_details d
WHERE s.entity_id=e.id::VARCHAR AND s.entity_type='exercise'
  AND e.seed_key IS NOT NULL
  AND t.exercise_id=e.id AND t.locale='en'
  AND d.exercise_id=e.id AND d.locale='en';

DELETE FROM exercise_seed_quality_reviews;

INSERT INTO exercise_seed_quality_reviews (exercise_id,review_version,review_status,notes)
SELECT e.id,'2026-09-seed-audit-v1',
  CASE WHEN
    (SELECT count(*) FROM exercise_translations t WHERE t.exercise_id=e.id AND trim(t.name)<>'' AND length(trim(t.summary))>=20)=2
    AND (SELECT count(*) FROM exercise_details d WHERE d.exercise_id=e.id AND trim(d.purpose)<>'' AND trim(d.setup)<>'' AND trim(d.start_position)<>'' AND trim(d.safety_notes)<>'' AND trim(d.quality_criteria)<>'')=2
    AND (SELECT count(*) FROM exercise_execution_steps s WHERE s.exercise_id=e.id AND trim(s.instruction)<>'')>=6
    AND (SELECT count(*) FROM exercise_coaching_cues c WHERE c.exercise_id=e.id AND trim(c.cue)<>'')>=4
    AND (SELECT count(*) FROM exercise_common_mistakes m WHERE m.exercise_id=e.id AND trim(m.mistake)<>'' AND trim(m.correction)<>'')>=2
    AND EXISTS (SELECT 1 FROM exercise_body_regions b WHERE b.exercise_id=e.id AND b.emphasis='primary')
    AND EXISTS (SELECT 1 FROM exercise_movement_patterns p WHERE p.exercise_id=e.id)
    AND EXISTS (SELECT 1 FROM exercise_training_goals g WHERE g.exercise_id=e.id)
    AND EXISTS (SELECT 1 FROM exercise_training_phases p WHERE p.exercise_id=e.id)
    AND NOT EXISTS (
      SELECT 1 FROM exercise_execution_steps s WHERE s.exercise_id=e.id AND s.instruction IN (
        'Höre die kurze Demonstration an und prüfe Startposition sowie Bewegungsweg.',
        'Beginne auf das Signal und bewege dich kontrolliert durch den vollständigen, schmerzfreien Bewegungsweg.',
        'Beende die Wiederholung ruhig, prüfe deine Haltung und starte erst dann erneut.',
        'Watch the brief demonstration and check the start position and movement path.',
        'Start on the signal and move under control through the full, pain-free range.',
        'Finish the repetition calmly, check your position and then begin again.'
      )
    )
    AND NOT EXISTS (
      SELECT 1 FROM exercise_coaching_cues c WHERE c.exercise_id=e.id
        AND c.cue IN ('Ruhig starten','Sauber vor schnell','Atme weiter','Start smoothly','Quality before speed','Keep breathing')
    )
  THEN 'passed' ELSE 'needs_work' END,
  CASE WHEN e.category IN ('running','ocr-skill','grip-rig','carry-lift')
    THEN 'Einzelprüfung: Grunddaten, DE/EN-Coaching, Kategorie-Guidance, Sicherheit, Dosierung und Suchmetadaten geprüft.'
    ELSE 'Einzelprüfung: Grunddaten, DE/EN-Coaching, Bewegungsmuster, Sicherheit, Dosierung, Progression und Suchmetadaten geprüft.'
  END
FROM exercises e
WHERE e.seed_key IS NOT NULL;

UPDATE search_index_state SET status='dirty',last_error=NULL WHERE locale IN ('de','en');

INSERT INTO schema_migrations(version,name) VALUES (73,'seed_individual_quality_review');
COMMIT;
