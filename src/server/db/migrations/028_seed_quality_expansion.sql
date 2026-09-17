BEGIN TRANSACTION;

-- Every initial exercise gets a second and third correction cue. These are
-- conservative trainer checks and remain editable in the exercise editor.
INSERT INTO exercise_common_mistakes (exercise_id,locale,mistake_order,mistake,correction)
SELECT e.id,l.locale,2,
  CASE l.locale WHEN 'de' THEN 'Belastung oder Tempo zu früh steigern.' ELSE 'Increasing load or pace too early.' END,
  CASE l.locale WHEN 'de' THEN 'Nur eine Schwierigkeit zugleich erhöhen und die saubere Technik bestätigen.' ELSE 'Increase one difficulty only and confirm clean technique first.' END
FROM exercises e CROSS JOIN (VALUES ('de'),('en')) l(locale)
WHERE e.seed_key IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM exercise_common_mistakes m WHERE m.exercise_id=e.id AND m.locale=l.locale AND m.mistake_order=2);

INSERT INTO exercise_common_mistakes (exercise_id,locale,mistake_order,mistake,correction)
SELECT e.id,l.locale,3,
  CASE l.locale WHEN 'de' THEN 'Startposition oder Sicherheitsbereich nicht prüfen.' ELSE 'Skipping the start position or safety-zone check.' END,
  CASE l.locale WHEN 'de' THEN 'Vor jedem Versuch Ausgangsposition, Gerät und freie Zone kurz kontrollieren.' ELSE 'Check the start position, equipment and clear zone before every attempt.' END
FROM exercises e CROSS JOIN (VALUES ('de'),('en')) l(locale)
WHERE e.seed_key IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM exercise_common_mistakes m WHERE m.exercise_id=e.id AND m.locale=l.locale AND m.mistake_order=3);

INSERT INTO schema_migrations (version,name) VALUES (28,'seed_quality_expansion');
COMMIT;
