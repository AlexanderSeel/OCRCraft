BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS training_generation_history (
  id UUID PRIMARY KEY DEFAULT uuid(),
  training_session_id UUID NOT NULL REFERENCES training_sessions(id),
  builder_mode VARCHAR NOT NULL CHECK (builder_mode IN ('local', 'ai')),
  provider_id VARCHAR,
  provider_model VARCHAR,
  request_json VARCHAR NOT NULL,
  trainer_reviewed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE INDEX IF NOT EXISTS idx_training_generation_history_session
  ON training_generation_history(training_session_id);

INSERT OR IGNORE INTO schema_migrations (version, name)
VALUES (28, 'training_generation_history');

COMMIT;
