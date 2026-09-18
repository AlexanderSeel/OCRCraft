CREATE TABLE IF NOT EXISTS search_profiles (
  id UUID PRIMARY KEY DEFAULT uuid(),
  name VARCHAR NOT NULL,
  exact_weight INTEGER NOT NULL DEFAULT 100,
  prefix_weight INTEGER NOT NULL DEFAULT 75,
  alias_weight INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  UNIQUE(name)
);
INSERT INTO search_profiles(name,exact_weight,prefix_weight,alias_weight,is_active) VALUES ('Standard',100,75,50,true) ON CONFLICT(name) DO NOTHING;
INSERT INTO schema_migrations(version,name) VALUES (66,'search_profiles');
