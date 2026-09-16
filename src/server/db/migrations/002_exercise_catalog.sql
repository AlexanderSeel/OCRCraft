BEGIN TRANSACTION;

ALTER TABLE exercises ADD COLUMN IF NOT EXISTS seed_key VARCHAR;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS category VARCHAR;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS default_phase VARCHAR;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS default_duration_seconds INTEGER;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS seed_key VARCHAR;

UPDATE exercises SET category = 'general' WHERE category IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS exercises_seed_key_idx ON exercises(seed_key);
CREATE UNIQUE INDEX IF NOT EXISTS equipment_seed_key_idx ON equipment(seed_key);
CREATE INDEX IF NOT EXISTS exercises_category_idx ON exercises(category);
CREATE INDEX IF NOT EXISTS exercises_default_phase_idx ON exercises(default_phase);

CREATE TABLE IF NOT EXISTS exercise_aliases (
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  locale VARCHAR NOT NULL CHECK (locale IN ('de', 'en')),
  alias VARCHAR NOT NULL,
  PRIMARY KEY (exercise_id, locale, alias)
);

CREATE TABLE IF NOT EXISTS movement_patterns (
  id VARCHAR PRIMARY KEY,
  label_de VARCHAR NOT NULL,
  label_en VARCHAR NOT NULL
);

CREATE TABLE IF NOT EXISTS exercise_movement_patterns (
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  movement_pattern_id VARCHAR NOT NULL REFERENCES movement_patterns(id),
  PRIMARY KEY (exercise_id, movement_pattern_id)
);

CREATE TABLE IF NOT EXISTS tags (
  id VARCHAR PRIMARY KEY,
  label_de VARCHAR NOT NULL,
  label_en VARCHAR NOT NULL
);

CREATE TABLE IF NOT EXISTS exercise_tags (
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  tag_id VARCHAR NOT NULL REFERENCES tags(id),
  PRIMARY KEY (exercise_id, tag_id)
);

CREATE INDEX IF NOT EXISTS exercise_aliases_alias_idx ON exercise_aliases(alias);

INSERT OR IGNORE INTO schema_migrations (version, name)
VALUES (2, 'exercise_catalog');

COMMIT;
