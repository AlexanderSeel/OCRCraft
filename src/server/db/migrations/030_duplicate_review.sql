BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS exercise_duplicate_tasks (
  id UUID PRIMARY KEY DEFAULT uuid(),
  left_exercise_id UUID NOT NULL REFERENCES exercises(id),
  right_exercise_id UUID NOT NULL REFERENCES exercises(id),
  similarity_score DOUBLE NOT NULL,
  reasons VARCHAR NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'merged', 'ignored')),
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  resolved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exercise_duplicate_tasks_status
  ON exercise_duplicate_tasks(status, similarity_score DESC);

INSERT OR IGNORE INTO schema_migrations (version, name)
VALUES (30, 'duplicate_review');

COMMIT;
