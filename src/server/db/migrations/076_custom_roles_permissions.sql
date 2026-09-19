BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS app_roles (
  id UUID PRIMARY KEY DEFAULT uuid(),
  role_key VARCHAR NOT NULL UNIQUE,
  name VARCHAR NOT NULL,
  description VARCHAR,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE TABLE IF NOT EXISTS app_role_permissions (
  role_id UUID NOT NULL REFERENCES app_roles(id),
  resource VARCHAR NOT NULL,
  access_level VARCHAR NOT NULL,
  PRIMARY KEY (role_id, resource, access_level),
  CHECK (resource IN ('training','exercises','groups','games','obstacles','media','reports','administration')),
  CHECK (access_level IN ('read','write','admin'))
);

CREATE TABLE IF NOT EXISTS app_user_roles (
  user_id UUID NOT NULL REFERENCES app_users(id),
  role_id UUID NOT NULL REFERENCES app_roles(id),
  assigned_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  assigned_by UUID REFERENCES app_users(id),
  PRIMARY KEY (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS app_user_roles_role_idx ON app_user_roles(role_id);
INSERT OR IGNORE INTO schema_migrations (version, name) VALUES (76, 'custom_roles_permissions');
COMMIT;
