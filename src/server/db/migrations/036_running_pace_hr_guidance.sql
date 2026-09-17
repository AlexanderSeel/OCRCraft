BEGIN TRANSACTION;

-- DuckDB cannot add NOT NULL/default constraints to an existing table. Add
-- nullable columns and backfill the values explicitly instead.
ALTER TABLE exercise_details ADD COLUMN IF NOT EXISTS pace_guidance VARCHAR;
ALTER TABLE exercise_details ADD COLUMN IF NOT EXISTS heart_rate_zone VARCHAR;

UPDATE exercise_details SET
  pace_guidance = COALESCE(pace_guidance, ''),
  heart_rate_zone = COALESCE(heart_rate_zone, '');

UPDATE exercise_details SET
  pace_guidance = CASE WHEN locale='de' THEN 'Technik: lockeres Sprechtempo; Intervalle: zügig, aber kontrolliert; keine Maximalgeschwindigkeit.' ELSE 'Technique: conversational pace; intervals: brisk but controlled; avoid maximal speed.' END,
  heart_rate_zone = CASE WHEN locale='de' THEN 'Orientierung: RPE 3–6/10; Herzfrequenzzonen nur als individuelle Zusatzinformation nutzen.' ELSE 'Guide: RPE 3–6/10; use heart-rate zones only as individual supplementary information.' END
WHERE exercise_id IN (SELECT id FROM exercises WHERE category='running' AND seed_key IS NOT NULL);

INSERT INTO schema_migrations (version,name) VALUES (36,'running_pace_hr_guidance');
COMMIT;
