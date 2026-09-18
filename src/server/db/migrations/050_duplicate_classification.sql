BEGIN TRANSACTION;

ALTER TABLE exercise_duplicate_tasks ADD COLUMN IF NOT EXISTS classification VARCHAR;
UPDATE exercise_duplicate_tasks SET classification='probable_duplicate' WHERE classification IS NULL;

INSERT OR IGNORE INTO schema_migrations (version, name)
VALUES (50, 'duplicate_classification');

COMMIT;
