CREATE TABLE IF NOT EXISTS app_task_queue (
  id UUID PRIMARY KEY DEFAULT uuid(),
  task_type VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','succeeded','failed','cancelled')),
  payload_json VARCHAR NOT NULL DEFAULT '{}',
  progress INTEGER NOT NULL DEFAULT 0,
  progress_message VARCHAR,
  error_message VARCHAR,
  requested_by UUID,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);
CREATE INDEX IF NOT EXISTS app_task_queue_status_idx ON app_task_queue(status, created_at);
INSERT INTO schema_migrations(version,name) VALUES (65,'app_task_queue');
