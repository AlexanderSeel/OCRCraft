BEGIN TRANSACTION;

-- Every seeded exercise must be findable in both UI languages, even when its
-- canonical DE and EN names happen to be identical.
INSERT OR IGNORE INTO exercise_aliases (exercise_id, locale, alias)
SELECT e.id, 'de', trim(de.name)
FROM exercises e
JOIN exercise_translations de ON de.exercise_id=e.id AND de.locale='de'
WHERE e.seed_key IS NOT NULL AND trim(de.name) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM exercise_aliases a
    WHERE a.exercise_id=e.id AND a.locale='de' AND lower(trim(a.alias))=lower(trim(de.name))
  );

INSERT OR IGNORE INTO exercise_aliases (exercise_id, locale, alias)
SELECT e.id, 'en', trim(en.name)
FROM exercises e
JOIN exercise_translations en ON en.exercise_id=e.id AND en.locale='en'
WHERE e.seed_key IS NOT NULL AND trim(en.name) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM exercise_aliases a
    WHERE a.exercise_id=e.id AND a.locale='en' AND lower(trim(a.alias))=lower(trim(en.name))
  );

UPDATE search_documents_de AS s SET aliases=COALESCE((
  SELECT string_agg(a.alias, ' ' ORDER BY a.alias)
  FROM exercise_aliases a WHERE a.exercise_id=s.entity_id::UUID AND a.locale='de'
),'') WHERE s.entity_type='exercise';
UPDATE search_documents_en AS s SET aliases=COALESCE((
  SELECT string_agg(a.alias, ' ' ORDER BY a.alias)
  FROM exercise_aliases a WHERE a.exercise_id=s.entity_id::UUID AND a.locale='en'
),'') WHERE s.entity_type='exercise';
UPDATE search_index_state SET status='dirty',last_error=NULL WHERE locale IN ('de','en');

INSERT INTO schema_migrations (version,name) VALUES (25,'seed_alias_completeness');
COMMIT;
