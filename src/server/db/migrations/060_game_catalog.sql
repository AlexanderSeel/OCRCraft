BEGIN TRANSACTION;

-- OCRCraft-original training games. External references below are taxonomy /
-- format references only; no external exercise text, images or game rules are copied.
INSERT INTO exercises (
  seed_key, canonical_name, category, default_phase, risk_level, min_age,
  indoor, outdoor
)
SELECT v.seed_key,v.name_en,v.category,v.default_phase,v.risk_level,v.min_age,true,true
FROM (VALUES
  ('game-color-island-sprint','Color Island Sprint','balance-agility','warmup','low',6),
  ('game-team-treasure-carry','Team Treasure Carry','carry-lift','main','low',7),
  ('game-lava-path-builders','Lava Path Builders','balance-agility','main','low',7),
  ('game-code-run','Code Run','running','main','low',8),
  ('game-ocr-memory-relay','OCR Memory Relay','ocr-skill','main','medium',12),
  ('game-zone-switch','Zone Switch','balance-agility','main','low',12),
  ('game-grip-token-hunt','Grip Token Hunt','grip-rig','main','medium',12),
  ('game-route-puzzle','Route Puzzle','ocr-skill','main','medium',12),
  ('game-carry-collect','Carry Collect','carry-lift','main','medium',16),
  ('game-reaction-gates','Reaction Gates','balance-agility','main','low',16),
  ('game-partner-pace-match','Partner Pace Match','running','main','low',16),
  ('game-ocr-task-grid','OCR Task Grid','ocr-skill','main','medium',16)
) AS v(seed_key,name_en,category,default_phase,risk_level,min_age)
WHERE NOT EXISTS (SELECT 1 FROM exercises e WHERE e.seed_key=v.seed_key);

UPDATE exercises SET
  exercise_type='game',
  difficulty=CASE WHEN risk_level='medium' THEN 'intermediate' ELSE 'beginner' END,
  impact_level=CASE WHEN category IN ('running','balance-agility') THEN 'moderate' ELSE 'low' END,
  coordination_complexity='moderate',
  progression_required=false,
  space_requirement=CASE WHEN category='grip-rig' THEN 'rig-area' ELSE 'large' END,
  supports_reps=false,
  supports_seconds=true,
  supports_minutes=true,
  supports_metres=category='running',
  supports_rounds=true,
  supports_attempts=false,
  setup_seconds=90,
  transition_seconds=20,
  station_capacity=CASE WHEN min_age < 12 THEN 12 WHEN min_age < 16 THEN 14 ELSE 12 END,
  max_simultaneous_participants=CASE WHEN min_age < 12 THEN 12 WHEN min_age < 16 THEN 14 ELSE 12 END,
  suitable_for_kids=seed_key IN (
    'game-color-island-sprint','game-team-treasure-carry','game-lava-path-builders','game-code-run'
  ),
  suitable_for_youth=seed_key IN (
    'game-color-island-sprint','game-team-treasure-carry','game-lava-path-builders','game-code-run',
    'game-ocr-memory-relay','game-zone-switch','game-grip-token-hunt','game-route-puzzle',
    'game-carry-collect','game-reaction-gates','game-partner-pace-match','game-ocr-task-grid'
  ),
  suitable_for_adults=seed_key IN (
    'game-ocr-memory-relay','game-zone-switch','game-grip-token-hunt','game-route-puzzle',
    'game-carry-collect','game-reaction-gates','game-partner-pace-match','game-ocr-task-grid'
  ),
  supervision=CASE WHEN risk_level='medium' THEN 'increased' ELSE 'normal' END,
  indoor_suitable=true,
  outdoor_suitable=true,
  laterality='locomotion',
  movement_plane='multiplanar',
  surface_requirements='Ebene, freie und rutschfeste Spielfläche mit klar markierten Grenzen',
  weather_terrain='Outdoor nur bei sicherem Untergrund, ausreichender Sicht und angepasstem Tempo',
  obstacle_configuration=CASE
    WHEN category IN ('ocr-skill','grip-rig')
      THEN 'Nur freigegebene niedrige bzw. bekannte OCR-Stationen verwenden; Zu- und Ausstieg getrennt markieren'
    ELSE ''
  END
WHERE seed_key IN (
  'game-color-island-sprint','game-team-treasure-carry','game-lava-path-builders','game-code-run',
  'game-ocr-memory-relay','game-zone-switch','game-grip-token-hunt','game-route-puzzle',
  'game-carry-collect','game-reaction-gates','game-partner-pace-match','game-ocr-task-grid'
);

INSERT OR IGNORE INTO exercise_translations (exercise_id,locale,name,summary,instructions)
SELECT e.id,v.locale,v.name,v.summary,v.instructions
FROM exercises e JOIN (VALUES
  ('game-color-island-sprint','de','Farbinsel-Sprint','Reaktions- und Laufspiel: Auf ein Farbsignal wechseln alle kontrolliert zur passenden markierten Insel.','Mehrere Farbflächen markieren. Der Trainer ruft eine Farbe und optional eine Bewegungsart; alle erreichen ohne Rempeln die passende Fläche. Niemand scheidet aus.'),
  ('game-color-island-sprint','en','Color Island Sprint','Reaction and running game: on a color signal everyone moves under control to the matching marked island.','Mark several colored zones. The coach calls a color and optionally a locomotion style; everyone reaches the matching zone without contact. Nobody is eliminated.'),
  ('game-team-treasure-carry','de','Team-Schatztransport','Kooperationsspiel: Teams transportieren leichte Spielmarken einzeln aus einem Depot in ihre Zielzone.','Jede Person darf pro Weg genau eine leichte Marke transportieren. Marken werden aufgenommen statt geworfen oder entrissen; nach der Ablage wechselt die nächste Person.'),
  ('game-team-treasure-carry','en','Team Treasure Carry','Cooperation game: teams move lightweight tokens one at a time from a depot into their home zone.','Each person carries exactly one light token per trip. Tokens are picked up rather than thrown or grabbed from others; after delivery the next person starts.'),
  ('game-lava-path-builders','de','Lavaweg-Baumeister','Kooperations- und Balancespiel: Ein Team überquert eine Zone nur über begrenzte sichere Trittflächen.','Das Team legt verfügbare Bodenmarker innerhalb sicherer Reichweite aus und bewegt sie weiter. Kein Weitspringen, Werfen von Markern oder Körperkontakt zum Schieben.'),
  ('game-lava-path-builders','en','Lava Path Builders','Cooperation and balance game: a team crosses a zone using only a limited number of safe stepping spots.','The team places available floor markers within safe reach and moves them forward. No long jumps, throwing markers or pushing other players.'),
  ('game-code-run','de','Code-Lauf','Lauf- und Merkspiel: Kurze Wege führen zu Farb-/Zahlencodes, die am Start in richtiger Reihenfolge gelöst werden.','Eine Person läuft zu einem Codepunkt, merkt sich ein Element und kehrt zurück. Das Team setzt die Information zusammen; Tempo bleibt kontrolliert und Wege sind eindeutig getrennt.'),
  ('game-code-run','en','Code Run','Running and memory game: short routes lead to color/number codes that are reconstructed at the start.','One person runs to a code point, remembers one element and returns. The team reconstructs the sequence; pace stays controlled and routes remain clearly separated.'),
  ('game-ocr-memory-relay','de','OCR-Memory-Staffel','Jugend-Teamspiel: Eine kurze Laufstrecke verbindet einen Merkpunkt mit einer Folge freigegebener OCR-Technikaufgaben.','Ein Teammitglied merkt sich am Wendepunkt eine kurze Aufgabenfolge und bringt sie zurück. Das Team führt nur vorher freigegebene, niedrig skalierte Technikaufgaben aus; danach wechselt die Rolle.'),
  ('game-ocr-memory-relay','en','OCR Memory Relay','Youth team game: a short run links a memory point with a sequence of approved OCR skill tasks.','One team member memorizes a short task sequence at the turn point and returns. The team performs only pre-approved, low-scaled skill tasks, then rotates roles.'),
  ('game-zone-switch','de','Zonenwechsel','Reaktionsspiel für Jugendliche: Teams wechseln auf Signale zwischen klar markierten Bewegungszonen.','Zonen erhalten unterschiedliche Bewegungsaufträge. Auf Signal wird kontrolliert zur nächsten freien Zone gewechselt; Laufrichtung und Wartebereich verhindern Gegenverkehr.'),
  ('game-zone-switch','en','Zone Switch','Reaction game for youth: teams switch between clearly marked movement zones on signals.','Zones have different movement tasks. On the signal, move under control to the next free zone; one-way routes and waiting areas prevent opposing traffic.'),
  ('game-grip-token-hunt','de','Grip-Markenjagd','OCR-Spiel für Jugendliche: An niedrigen, freigegebenen Griffstationen werden nach sauberer Technik Spielmarken gesammelt.','Nur eine Person nutzt eine Griffstation. Nach einer kurzen, vom Trainer festgelegten Griffaufgabe wird eine Marke genommen und die Station vollständig verlassen, bevor die nächste Person startet.'),
  ('game-grip-token-hunt','en','Grip Token Hunt','Youth OCR game: players collect tokens after clean technique at low, approved grip stations.','Only one person uses a grip station at a time. After a short coach-defined grip task, take one token and fully clear the station before the next person starts.'),
  ('game-route-puzzle','de','Routen-Puzzle','Teamspiel: Kurze Lauf- und Technikaufgaben liefern Hinweise, aus denen eine sichere Parcoursreihenfolge zusammengesetzt wird.','Teams sammeln nacheinander Hinweiskarten an klaren Punkten. Erst wenn die Reihenfolge feststeht, wird der niedrige freigegebene Parcours ohne Zeitdruck gemeinsam durchlaufen.'),
  ('game-route-puzzle','en','Route Puzzle','Team game: short running and skill tasks reveal clues used to assemble a safe obstacle-course order.','Teams collect clue cards one at a time from clear points. Once the sequence is assembled, the low approved course is completed together without time pressure.'),
  ('game-carry-collect','de','Lasten-Sammellauf','Erwachsenen-Teamspiel: Leichte, sichere Transportobjekte werden kontrolliert aus einem Depot gesammelt.','Pro Weg wird ein freigegebenes Objekt sicher aufgenommen, getragen und vollständig in der Teamzone abgelegt. Kein Werfen, keine instabilen Lasten und kein Überholen im engen Tragekorridor.'),
  ('game-carry-collect','en','Carry Collect','Adult team game: lightweight approved carry objects are collected under control from a depot.','Carry one approved object per trip, lift it safely and place it fully inside the team zone. No throwing, unstable loads or overtaking in narrow carry lanes.'),
  ('game-reaction-gates','de','Reaktionstore','Agilitätsspiel für Erwachsene: Farb- oder Richtungssignale bestimmen, durch welches markierte Tor gelaufen wird.','Mehrere breite Tore mit genügend Abstand markieren. Der Trainer gibt ein Signal; Teilnehmende bremsen kontrolliert ab, wählen das Tor und kehren über eine getrennte Rücklaufspur zurück.'),
  ('game-reaction-gates','en','Reaction Gates','Adult agility game: color or direction signals determine which marked gate to run through.','Mark several wide gates with sufficient spacing. The coach gives a signal; participants decelerate under control, choose the gate and return on a separate lane.'),
  ('game-partner-pace-match','de','Partner-Pace-Match','Ausdauerspiel für Erwachsene: Zweierteams finden und halten gemeinsam ein kontrolliertes Lauftempo mit Führungswechseln.','Paare laufen ohne Körperkontakt nebeneinander oder leicht versetzt. Nach festem Zeitfenster wechselt die Führung; Ziel ist ein gleichmäßiges Sprechtempo statt ein Sprintduell.'),
  ('game-partner-pace-match','en','Partner Pace Match','Adult endurance game: pairs find and maintain a controlled running pace with regular lead changes.','Pairs run without physical contact side by side or slightly staggered. Leadership changes after fixed intervals; the goal is steady conversational pace, not a sprint duel.'),
  ('game-ocr-task-grid','de','OCR-Aufgabenraster','Erwachsenen-Teamspiel: Teams wählen Felder aus einem vom Trainer vorbereiteten Raster mit freigegebenen OCR-, Kraft- und Koordinationsaufgaben.','Der Trainer füllt vorab ein Raster ausschließlich mit passenden Katalogübungen. Teams wählen ein freies Feld, führen die Aufgabe sauber aus und markieren es; Qualität und sichere Stationskapazität zählen vor Geschwindigkeit.'),
  ('game-ocr-task-grid','en','OCR Task Grid','Adult team game: teams choose cells from a coach-prepared grid of approved OCR, strength and coordination tasks.','The coach fills the grid beforehand using only suitable catalog exercises. Teams choose an open cell, complete the task cleanly and mark it; quality and safe station capacity come before speed.')
) AS v(seed_key,locale,name,summary,instructions) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO exercise_aliases (exercise_id,locale,alias)
SELECT e.id,v.locale,v.alias FROM exercises e JOIN (VALUES
  ('game-color-island-sprint','de','Farbinseln'),('game-color-island-sprint','en','Color Islands'),
  ('game-team-treasure-carry','de','Schatztransport'),('game-team-treasure-carry','en','Treasure Carry'),
  ('game-lava-path-builders','de','Lavaweg'),('game-lava-path-builders','en','Lava Path'),
  ('game-code-run','de','Code-Staffel'),('game-code-run','en','Code Relay'),
  ('game-ocr-memory-relay','de','OCR Merkstaffel'),('game-ocr-memory-relay','en','OCR Memory Game'),
  ('game-zone-switch','de','Zonenspiel'),('game-zone-switch','en','Zone Game'),
  ('game-grip-token-hunt','de','Griff-Markenjagd'),('game-grip-token-hunt','en','Grip Hunt'),
  ('game-route-puzzle','de','Parcours-Puzzle'),('game-route-puzzle','en','Course Puzzle'),
  ('game-carry-collect','de','Carry Sammellauf'),('game-carry-collect','en','Carry Collection'),
  ('game-reaction-gates','de','Reaktionstore Lauf'),('game-reaction-gates','en','Gate Reaction Run'),
  ('game-partner-pace-match','de','Partner-Tempolauf'),('game-partner-pace-match','en','Partner Pace Run'),
  ('game-ocr-task-grid','de','OCR Rasterspiel'),('game-ocr-task-grid','en','OCR Grid Game')
) AS v(seed_key,locale,alias) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO exercise_training_goals (exercise_id,goal)
SELECT e.id,v.goal FROM exercises e JOIN (VALUES
  ('game-color-island-sprint','coordination'),('game-color-island-sprint','speed'),
  ('game-team-treasure-carry','teamwork'),('game-team-treasure-carry','strength_endurance'),
  ('game-lava-path-builders','teamwork'),('game-lava-path-builders','balance'),('game-lava-path-builders','coordination'),
  ('game-code-run','endurance'),('game-code-run','coordination'),
  ('game-ocr-memory-relay','teamwork'),('game-ocr-memory-relay','endurance'),('game-ocr-memory-relay','ocr_technique'),
  ('game-zone-switch','coordination'),('game-zone-switch','speed'),('game-zone-switch','teamwork'),
  ('game-grip-token-hunt','grip'),('game-grip-token-hunt','ocr_technique'),('game-grip-token-hunt','teamwork'),
  ('game-route-puzzle','teamwork'),('game-route-puzzle','coordination'),('game-route-puzzle','ocr_technique'),
  ('game-carry-collect','teamwork'),('game-carry-collect','strength_endurance'),
  ('game-reaction-gates','speed'),('game-reaction-gates','coordination'),
  ('game-partner-pace-match','endurance'),('game-partner-pace-match','teamwork'),
  ('game-ocr-task-grid','teamwork'),('game-ocr-task-grid','ocr_technique'),('game-ocr-task-grid','coordination')
) AS v(seed_key,goal) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO exercise_body_regions (exercise_id,body_region_id,emphasis)
SELECT e.id,v.region,v.emphasis FROM exercises e JOIN (VALUES
  ('game-color-island-sprint','full-body','primary'),('game-color-island-sprint','ankles-feet','secondary'),
  ('game-team-treasure-carry','full-body','primary'),('game-team-treasure-carry','core','secondary'),
  ('game-lava-path-builders','core','primary'),('game-lava-path-builders','ankles-feet','secondary'),
  ('game-code-run','full-body','primary'),('game-code-run','calves','secondary'),
  ('game-ocr-memory-relay','full-body','primary'),('game-ocr-memory-relay','core','secondary'),
  ('game-zone-switch','full-body','primary'),('game-zone-switch','ankles-feet','secondary'),
  ('game-grip-token-hunt','forearms-grip','primary'),('game-grip-token-hunt','lats','secondary'),('game-grip-token-hunt','core','secondary'),
  ('game-route-puzzle','full-body','primary'),('game-route-puzzle','core','secondary'),
  ('game-carry-collect','full-body','primary'),('game-carry-collect','forearms-grip','secondary'),('game-carry-collect','core','secondary'),
  ('game-reaction-gates','full-body','primary'),('game-reaction-gates','ankles-feet','secondary'),
  ('game-partner-pace-match','full-body','primary'),('game-partner-pace-match','calves','secondary'),
  ('game-ocr-task-grid','full-body','primary'),('game-ocr-task-grid','core','secondary')
) AS v(seed_key,region,emphasis) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO exercise_training_phases (exercise_id,phase)
SELECT id,default_phase FROM exercises
WHERE seed_key LIKE 'game-%';

INSERT OR IGNORE INTO exercise_details (
  exercise_id,locale,purpose,setup,start_position,finish_reset,breathing_cue,tempo_cue,safety_notes,
  quality_criteria,beginner_prescription,standard_prescription,advanced_prescription,work_rest_guidance,
  level_1,level_2,level_3,child_youth_variant,prerequisites,fallback_exercise,difficulty,supervision,
  space_requirement,setup_seconds,transition_seconds,station_capacity
)
SELECT
  e.id,t.locale,t.summary,
  CASE t.locale WHEN 'de' THEN 'Spielfläche, Start-/Wartezonen und Bewegungsrichtung klar markieren. Regeln und Stoppsignal vor dem Start demonstrieren.' ELSE 'Clearly mark the play area, start/wait zones and direction of travel. Demonstrate the rules and stop signal before starting.' END,
  CASE t.locale WHEN 'de' THEN 'Alle starten hinter der Markierung mit freiem Blick auf den eigenen Bewegungsweg und warten auf das Signal.' ELSE 'Everyone starts behind the marker with a clear view of their movement path and waits for the signal.' END,
  CASE t.locale WHEN 'de' THEN 'Auf Stoppsignal Bewegung kontrolliert beenden, Material zurücklegen und die Fläche für die nächste Runde ordnen.' ELSE 'On the stop signal, finish under control, return equipment and reset the area for the next round.' END,
  CASE t.locale WHEN 'de' THEN 'Gleichmäßig weiteratmen; Intensität so wählen, dass kurze Anweisungen verstanden werden.' ELSE 'Keep breathing steadily; choose an intensity that still allows short instructions to be understood.' END,
  CASE t.locale WHEN 'de' THEN 'Saubere Wege und Regeln vor Geschwindigkeit; nach jedem Signal erst orientieren, dann beschleunigen.' ELSE 'Clean routes and rules before speed; orient first after each signal, then accelerate.' END,
  CASE WHEN e.risk_level='medium' AND t.locale='de' THEN 'Nur freigegebene Stationen nutzen, Abstände konsequent einhalten und bei Griff-/OCR-Aufgaben immer nur die erlaubte Personenzahl starten lassen.'
       WHEN e.risk_level='medium' THEN 'Use approved stations only, maintain spacing and allow only the approved number of people onto grip/OCR tasks.'
       WHEN t.locale='de' THEN 'Keine Körperkontakte erzwingen, Laufwege trennen und bei rutschigem Boden, Schmerz oder Kontrollverlust sofort stoppen.'
       ELSE 'Do not force physical contact, keep routes separated and stop immediately for slippery footing, pain or loss of control.' END,
  CASE t.locale WHEN 'de' THEN 'Regeln werden verstanden, Abstände bleiben erhalten und Aufgaben werden technisch kontrolliert statt hektisch ausgeführt.' ELSE 'Rules are understood, spacing is maintained and tasks are performed with control rather than rushing.' END,
  CASE t.locale WHEN 'de' THEN 'Kurze Runde, große Zonen, Gehen oder leichtes Traben; Trainer gibt jede Entscheidung deutlich vor.' ELSE 'Short round, large zones, walking or easy jogging; coach gives each decision clearly.' END,
  CASE t.locale WHEN 'de' THEN '2–4 Runden mit klarer Rollenrotation und ausreichender Pause zwischen intensiveren Wegen.' ELSE '2–4 rounds with clear role rotation and sufficient recovery between harder efforts.' END,
  CASE t.locale WHEN 'de' THEN 'Zusätzliche Entscheidungssignale oder längere Wege nur bei stabiler Technik; keine zusätzliche Höhe oder riskante Kontakte.' ELSE 'Add decision signals or longer routes only with stable technique; do not add height or risky contact.' END,
  CASE t.locale WHEN 'de' THEN 'Runden 2–6 Minuten, danach 60–120 Sekunden sammeln, erklären und bei Bedarf vereinfachen.' ELSE 'Use 2–6 minute rounds followed by 60–120 seconds to regroup, explain and simplify if needed.' END,
  CASE t.locale WHEN 'de' THEN 'Regel vereinfachen, Wege verkürzen, Tempo auf Gehen/leichtes Traben begrenzen und größere Sicherheitsabstände nutzen.' ELSE 'Simplify the rule, shorten routes, limit pace to walking/easy jogging and increase safety spacing.' END,
  CASE t.locale WHEN 'de' THEN 'Standardregeln mit moderatem Tempo und vollständigem Rollenwechsel.' ELSE 'Use standard rules at moderate pace with full role rotation.' END,
  CASE t.locale WHEN 'de' THEN 'Nur eine kognitive oder konditionelle Schwierigkeit ergänzen, ohne Sicherheitsabstände oder Technik zu verschlechtern.' ELSE 'Add only one cognitive or conditioning challenge without reducing spacing or technique quality.' END,
  CASE t.locale WHEN 'de' THEN 'Für Kinder/Jugendliche ohne Ausscheiden, mit kurzen Runden, häufigem Rollenwechsel und Erfolg für alle gestalten.' ELSE 'For children/youth, avoid elimination and use short rounds, frequent role changes and success opportunities for everyone.' END,
  CASE t.locale WHEN 'de' THEN 'Stoppsignal und Spielfeldgrenzen verstehen; benötigte Grundbewegungen schmerzfrei ausführen können.' ELSE 'Understand the stop signal and play-area boundaries; be able to perform the required basic movements pain-free.' END,
  CASE t.locale WHEN 'de' THEN 'Gleiche Spielidee ohne Zeitdruck als Geh-/Markierungsaufgabe mit vereinfachter Regel durchführen.' ELSE 'Use the same game idea without time pressure as a walking/marker task with simplified rules.' END,
  e.difficulty,e.supervision,e.space_requirement,e.setup_seconds,e.transition_seconds,e.station_capacity
FROM exercises e
JOIN exercise_translations t ON t.exercise_id=e.id
WHERE e.exercise_type='game' AND e.seed_key LIKE 'game-%';

INSERT OR IGNORE INTO exercise_execution_steps (exercise_id,locale,step_order,instruction)
SELECT e.id,t.locale,s.step_order,
  CASE s.step_order
    WHEN 1 THEN CASE t.locale WHEN 'de' THEN 'Ziel, Spielfeld, Rollen und Stoppsignal kurz erklären; eine Proberunde ohne Zeitdruck durchführen.' ELSE 'Explain the goal, area, roles and stop signal; run one untimed practice round.' END
    WHEN 2 THEN t.instructions
    WHEN 3 THEN CASE t.locale WHEN 'de' THEN 'Während der Runde Abstände halten, Rollen fair wechseln und nur freigegebene Wege bzw. Stationen benutzen.' ELSE 'During the round maintain spacing, rotate roles fairly and use approved routes/stations only.' END
    ELSE CASE t.locale WHEN 'de' THEN 'Auf Stoppsignal vollständig anhalten, Ergebnis ohne Ausscheiden auswerten und für die nächste Runde sicher zurücksetzen.' ELSE 'Stop fully on the signal, review the result without elimination and reset safely for the next round.' END
  END
FROM exercises e JOIN exercise_translations t ON t.exercise_id=e.id
CROSS JOIN (VALUES (1),(2),(3),(4)) s(step_order)
WHERE e.exercise_type='game' AND e.seed_key LIKE 'game-%';

INSERT OR IGNORE INTO exercise_coaching_cues (exercise_id,locale,cue_order,cue)
SELECT e.id,l.locale,c.cue_order,CASE l.locale WHEN 'de' THEN c.de ELSE c.en END
FROM exercises e CROSS JOIN (VALUES ('de'),('en')) l(locale)
CROSS JOIN (VALUES
  (1,'Erst schauen, dann bewegen','Look first, then move'),
  (2,'Fair wechseln und Abstand halten','Rotate fairly and keep spacing'),
  (3,'Sauber vor schnell','Quality before speed')
) c(cue_order,de,en)
WHERE e.exercise_type='game' AND e.seed_key LIKE 'game-%';

INSERT OR IGNORE INTO exercise_common_mistakes (exercise_id,locale,mistake_order,mistake,correction)
SELECT e.id,l.locale,m.mistake_order,
  CASE l.locale WHEN 'de' THEN m.de ELSE m.en END,
  CASE l.locale WHEN 'de' THEN m.fix_de ELSE m.fix_en END
FROM exercises e CROSS JOIN (VALUES ('de'),('en')) l(locale)
CROSS JOIN (VALUES
  (1,'Das Spiel wird zum Sprint und Abstände gehen verloren.','Tempo reduzieren, Laufwege verbreitern und die Runde erst nach sicherer Neuordnung starten.','The game turns into a sprint and spacing is lost.','Reduce pace, widen routes and restart only after the area is safely reset.'),
  (2,'Einzelne Personen dominieren Rollen oder Entscheidungen.','Rollen nach jeder Runde verbindlich wechseln und Erfolg als Teamziel definieren.','Individual players dominate roles or decisions.','Rotate roles after every round and define success as a team outcome.')
) m(mistake_order,de,fix_de,en,fix_en)
WHERE e.exercise_type='game' AND e.seed_key LIKE 'game-%';

INSERT INTO exercise_source_references (
  exercise_id,provider,title,source_url,source_type,license_label,notes
)
SELECT
  e.id,
  'OCRCraft',
  'OCRCraft Eigeninhalt · Strukturreferenz VIBSS Spiele',
  CASE WHEN e.seed_key IN (
    'game-carry-collect','game-reaction-gates','game-partner-pace-match','game-ocr-task-grid'
  )
    THEN 'https://www.vibss.de/sportpraxis/stundenbeispiele-pfp/erwachsene'
    ELSE 'https://www.vibss.de/sportpraxis/stundenbeispiele-pfp/kinder-und-jugendliche'
  END,
  'trainer_authored',
  'OCRCraft Eigeninhalt',
  'Ausschließlich Taxonomie-/Formatreferenz; keine externen Spieltexte, Regeln oder Bilder übernommen.'
FROM exercises e
WHERE e.exercise_type='game' AND e.seed_key LIKE 'game-%'
  AND NOT EXISTS (
    SELECT 1 FROM exercise_source_references sr
    WHERE sr.exercise_id=e.id
      AND sr.provider='OCRCraft'
      AND sr.title='OCRCraft Eigeninhalt · Strukturreferenz VIBSS Spiele'
  );

UPDATE search_index_state SET status='dirty', last_error=NULL WHERE locale IN ('de','en');

INSERT OR IGNORE INTO schema_migrations (version,name)
VALUES (60,'game_catalog');

COMMIT;
