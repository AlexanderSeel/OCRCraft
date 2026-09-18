BEGIN TRANSACTION;

ALTER TABLE app_users ADD COLUMN IF NOT EXISTS profile_image_data VARCHAR;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS profile_image_content_type VARCHAR;

INSERT OR IGNORE INTO schema_migrations (version, name)
VALUES (53, 'profile_images');

COMMIT;
