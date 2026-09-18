ALTER TABLE exercise_media_assets ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS exercise_media_assets_primary_idx ON exercise_media_assets(exercise_id,is_primary);
INSERT INTO schema_migrations(version,name) VALUES (67,'exercise_media_primary');
