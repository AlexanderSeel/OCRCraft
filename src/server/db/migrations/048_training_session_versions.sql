BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS training_session_versions (
  id UUID PRIMARY KEY DEFAULT uuid(),
  training_session_id UUID NOT NULL REFERENCES training_sessions(id),
  version_number INTEGER NOT NULL,
  snapshot_json VARCHAR NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  created_by UUID REFERENCES app_users(id),
  UNIQUE (training_session_id, version_number)
);

CREATE INDEX IF NOT EXISTS training_session_versions_session_idx
  ON training_session_versions(training_session_id, version_number DESC);

INSERT OR IGNORE INTO schema_migrations (version, name)
VALUES (48, 'training_session_versions');

COMMIT;
