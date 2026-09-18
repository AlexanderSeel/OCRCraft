BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT uuid(),
  email VARCHAR NOT NULL UNIQUE,
  display_name VARCHAR NOT NULL,
  role VARCHAR NOT NULL DEFAULT 'trainer' CHECK (role IN ('trainer', 'admin', 'super_admin')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE INDEX IF NOT EXISTS app_users_active_role_idx ON app_users(active, role);

INSERT OR IGNORE INTO schema_migrations (version, name)
VALUES (47, 'identity_users');

COMMIT;
