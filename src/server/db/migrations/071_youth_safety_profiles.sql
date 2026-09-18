BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS club_youth_safety_profiles (
  id UUID PRIMARY KEY DEFAULT uuid(),
  name VARCHAR NOT NULL,
  audience VARCHAR NOT NULL CHECK (audience IN ('kids','youth')),
  min_age INTEGER NOT NULL,
  max_age INTEGER NOT NULL,
  maximum_risk_level VARCHAR NOT NULL CHECK (maximum_risk_level IN ('low','medium','high')),
  maximum_impact_level VARCHAR NOT NULL CHECK (maximum_impact_level IN ('low','moderate','high')),
  supervision_requirement VARCHAR NOT NULL CHECK (supervision_requirement IN ('normal','increased','direct')),
  notes VARCHAR,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE TABLE IF NOT EXISTS club_youth_safety_profile_restrictions (
  profile_id UUID NOT NULL REFERENCES club_youth_safety_profiles(id),
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  reason VARCHAR,
  PRIMARY KEY (profile_id,exercise_id)
);

ALTER TABLE club_groups ADD COLUMN IF NOT EXISTS youth_safety_profile_id UUID;

INSERT INTO club_youth_safety_profiles (
  name,audience,min_age,max_age,maximum_risk_level,maximum_impact_level,supervision_requirement,notes
)
SELECT
  'Kids 7–11 · Safety','kids',7,11,'medium','moderate','direct',
  'Konservatives OCRCraft-Startprofil. Vereinsregeln und lokale Risikobeurteilung bleiben maßgeblich.'
WHERE NOT EXISTS (
  SELECT 1 FROM club_youth_safety_profiles WHERE name='Kids 7–11 · Safety' AND audience='kids'
);

INSERT INTO club_youth_safety_profiles (
  name,audience,min_age,max_age,maximum_risk_level,maximum_impact_level,supervision_requirement,notes
)
SELECT
  'Youth 12–17 · Safety','youth',12,17,'medium','moderate','increased',
  'Konservatives OCRCraft-Startprofil. Vereinsregeln und lokale Risikobeurteilung bleiben maßgeblich.'
WHERE NOT EXISTS (
  SELECT 1 FROM club_youth_safety_profiles WHERE name='Youth 12–17 · Safety' AND audience='youth'
);

INSERT OR IGNORE INTO schema_migrations (version,name)
VALUES (71,'youth_safety_profiles');

COMMIT;
