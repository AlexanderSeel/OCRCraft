BEGIN TRANSACTION;

ALTER TABLE app_users ADD COLUMN IF NOT EXISTS education VARCHAR;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS bio VARCHAR;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS specialties VARCHAR;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS profile_image_uri VARCHAR;
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS created_by UUID;

INSERT OR IGNORE INTO schema_migrations (version, name)
VALUES (52, 'profile_and_training_authorship');

COMMIT;
