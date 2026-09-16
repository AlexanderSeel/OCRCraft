BEGIN TRANSACTION;

-- Make each exercise discoverable when a trainer searches in the other UI language.
INSERT OR IGNORE INTO exercise_aliases (exercise_id, locale, alias)
SELECT e.id, 'de', en.name
FROM exercises e
JOIN exercise_translations de ON de.exercise_id=e.id AND de.locale='de'
JOIN exercise_translations en ON en.exercise_id=e.id AND en.locale='en'
WHERE e.seed_key IS NOT NULL
  AND lower(trim(de.name)) <> lower(trim(en.name));

INSERT OR IGNORE INTO exercise_aliases (exercise_id, locale, alias)
SELECT e.id, 'en', de.name
FROM exercises e
JOIN exercise_translations de ON de.exercise_id=e.id AND de.locale='de'
JOIN exercise_translations en ON en.exercise_id=e.id AND en.locale='en'
WHERE e.seed_key IS NOT NULL
  AND lower(trim(de.name)) <> lower(trim(en.name));

UPDATE search_documents_de AS s SET aliases=COALESCE((
  SELECT string_agg(a.alias, ' ' ORDER BY a.alias)
  FROM exercise_aliases a
  WHERE a.exercise_id=s.entity_id::UUID AND a.locale='de'
),'')
WHERE s.entity_type='exercise'
  AND EXISTS (SELECT 1 FROM exercises e WHERE e.id=s.entity_id::UUID AND e.seed_key IS NOT NULL);

UPDATE search_documents_en AS s SET aliases=COALESCE((
  SELECT string_agg(a.alias, ' ' ORDER BY a.alias)
  FROM exercise_aliases a
  WHERE a.exercise_id=s.entity_id::UUID AND a.locale='en'
),'')
WHERE s.entity_type='exercise'
  AND EXISTS (SELECT 1 FROM exercises e WHERE e.id=s.entity_id::UUID AND e.seed_key IS NOT NULL);

UPDATE search_index_state SET status='dirty',last_error=NULL WHERE locale IN ('de','en');

INSERT INTO schema_migrations (version,name) VALUES (14,'seed_cross_locale_aliases');
COMMIT;
