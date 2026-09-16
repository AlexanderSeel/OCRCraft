BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS exercise_media_assets (
  id UUID PRIMARY KEY DEFAULT uuid(),
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  media_type VARCHAR NOT NULL CHECK (media_type IN ('image','video','illustration')),
  source_type VARCHAR NOT NULL CHECK (source_type IN ('ai_generated','club_created','external_reference')),
  provider VARCHAR,
  model VARCHAR,
  style_profile VARCHAR,
  generation_prompt VARCHAR,
  generated_at TIMESTAMP,
  review_status VARCHAR NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','approved','rejected')),
  generation_status VARCHAR NOT NULL DEFAULT 'generating' CHECK (generation_status IN ('generating','generated','failed')),
  storage_provider VARCHAR NOT NULL CHECK (storage_provider IN ('filesystem','s3')),
  storage_key VARCHAR,
  storage_uri VARCHAR,
  content_type VARCHAR,
  width INTEGER,
  height INTEGER,
  sha256 VARCHAR,
  error_message VARCHAR,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  CHECK (source_type <> 'ai_generated' OR (provider IS NOT NULL AND model IS NOT NULL AND style_profile IS NOT NULL AND generation_prompt IS NOT NULL)),
  CHECK (generation_status <> 'generated' OR (generated_at IS NOT NULL AND storage_key IS NOT NULL AND storage_uri IS NOT NULL AND content_type IS NOT NULL AND sha256 IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS exercise_media_assets_exercise_idx ON exercise_media_assets(exercise_id, created_at);
CREATE INDEX IF NOT EXISTS exercise_media_assets_review_idx ON exercise_media_assets(review_status, generation_status);

INSERT INTO schema_migrations (version,name) VALUES (10,'exercise_media_assets');
COMMIT;
