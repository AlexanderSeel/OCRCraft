BEGIN TRANSACTION;

ALTER TABLE exercise_duplicate_tasks ADD COLUMN IF NOT EXISTS resolution_decision VARCHAR;

INSERT OR IGNORE INTO schema_migrations (version, name)
VALUES (56, 'duplicate_resolution_decision');

COMMIT;
