BEGIN TRANSACTION;

ALTER TABLE exercise_media_assets
  ADD COLUMN IF NOT EXISTS illustration_format VARCHAR DEFAULT 'legacy_triptych';
ALTER TABLE exercise_media_assets
  ADD COLUMN IF NOT EXISTS figure_presentation VARCHAR;
ALTER TABLE exercise_media_assets
  ADD COLUMN IF NOT EXISTS sequence_step_count INTEGER;

INSERT INTO schema_migrations (version,name) VALUES (16,'exercise_image_sequences');
COMMIT;
