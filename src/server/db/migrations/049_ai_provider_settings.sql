BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS ai_provider_settings (
  provider_id VARCHAR PRIMARY KEY
    CHECK (provider_id IN ('openai','gemini','anthropic','openai-compatible')),
  protocol VARCHAR NOT NULL
    CHECK (protocol IN ('openai-compatible','anthropic')),
  display_name VARCHAR NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  use_for_training BOOLEAN NOT NULL DEFAULT false,
  use_for_exercise_drafts BOOLEAN NOT NULL DEFAULT false,
  base_url VARCHAR,
  model_id VARCHAR,
  auth_mode VARCHAR NOT NULL DEFAULT 'environment'
    CHECK (auth_mode IN ('environment','encrypted_key')),
  api_key_env VARCHAR,
  encrypted_api_key VARCHAR,
  monthly_token_limit BIGINT,
  monthly_request_limit INTEGER,
  updated_by UUID REFERENCES app_users(id),
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  CHECK (monthly_token_limit IS NULL OR monthly_token_limit > 0),
  CHECK (monthly_request_limit IS NULL OR monthly_request_limit > 0)
);

CREATE TABLE IF NOT EXISTS ai_provider_usage_events (
  id UUID PRIMARY KEY DEFAULT uuid(),
  provider_id VARCHAR NOT NULL,
  capability VARCHAR NOT NULL
    CHECK (capability IN ('training','exercise_draft','image')),
  model_id VARCHAR,
  input_tokens BIGINT NOT NULL DEFAULT 0,
  output_tokens BIGINT NOT NULL DEFAULT 0,
  total_tokens BIGINT NOT NULL DEFAULT 0,
  request_count INTEGER NOT NULL DEFAULT 1,
  image_count INTEGER NOT NULL DEFAULT 0,
  status VARCHAR NOT NULL DEFAULT 'succeeded'
    CHECK (status IN ('succeeded','failed')),
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE INDEX IF NOT EXISTS idx_ai_provider_usage_month
  ON ai_provider_usage_events(provider_id, created_at);

INSERT OR IGNORE INTO ai_provider_settings (
  provider_id,protocol,display_name,base_url,api_key_env
) VALUES
  ('openai','openai-compatible','OpenAI','https://api.openai.com/v1','OPENAI_API_KEY'),
  ('gemini','openai-compatible','Google Gemini','https://generativelanguage.googleapis.com/v1beta/openai','GEMINI_API_KEY'),
  ('anthropic','anthropic','Anthropic Claude','https://api.anthropic.com/v1','ANTHROPIC_API_KEY'),
  ('openai-compatible','openai-compatible','OpenAI-kompatibel',NULL,'OCRCRAFT_AI_API_KEY');

ALTER TABLE ai_exercise_drafts
  ADD COLUMN IF NOT EXISTS review_json VARCHAR;

INSERT OR IGNORE INTO schema_migrations (version,name)
VALUES (49,'ai_provider_settings');

COMMIT;
