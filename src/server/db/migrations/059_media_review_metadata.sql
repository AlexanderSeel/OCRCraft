BEGIN TRANSACTION;

ALTER TABLE exercise_media_assets ADD COLUMN IF NOT EXISTS biomechanics_review VARCHAR DEFAULT 'unreviewed';
ALTER TABLE exercise_media_assets ADD COLUMN IF NOT EXISTS text_match_review VARCHAR DEFAULT 'unreviewed';
ALTER TABLE exercise_media_assets ADD COLUMN IF NOT EXISTS review_notes VARCHAR;
ALTER TABLE exercise_media_assets ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE exercise_media_assets ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;

INSERT OR IGNORE INTO schema_migrations (version,name)
VALUES (59,'media_review_metadata');

COMMIT;
