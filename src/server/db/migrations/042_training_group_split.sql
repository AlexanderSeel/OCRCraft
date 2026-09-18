BEGIN TRANSACTION;

ALTER TABLE training_sessions
  ADD COLUMN IF NOT EXISTS group_split_count INTEGER;

INSERT OR IGNORE INTO schema_migrations (version, name)
VALUES (42, 'training_group_split');

COMMIT;
