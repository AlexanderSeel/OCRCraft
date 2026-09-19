BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS app_auth_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  club_access_code VARCHAR,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

INSERT OR IGNORE INTO app_auth_settings (id, club_access_code)
VALUES (1, NULL);

INSERT OR IGNORE INTO schema_migrations (version, name)
VALUES (77, 'auth_bootstrap_settings');

COMMIT;
