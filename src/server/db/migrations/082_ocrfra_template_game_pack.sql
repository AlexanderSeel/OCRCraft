BEGIN TRANSACTION;

-- OCRCraft-original club game. Local obstacle dimensions and release remain separate.
INSERT INTO exercises (
  seed_key,canonical_name,category,default_phase,risk_level,min_age,indoor,outdoor,
  exercise_type,difficulty,impact_level,coordination_complexity,progression_required,
  space_requirement,supports_reps,supports_seconds,supports_minutes,supports_metres,
  supports_rounds,supports_attempts,setup_seconds,transition_seconds,station_capacity,
  suitable_for_kids,suitable_for_youth,suitable_for_adults,supervision,indoor_suitable,
  outdoor_suitable,laterality,movement_plane,surface_requirements,weather_terrain,obstacle_configuration
)
SELECT 'game-ocrfra-obstacle-route-relay','OCRFRA Hindernis-Routenstaffel','ocr-skill','main','medium',14,true,true,
  'game','intermediate','moderate','complex',false,'large',false,true,true,true,true,false,180,30,12,
  false,true,true,'increased',true,true,'locomotion','multiplanar',
  'Freie, rutschfeste Fläche mit markierten Warte-, Lauf- und Ausstiegszonen.',
  'Outdoor nur bei sicherem Untergrund, ausreichender Sicht und geprüfter Station.',
  'Nur lokal freigegebene niedrige OCRFRA-Varianten; Stationen einzeln und mit Fallback planen.'
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE seed_key='game-ocrfra-obstacle-route-relay');

INSERT INTO exercise_translations (exercise_id,locale,name,summary,instructions)
SELECT e.id,v.locale,v.name,v.summary,v.instructions
FROM exercises e JOIN (VALUES
  ('de','OCRFRA Hindernis-Routenstaffel','Teamspiel mit kurzen Laufwegen und freigegebenen OCRFRA-Technikstationen; Qualität, sichere Übergabe und Rollenwechsel zählen vor Geschwindigkeit.','Teams lösen nacheinander einen kurzen Lauf- und Technikabschnitt. Pro Station startet nur die freigegebene Personenzahl; nach dem sicheren Ausstieg wird die nächste Person übergeben.'),
  ('en','OCRFRA Obstacle Route Relay','Team game with short running routes and approved OCRFRA skill stations; quality, safe hand-offs and role rotation come before speed.','Teams complete a short running and skill section in sequence. Only the approved number starts at each station; the next person takes over after a safe exit.')
) AS v(locale,name,summary,instructions) ON true
WHERE e.seed_key='game-ocrfra-obstacle-route-relay';

INSERT OR IGNORE INTO exercise_aliases (exercise_id,locale,alias)
SELECT e.id,v.locale,v.alias FROM exercises e JOIN (VALUES
  ('de','OCRFRA Parcoursstaffel'),('en','OCRFRA obstacle relay'),('de','Club-Obstacle Staffel'),('en','Club obstacle relay')
) AS v(locale,alias) ON true
WHERE e.seed_key='game-ocrfra-obstacle-route-relay';

INSERT OR IGNORE INTO exercise_training_goals (exercise_id,goal)
SELECT e.id,v.goal FROM exercises e JOIN (VALUES
  ('teamwork'),('ocr_technique'),('coordination'),('strength_endurance')
) AS v(goal) ON true WHERE e.seed_key='game-ocrfra-obstacle-route-relay';

INSERT OR IGNORE INTO exercise_training_phases (exercise_id,phase)
SELECT e.id,'main' FROM exercises e WHERE e.seed_key='game-ocrfra-obstacle-route-relay';

INSERT OR IGNORE INTO exercise_body_regions (exercise_id,body_region_id,emphasis)
SELECT e.id,v.region,v.emphasis FROM exercises e JOIN (VALUES
  ('full-body','primary'),('core','secondary'),('forearms-grip','secondary'),('ankles-feet','secondary')
) AS v(region,emphasis) ON true WHERE e.seed_key='game-ocrfra-obstacle-route-relay';

INSERT OR IGNORE INTO exercise_movement_patterns (exercise_id,movement_pattern_id)
SELECT e.id,v.pattern FROM exercises e JOIN (VALUES ('run'),('climb'),('balance'),('carry')) AS v(pattern) ON true
WHERE e.seed_key='game-ocrfra-obstacle-route-relay';

INSERT OR IGNORE INTO exercise_tags (exercise_id,tag_id)
SELECT e.id,v.tag FROM exercises e JOIN (VALUES ('ocr'),('obstacle'),('team')) AS v(tag) ON true
WHERE e.seed_key='game-ocrfra-obstacle-route-relay';

INSERT OR IGNORE INTO exercise_equipment (exercise_id,equipment_id,quantity_required)
SELECT e.id,q.id,1 FROM exercises e JOIN (VALUES ('wall'),('rings'),('balance-beam'),('tire')) AS v(seed_key) ON true
JOIN equipment q ON q.seed_key=v.seed_key WHERE e.seed_key='game-ocrfra-obstacle-route-relay';

INSERT INTO exercise_details (
  exercise_id,locale,purpose,setup,start_position,finish_reset,breathing_cue,tempo_cue,safety_notes,
  quality_criteria,beginner_prescription,standard_prescription,advanced_prescription,work_rest_guidance,
  level_1,level_2,level_3,child_youth_variant,prerequisites,fallback_exercise,difficulty,supervision,
  space_requirement,setup_seconds,transition_seconds,station_capacity
)
SELECT e.id,v.locale,v.purpose,v.setup,v.start_position,v.finish_reset,v.breathing,v.tempo,v.safety,
  v.quality,v.beginner,v.standard,v.advanced,v.workrest,v.level1,v.level2,v.level3,v.youth,v.prereq,
  v.fallback,'intermediate','increased','large',180,30,12
FROM exercises e JOIN (VALUES
  ('de','Verbindet Teamarbeit, Laufübergang und sichere OCR-Technik.','Vier klar getrennte Zonen vorbereiten: Start, Laufweg, Hindernis und Ausgang. Nur freigegebene Varianten einsetzen.','Alle Teams hinter der Startlinie; Rollen und Stoppsignal prüfen.','Nach jedem Abschnitt vollständig aussteigen, Material ordnen und die nächste Person erst auf Trainerzeichen starten lassen.','Ruhig weiteratmen; bei Technikverlust Tempo reduzieren.','Saubere Übergabe, klare Wege und kontrollierte Hindernisbewegung vor Zeit.','Eine Proberunde ohne Zeitdruck, danach 2–4 Runden mit 60–120 Sekunden Sammel-/Erklärpause.','Maximal moderate Laufgeschwindigkeit; Hindernis nicht unter Ermüdungsdruck erzwingen.','Jede Person bewältigt ihren Abschnitt kontrolliert und die Station bleibt frei.','Gehen plus Bodenmarker/Step-over ohne freigegebenes Hindernis.','Kurzer Lauf plus eine freigegebene niedrige Station.','Zwei Stationen oder längere Laufstrecke nur bei stabiler Technik.','Keine Ausscheidung, Rollen häufig wechseln, direkte Traineransage.','Nur Lauf- und Bodenstationen.','Lauf plus niedriger Step-over.','Lauf plus freigegebene Clubstation ohne Zeitdruck.','Stoppsignal, Stationsregeln und Grundbewegungen verstehen.','Kurze Strecke und sichere Regression schmerzfrei beherrschen.','Lauf-/Bodenparcours ohne Höhe oder Hängen.'),
  ('en','Combines teamwork, running transitions and safe OCR technique.','Prepare four clearly separated zones: start, running lane, obstacle and exit. Use approved variations only.','All teams start behind the line; check roles and stop signal.','After each section fully exit, reset equipment and start the next person only on coach signal.','Keep breathing steadily; reduce pace if technique breaks down.','Clean hand-offs, clear routes and controlled obstacle movement before time.','One untimed practice round, then 2–4 rounds with 60–120 seconds to regroup and explain.','Keep running at moderate pace; never force an obstacle attempt under fatigue.','Each person completes the section under control and the station remains clear.','Walking plus floor markers/step-over without an approved obstacle.','Short run plus one approved low station.','Two stations or a longer route only with stable technique.','No elimination, rotate roles often and use direct coach cues.','Running and ground stations only.','Running plus low step-over.','Running plus approved club station without time pressure.','Understand stop signal, station rules and basic movements.','Perform short route and safe regression without pain.','Run/ground course without height or hanging.')
) AS v(locale,purpose,setup,start_position,finish_reset,breathing,tempo,safety,quality,beginner,standard,advanced,workrest,level1,level2,level3,youth,prereq,fallback) ON e.seed_key='game-ocrfra-obstacle-route-relay';

INSERT INTO exercise_execution_steps (exercise_id,locale,step_order,instruction)
SELECT e.id,v.locale,v.step_order,v.instruction FROM exercises e JOIN (VALUES
  ('de',1,'Rollen, Laufweg, Hindernisfreigabe und Stoppsignal erklären.'),('de',2,'Lauf- und Technikabschnitt kontrolliert durchführen und erst nach sicherem Ausstieg übergeben.'),('de',3,'Station vollständig freigeben, Rolle wechseln und Material prüfen.'),('de',4,'Runde ohne Ausscheidung auswerten und bei Bedarf die Regression wählen.'),
  ('en',1,'Explain roles, running lane, obstacle clearance and stop signal.'),('en',2,'Complete the running and skill section under control and hand over only after a safe exit.'),('en',3,'Fully clear the station, rotate the role and check equipment.'),('en',4,'Review the round without elimination and choose a regression if needed.')
) AS v(locale,step_order,instruction) ON e.seed_key='game-ocrfra-obstacle-route-relay';

INSERT INTO exercise_coaching_cues (exercise_id,locale,cue_order,cue)
SELECT e.id,v.locale,v.cue_order,v.cue FROM exercises e JOIN (VALUES
  ('de',1,'Erst schauen, dann starten'),('de',2,'Sauber vor schnell'),('de',3,'Station vollständig verlassen'),
  ('en',1,'Look first, then start'),('en',2,'Quality before speed'),('en',3,'Fully clear the station')
) AS v(locale,cue_order,cue) ON e.seed_key='game-ocrfra-obstacle-route-relay';

INSERT INTO exercise_common_mistakes (exercise_id,locale,mistake_order,mistake,correction)
SELECT e.id,v.locale,v.mistake_order,v.mistake,v.correction FROM exercises e JOIN (VALUES
  ('de',1,'Das Spiel wird zum Sprint und die Station wird zu früh besetzt.','Tempo reduzieren, Wartezone einhalten und erst nach dem Ausstieg starten.'),('de',2,'Eine schwierige Hindernisvariante wird trotz Ermüdung erzwungen.','Runde stoppen und auf die bodennahe oder niedrigere Fallback-Variante wechseln.'),
  ('en',1,'The game turns into a sprint and the station is entered too early.','Reduce pace, use the waiting zone and start only after the exit.'),('en',2,'A difficult obstacle variation is forced under fatigue.','Stop the round and switch to the ground-level or lower fallback.')
) AS v(locale,mistake_order,mistake,correction) ON e.seed_key='game-ocrfra-obstacle-route-relay';

INSERT INTO exercise_source_references (exercise_id,provider,title,source_url,source_type,license_label,notes)
SELECT e.id,'OCRCraft','OCRCraft Eigeninhalt · OCRFRA Club-Obstacle Spiel',
  'https://ocrfra.de/trainingsgelaende/','trainer_authored','OCRCraft Eigeninhalt','Lokale Club-Hindernisse als Verfügbarkeitsreferenz; Regeln, Texte und Bilder sind OCRCraft-Eigeninhalt; Maße/Freigaben bleiben offen.'
FROM exercises e WHERE e.seed_key='game-ocrfra-obstacle-route-relay'
  AND NOT EXISTS (SELECT 1 FROM exercise_source_references r WHERE r.exercise_id=e.id AND r.title='OCRCraft Eigeninhalt · OCRFRA Club-Obstacle Spiel');

INSERT INTO exercise_seed_quality_reviews (exercise_id,review_version,review_status,notes)
SELECT e.id,'2026-09-ocrfra-template-game-pack-v1','passed','OCRCraft-original club game; local obstacle release and station capacity remain trainer/club controlled.'
FROM exercises e WHERE e.seed_key='game-ocrfra-obstacle-route-relay'
  AND NOT EXISTS (SELECT 1 FROM exercise_seed_quality_reviews r WHERE r.exercise_id=e.id);

INSERT INTO search_documents_de (document_id,entity_type,entity_id,title,aliases,summary,tags,body_regions,equipment,instructions)
SELECT 'exercise:' || e.id::VARCHAR,'exercise',e.id::VARCHAR,t.name,
  COALESCE((SELECT string_agg(a.alias,' ') FROM exercise_aliases a WHERE a.exercise_id=e.id AND a.locale='de'),''),t.summary,
  'ocr obstacle team', 'full-body core forearms-grip ankles-feet','wall rings balance-beam tire',
  COALESCE((SELECT string_agg(s.instruction,' ' ORDER BY s.step_order) FROM exercise_execution_steps s WHERE s.exercise_id=e.id AND s.locale='de'),'')
FROM exercises e JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='de'
WHERE e.seed_key='game-ocrfra-obstacle-route-relay';

INSERT INTO search_documents_en (document_id,entity_type,entity_id,title,aliases,summary,tags,body_regions,equipment,instructions)
SELECT 'exercise:' || e.id::VARCHAR,'exercise',e.id::VARCHAR,t.name,
  COALESCE((SELECT string_agg(a.alias,' ') FROM exercise_aliases a WHERE a.exercise_id=e.id AND a.locale='en'),''),t.summary,
  'ocr obstacle team', 'full-body core forearms-grip ankles-feet','wall rings balance-beam tire',
  COALESCE((SELECT string_agg(s.instruction,' ' ORDER BY s.step_order) FROM exercise_execution_steps s WHERE s.exercise_id=e.id AND s.locale='en'),'')
FROM exercises e JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='en'
WHERE e.seed_key='game-ocrfra-obstacle-route-relay';

UPDATE search_index_state SET status='dirty',last_error=NULL WHERE locale IN ('de','en');
INSERT INTO schema_migrations(version,name) VALUES (82,'ocrfra_template_game_pack');
COMMIT;
