BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS exercise_image_generation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid(),
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  action VARCHAR NOT NULL DEFAULT 'generate_ai_image'
    CHECK (action IN ('generate_ai_image')),
  status VARCHAR NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','running','succeeded','failed')),
  asset_id UUID REFERENCES exercise_media_assets(id),
  error_message VARCHAR,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE INDEX IF NOT EXISTS exercise_image_generation_jobs_status_idx
  ON exercise_image_generation_jobs(status, created_at);
CREATE INDEX IF NOT EXISTS exercise_image_generation_jobs_exercise_idx
  ON exercise_image_generation_jobs(exercise_id, status, created_at);

INSERT OR IGNORE INTO schema_migrations (version, name)
VALUES (46, 'exercise_image_generation_jobs');

COMMIT;
