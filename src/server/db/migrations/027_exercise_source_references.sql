BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS exercise_source_references (
  id UUID PRIMARY KEY DEFAULT uuid(),
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  provider VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  source_url VARCHAR NOT NULL,
  retrieved_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  source_type VARCHAR NOT NULL CHECK (source_type IN ('dataset','reference','trainer_authored','ai_assisted')),
  license_label VARCHAR,
  notes VARCHAR,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE INDEX IF NOT EXISTS exercise_source_references_exercise_idx
  ON exercise_source_references(exercise_id, retrieved_at);

INSERT INTO schema_migrations (version,name) VALUES (27,'exercise_source_references');
COMMIT;
