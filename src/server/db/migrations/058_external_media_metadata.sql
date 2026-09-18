BEGIN TRANSACTION;

ALTER TABLE exercise_media_assets ADD COLUMN IF NOT EXISTS thumbnail_uri VARCHAR;
ALTER TABLE exercise_media_assets ADD COLUMN IF NOT EXISTS attribution_text VARCHAR;
ALTER TABLE exercise_media_assets ADD COLUMN IF NOT EXISTS rights_status VARCHAR DEFAULT 'unreviewed';
ALTER TABLE exercise_media_assets ADD COLUMN IF NOT EXISTS consent_required BOOLEAN DEFAULT false;
ALTER TABLE exercise_media_assets ADD COLUMN IF NOT EXISTS consent_confirmed BOOLEAN DEFAULT false;

INSERT OR IGNORE INTO schema_migrations (version,name)
VALUES (58,'external_media_metadata');

COMMIT;
