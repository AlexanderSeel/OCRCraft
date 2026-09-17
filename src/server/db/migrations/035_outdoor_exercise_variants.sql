BEGIN TRANSACTION;

ALTER TABLE exercise_details
  ADD COLUMN IF NOT EXISTS outdoor_variant VARCHAR DEFAULT '';

CREATE TABLE IF NOT EXISTS exercise_outdoor_variant_equipment (
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  equipment_id UUID NOT NULL REFERENCES equipment(id),
  quantity_required INTEGER NOT NULL DEFAULT 1 CHECK (quantity_required >= 1),
  PRIMARY KEY (exercise_id, equipment_id)
);

INSERT OR IGNORE INTO schema_migrations (version, name)
VALUES (35, 'outdoor_exercise_variants');

COMMIT;
