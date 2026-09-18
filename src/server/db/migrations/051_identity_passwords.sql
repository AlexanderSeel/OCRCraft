BEGIN TRANSACTION;

ALTER TABLE app_users ADD COLUMN IF NOT EXISTS password_hash VARCHAR;

INSERT OR IGNORE INTO schema_migrations (version, name)
VALUES (51, 'identity_passwords');

COMMIT;
