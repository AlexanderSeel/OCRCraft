BEGIN TRANSACTION;

ALTER TABLE training_items ADD COLUMN IF NOT EXISTS programming_json VARCHAR;

INSERT OR IGNORE INTO schema_migrations (version, name)
VALUES (41, 'training_item_programming');

COMMIT;
