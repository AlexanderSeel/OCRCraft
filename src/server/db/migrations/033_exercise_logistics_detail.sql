BEGIN TRANSACTION;

ALTER TABLE exercises ADD COLUMN IF NOT EXISTS max_simultaneous_participants INTEGER DEFAULT 1;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS surface_requirements VARCHAR DEFAULT 'Ebener, rutschfester Untergrund';
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS weather_terrain VARCHAR DEFAULT 'Keine besonderen Wetter- oder Geländeanforderungen';
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS obstacle_configuration VARCHAR DEFAULT '';

UPDATE exercises SET
  max_simultaneous_participants = CASE WHEN category='running' THEN 12 WHEN category IN ('ocr-skill','grip-rig','throw') THEN 1 ELSE COALESCE(station_capacity, 1) END,
  surface_requirements = CASE WHEN category='running' THEN 'Ebene, freie und gut erkennbare Laufstrecke' WHEN category IN ('ocr-skill','grip-rig','throw') THEN 'Rutschfester Untergrund und freie Sicherheitszone' ELSE 'Ebener, rutschfester Untergrund' END,
  weather_terrain = CASE WHEN category='running' THEN 'Bei Nässe, Eis, schlechter Sicht oder unsicherem Gelände anpassen oder abbrechen' WHEN category IN ('ocr-skill','grip-rig','throw') THEN 'Bei Nässe und starkem Wind Gerät und Sicherheitszone neu bewerten' ELSE 'Keine besonderen Wetter- oder Geländeanforderungen' END,
  obstacle_configuration = CASE WHEN category IN ('ocr-skill','grip-rig') THEN 'Gerät vor jeder Nutzung prüfen; Höhe, Abstand und Ausstieg festlegen' ELSE '' END
WHERE seed_key IS NOT NULL;

INSERT INTO schema_migrations (version,name) VALUES (33,'exercise_logistics_detail');
COMMIT;
