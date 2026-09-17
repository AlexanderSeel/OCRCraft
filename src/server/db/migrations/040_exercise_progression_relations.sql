BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS exercise_progression_relations (
  id UUID PRIMARY KEY DEFAULT uuid(),
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  related_exercise_id UUID NOT NULL REFERENCES exercises(id),
  relation_type VARCHAR NOT NULL CHECK (relation_type IN ('regression','progression','alternative')),
  notes_de VARCHAR NOT NULL DEFAULT '',
  notes_en VARCHAR NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  UNIQUE (exercise_id, related_exercise_id, relation_type),
  CHECK (exercise_id <> related_exercise_id)
);

CREATE INDEX IF NOT EXISTS idx_exercise_progression_relations_exercise
  ON exercise_progression_relations(exercise_id, relation_type, sort_order);

INSERT OR IGNORE INTO schema_migrations (version, name)
VALUES (40, 'exercise_progression_relations');

COMMIT;
