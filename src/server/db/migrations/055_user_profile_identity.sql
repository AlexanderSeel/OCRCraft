BEGIN TRANSACTION;

ALTER TABLE app_users ADD COLUMN IF NOT EXISTS first_name VARCHAR;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS last_name VARCHAR;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS username VARCHAR;

UPDATE app_users
SET first_name = COALESCE(NULLIF(first_name, ''), split_part(display_name, ' ', 1)),
    last_name = COALESCE(NULLIF(last_name, ''), NULLIF(regexp_extract(display_name, ' ([^ ]+)$', 1), '')),
    username = COALESCE(NULLIF(username, ''), lower(regexp_replace(split_part(email, '@', 1), '[^a-zA-Z0-9_]+', '_', 'g')))
WHERE first_name IS NULL OR last_name IS NULL OR username IS NULL;

INSERT OR IGNORE INTO schema_migrations (version, name)
VALUES (55, 'user_profile_identity');

COMMIT;
