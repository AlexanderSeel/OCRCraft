BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS training_saved_templates (
  id UUID PRIMARY KEY DEFAULT uuid(),
  name VARCHAR NOT NULL,
  description VARCHAR,
  source_training_session_id UUID REFERENCES training_sessions(id),
  snapshot_json VARCHAR NOT NULL,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE INDEX IF NOT EXISTS training_saved_templates_active_idx
  ON training_saved_templates(archived, created_at);

INSERT OR IGNORE INTO schema_migrations (version,name)
VALUES (61,'training_saved_templates');

COMMIT;
