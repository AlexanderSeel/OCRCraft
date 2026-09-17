BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS ai_exercise_drafts (
  id UUID PRIMARY KEY DEFAULT uuid(),
  status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  provider_id VARCHAR NOT NULL,
  provider_model VARCHAR,
  request_text VARCHAR NOT NULL,
  proposal_json VARCHAR NOT NULL,
  name_de VARCHAR NOT NULL,
  name_en VARCHAR NOT NULL,
  category VARCHAR NOT NULL,
  phase VARCHAR NOT NULL,
  risk_level VARCHAR NOT NULL,
  min_age INTEGER,
  approved_exercise_id UUID REFERENCES exercises(id),
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  reviewed_at TIMESTAMP
);

INSERT OR IGNORE INTO schema_migrations (version, name)
VALUES (34, 'ai_exercise_drafts');

COMMIT;
