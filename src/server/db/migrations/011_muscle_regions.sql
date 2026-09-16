BEGIN TRANSACTION;

INSERT OR IGNORE INTO body_regions (id, label_de, label_en) VALUES
  ('traps', 'Trapezmuskel', 'Trapezius'),
  ('rear-delts', 'Hintere Schulter', 'Rear Deltoids'),
  ('biceps', 'Bizeps', 'Biceps'),
  ('triceps', 'Trizeps', 'Triceps'),
  ('abs', 'Bauchmuskulatur', 'Abdominals'),
  ('tibialis', 'Schienbein / Tibialis', 'Tibialis Anterior');

INSERT OR IGNORE INTO schema_migrations (version, name)
VALUES (11, 'muscle_regions');

COMMIT;
