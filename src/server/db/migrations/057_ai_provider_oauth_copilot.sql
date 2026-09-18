BEGIN TRANSACTION;

CREATE TEMP TABLE ai_provider_assignments_backup AS
SELECT provider_instance_id,capability,priority,enabled,created_at,updated_at
FROM ai_provider_assignments;

CREATE TABLE ai_provider_instances_v3 (
  id UUID PRIMARY KEY,
  provider_kind VARCHAR NOT NULL
    CHECK (provider_kind IN ('openai','gemini','anthropic','copilot','openai-compatible')),
  protocol VARCHAR NOT NULL
    CHECK (protocol IN ('openai-compatible','anthropic','gemini','copilot')),
  display_name VARCHAR NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  base_url VARCHAR,
  text_model_id VARCHAR,
  image_model_id VARCHAR,
  auth_mode VARCHAR NOT NULL DEFAULT 'environment'
    CHECK (auth_mode IN ('environment','encrypted_key','oauth')),
  api_key_env VARCHAR,
  encrypted_api_key VARCHAR,
  encrypted_oauth_credential VARCHAR,
  oauth_expires_at TIMESTAMP,
  monthly_text_token_limit BIGINT,
  monthly_request_limit INTEGER,
  updated_by UUID REFERENCES app_users(id),
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  CHECK (monthly_text_token_limit IS NULL OR monthly_text_token_limit > 0),
  CHECK (monthly_request_limit IS NULL OR monthly_request_limit > 0)
);

INSERT INTO ai_provider_instances_v3 (
  id,provider_kind,protocol,display_name,enabled,base_url,text_model_id,image_model_id,
  auth_mode,api_key_env,encrypted_api_key,encrypted_oauth_credential,oauth_expires_at,
  monthly_text_token_limit,monthly_request_limit,updated_by,created_at,updated_at
)
SELECT
  id,
  provider_kind,
  CASE WHEN provider_kind='gemini' THEN 'gemini' ELSE protocol END,
  display_name,
  enabled,
  CASE
    WHEN provider_kind='gemini' THEN 'https://generativelanguage.googleapis.com/v1beta'
    ELSE base_url
  END,
  text_model_id,
  image_model_id,
  auth_mode,
  api_key_env,
  encrypted_api_key,
  NULL,
  NULL,
  monthly_text_token_limit,
  monthly_request_limit,
  updated_by,
  created_at,
  updated_at
FROM ai_provider_instances;

DROP TABLE ai_provider_assignments;
DROP TABLE ai_provider_instances;
ALTER TABLE ai_provider_instances_v3 RENAME TO ai_provider_instances;

CREATE TABLE ai_provider_assignments (
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

INSERT INTO ai_provider_assignments (
  provider_instance_id,capability,priority,enabled,created_at,updated_at
)
SELECT provider_instance_id,capability,priority,enabled,created_at,updated_at
FROM ai_provider_assignments_backup;

CREATE INDEX idx_ai_provider_assignments_route
  ON ai_provider_assignments(capability,enabled,priority);

INSERT OR IGNORE INTO schema_migrations (version,name)
VALUES (57,'ai_provider_oauth_copilot');

COMMIT;
