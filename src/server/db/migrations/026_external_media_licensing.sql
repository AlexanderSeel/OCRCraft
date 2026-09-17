BEGIN TRANSACTION;

ALTER TABLE exercise_media_assets ADD COLUMN IF NOT EXISTS license_label VARCHAR;
ALTER TABLE exercise_media_assets ADD COLUMN IF NOT EXISTS source_reference VARCHAR;
ALTER TABLE exercise_media_assets ADD COLUMN IF NOT EXISTS usage_note VARCHAR;

INSERT INTO schema_migrations (version,name) VALUES (26,'external_media_licensing');
COMMIT;
