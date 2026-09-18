BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT uuid(),
  actor_type VARCHAR NOT NULL DEFAULT 'system',
  actor_id VARCHAR,
  action VARCHAR NOT NULL,
  entity_type VARCHAR NOT NULL,
  entity_id VARCHAR,
  metadata_json VARCHAR,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE INDEX IF NOT EXISTS audit_events_created_at_idx ON audit_events(created_at);

INSERT OR IGNORE INTO schema_migrations (version, name)
VALUES (45, 'audit_events');

COMMIT;
