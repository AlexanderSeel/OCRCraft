BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS ai_provider_instances (
  id UUID PRIMARY KEY DEFAULT uuid(),
  provider_kind VARCHAR NOT NULL
    CHECK (provider_kind IN ('openai','gemini','anthropic','openai-compatible')),
  protocol VARCHAR NOT NULL
    CHECK (protocol IN ('openai-compatible','anthropic')),
  display_name VARCHAR NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  base_url VARCHAR,
  text_model_id VARCHAR,
  image_model_id VARCHAR,
  auth_mode VARCHAR NOT NULL DEFAULT 'environment'
    CHECK (auth_mode IN ('environment','encrypted_key')),
  api_key_env VARCHAR,
  encrypted_api_key VARCHAR,
  monthly_text_token_limit BIGINT,
  monthly_request_limit INTEGER,
  updated_by UUID REFERENCES app_users(id),
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  CHECK (monthly_text_token_limit IS NULL OR monthly_text_token_limit > 0),
  CHECK (monthly_request_limit IS NULL OR monthly_request_limit > 0)
);

CREATE TABLE IF NOT EXISTS ai_provider_assignments (
  provider_instance_id UUID NOT NULL REFERENCES ai_provider_instances(id),
  capability VARCHAR NOT NULL
    CHECK (capability IN ('training','exercise_draft','image')),
  priority INTEGER NOT NULL DEFAULT 10
    CHECK (priority >= 1 AND priority <= 9999),
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY (provider_instance_id, capability)
);

CREATE INDEX IF NOT EXISTS idx_ai_provider_assignments_route
  ON ai_provider_assignments(capability,enabled,priority);

ALTER TABLE ai_provider_usage_events
  ADD COLUMN IF NOT EXISTS provider_instance_id UUID;

INSERT INTO ai_provider_instances (
  provider_kind,protocol,display_name,enabled,base_url,text_model_id,image_model_id,
  auth_mode,api_key_env,encrypted_api_key,monthly_text_token_limit,monthly_request_limit,
  updated_by,updated_at
)
SELECT
  s.provider_id,
  s.protocol,
  s.display_name,
  s.enabled,
  s.base_url,
  s.model_id,
  CASE WHEN s.provider_id='openai' THEN 'gpt-image-2' ELSE NULL END,
  s.auth_mode,
  s.api_key_env,
  s.encrypted_api_key,
  s.monthly_token_limit,
  s.monthly_request_limit,
  s.updated_by,
  s.updated_at
FROM ai_provider_settings s
WHERE NOT EXISTS (
  SELECT 1 FROM ai_provider_instances i
  WHERE i.provider_kind=s.provider_id
    AND i.display_name=s.display_name
);

INSERT OR IGNORE INTO ai_provider_assignments (
  provider_instance_id,capability,priority,enabled
)
SELECT i.id,'training',10,true
FROM ai_provider_instances i
JOIN ai_provider_settings s
  ON s.provider_id=i.provider_kind AND s.display_name=i.display_name
WHERE s.use_for_training=true;

INSERT OR IGNORE INTO ai_provider_assignments (
  provider_instance_id,capability,priority,enabled
)
SELECT i.id,'exercise_draft',10,true
FROM ai_provider_instances i
JOIN ai_provider_settings s
  ON s.provider_id=i.provider_kind AND s.display_name=i.display_name
WHERE s.use_for_exercise_drafts=true;

INSERT OR IGNORE INTO ai_provider_assignments (
  provider_instance_id,capability,priority,enabled
)
SELECT i.id,'image',10,true
FROM ai_provider_instances i
WHERE i.provider_kind='openai';

UPDATE ai_provider_usage_events u
SET provider_instance_id=(
  SELECT i.id
  FROM ai_provider_instances i
  WHERE i.provider_kind=u.provider_id
  ORDER BY i.created_at
  LIMIT 1
)
WHERE u.provider_instance_id IS NULL
  AND EXISTS (
    SELECT 1 FROM ai_provider_instances i
    WHERE i.provider_kind=u.provider_id
  );

INSERT OR IGNORE INTO schema_migrations (version,name)
VALUES (52,'ai_provider_instances');

COMMIT;
