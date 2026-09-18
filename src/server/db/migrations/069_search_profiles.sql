BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS search_profiles (
  id UUID PRIMARY KEY DEFAULT uuid(),
  name VARCHAR NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  exact_weight INTEGER NOT NULL DEFAULT 100 CHECK (exact_weight BETWEEN 0 AND 500),
  prefix_weight INTEGER NOT NULL DEFAULT 75 CHECK (prefix_weight BETWEEN 0 AND 500),
  alias_weight INTEGER NOT NULL DEFAULT 50 CHECK (alias_weight BETWEEN 0 AND 500),
  summary_weight INTEGER NOT NULL DEFAULT 20 CHECK (summary_weight BETWEEN 0 AND 500),
  taxonomy_weight INTEGER NOT NULL DEFAULT 25 CHECK (taxonomy_weight BETWEEN 0 AND 500),
  body_regions_weight INTEGER NOT NULL DEFAULT 25 CHECK (body_regions_weight BETWEEN 0 AND 500),
  equipment_weight INTEGER NOT NULL DEFAULT 20 CHECK (equipment_weight BETWEEN 0 AND 500),
  instructions_weight INTEGER NOT NULL DEFAULT 10 CHECK (instructions_weight BETWEEN 0 AND 500),
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

-- Migration 66 already created a smaller search_profiles table. CREATE TABLE IF
-- NOT EXISTS does not evolve it, so add every later profile field explicitly.
ALTER TABLE search_profiles ADD COLUMN IF NOT EXISTS summary_weight INTEGER DEFAULT 20;
ALTER TABLE search_profiles ADD COLUMN IF NOT EXISTS taxonomy_weight INTEGER DEFAULT 25;
ALTER TABLE search_profiles ADD COLUMN IF NOT EXISTS body_regions_weight INTEGER DEFAULT 25;
ALTER TABLE search_profiles ADD COLUMN IF NOT EXISTS equipment_weight INTEGER DEFAULT 20;
ALTER TABLE search_profiles ADD COLUMN IF NOT EXISTS instructions_weight INTEGER DEFAULT 10;
ALTER TABLE search_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT current_timestamp;

INSERT INTO search_profiles (
  name,is_active,exact_weight,prefix_weight,alias_weight,summary_weight,
  taxonomy_weight,body_regions_weight,equipment_weight,instructions_weight
) VALUES
  ('Ausgewogen',false,100,75,50,20,25,25,20,10),
  ('Anatomie & Trainingsziel',false,100,70,45,15,35,60,10,10),
  ('Equipment & Aufbau',false,100,70,40,15,15,10,60,30)
ON CONFLICT(name) DO NOTHING;

INSERT INTO schema_migrations (version,name)
VALUES (69,'search_profiles');

COMMIT;
