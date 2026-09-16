BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name VARCHAR NOT NULL,
  applied_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT uuid(),
  canonical_name VARCHAR NOT NULL,
  risk_level VARCHAR NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  min_age INTEGER,
  indoor BOOLEAN NOT NULL DEFAULT true,
  outdoor BOOLEAN NOT NULL DEFAULT true,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE TABLE IF NOT EXISTS exercise_translations (
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  locale VARCHAR NOT NULL CHECK (locale IN ('de', 'en')),
  name VARCHAR NOT NULL,
  summary VARCHAR,
  instructions VARCHAR,
  coaching_cues VARCHAR,
  common_mistakes VARCHAR,
  PRIMARY KEY (exercise_id, locale)
);

CREATE TABLE IF NOT EXISTS body_regions (
  id VARCHAR PRIMARY KEY,
  label_de VARCHAR NOT NULL,
  label_en VARCHAR NOT NULL
);

CREATE TABLE IF NOT EXISTS exercise_body_regions (
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  body_region_id VARCHAR NOT NULL REFERENCES body_regions(id),
  emphasis VARCHAR NOT NULL DEFAULT 'primary' CHECK (emphasis IN ('primary', 'secondary')),
  PRIMARY KEY (exercise_id, body_region_id)
);

CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT uuid(),
  name_de VARCHAR NOT NULL,
  name_en VARCHAR,
  quantity_available INTEGER,
  archived BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS exercise_equipment (
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  equipment_id UUID NOT NULL REFERENCES equipment(id),
  quantity_required INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (exercise_id, equipment_id)
);

CREATE TABLE IF NOT EXISTS club_groups (
  id UUID PRIMARY KEY DEFAULT uuid(),
  name VARCHAR NOT NULL,
  audience VARCHAR NOT NULL CHECK (audience IN ('kids', 'youth', 'adults', 'mixed')),
  min_age INTEGER,
  max_age INTEGER,
  default_participant_count INTEGER NOT NULL DEFAULT 1,
  default_duration_minutes INTEGER,
  default_locale VARCHAR NOT NULL DEFAULT 'de' CHECK (default_locale IN ('de', 'en')),
  maximum_risk_level VARCHAR CHECK (maximum_risk_level IN ('low', 'medium', 'high')),
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID PRIMARY KEY DEFAULT uuid(),
  title VARCHAR NOT NULL,
  group_id UUID REFERENCES club_groups(id),
  status VARCHAR NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'completed', 'archived')),
  source VARCHAR NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'template', 'copied', 'combined', 'ai', 'imported')),
  total_duration_minutes INTEGER NOT NULL,
  locale VARCHAR NOT NULL DEFAULT 'de' CHECK (locale IN ('de', 'en')),
  notes VARCHAR,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE TABLE IF NOT EXISTS training_phases (
  id UUID PRIMARY KEY DEFAULT uuid(),
  training_session_id UUID NOT NULL REFERENCES training_sessions(id),
  kind VARCHAR NOT NULL CHECK (kind IN ('warmup', 'main', 'cooldown')),
  title VARCHAR NOT NULL,
  sort_order INTEGER NOT NULL,
  UNIQUE (training_session_id, kind)
);

CREATE TABLE IF NOT EXISTS training_items (
  id UUID PRIMARY KEY DEFAULT uuid(),
  training_phase_id UUID NOT NULL REFERENCES training_phases(id),
  exercise_id UUID REFERENCES exercises(id),
  title_override VARCHAR,
  format VARCHAR,
  duration_minutes INTEGER NOT NULL,
  instructions VARCHAR,
  level_label VARCHAR,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS search_documents_de (
  document_id VARCHAR PRIMARY KEY,
  entity_type VARCHAR NOT NULL,
  entity_id VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  aliases VARCHAR DEFAULT '',
  summary VARCHAR DEFAULT '',
  tags VARCHAR DEFAULT '',
  body_regions VARCHAR DEFAULT '',
  equipment VARCHAR DEFAULT '',
  instructions VARCHAR DEFAULT '',
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE TABLE IF NOT EXISTS search_documents_en (
  document_id VARCHAR PRIMARY KEY,
  entity_type VARCHAR NOT NULL,
  entity_id VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  aliases VARCHAR DEFAULT '',
  summary VARCHAR DEFAULT '',
  tags VARCHAR DEFAULT '',
  body_regions VARCHAR DEFAULT '',
  equipment VARCHAR DEFAULT '',
  instructions VARCHAR DEFAULT '',
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE TABLE IF NOT EXISTS search_index_state (
  locale VARCHAR PRIMARY KEY CHECK (locale IN ('de', 'en')),
  status VARCHAR NOT NULL DEFAULT 'dirty' CHECK (status IN ('healthy', 'dirty', 'rebuilding', 'failed')),
  last_rebuilt_at TIMESTAMP,
  last_error VARCHAR,
  indexed_document_count BIGINT NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO search_index_state (locale, status) VALUES ('de', 'dirty');
INSERT OR IGNORE INTO search_index_state (locale, status) VALUES ('en', 'dirty');

INSERT OR IGNORE INTO schema_migrations (version, name) VALUES (1, 'initial');

COMMIT;
