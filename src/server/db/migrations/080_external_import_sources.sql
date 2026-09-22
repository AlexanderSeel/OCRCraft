BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS external_import_sources (
  provider VARCHAR PRIMARY KEY,
  base_url VARCHAR NOT NULL,
  encrypted_api_key VARCHAR,
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_import_at TIMESTAMP,
  last_import_result VARCHAR,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

INSERT OR IGNORE INTO external_import_sources (provider,base_url,enabled) VALUES
  ('exercisedb','https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com',true),
  ('hasaneyldrm','https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json',true);

INSERT INTO schema_migrations(version,name) VALUES (80,'external_import_sources');
COMMIT;
