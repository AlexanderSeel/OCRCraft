BEGIN TRANSACTION;

ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS trainer_qualification_level VARCHAR DEFAULT 'none';

UPDATE app_users
SET trainer_qualification_level='none'
WHERE trainer_qualification_level IS NULL
   OR trainer_qualification_level NOT IN ('none','assistant','trainer_c','trainer_b','trainer_a');

ALTER TABLE club_youth_safety_profiles
  ADD COLUMN IF NOT EXISTS minimum_trainer_qualification VARCHAR DEFAULT 'assistant';

UPDATE club_youth_safety_profiles
SET minimum_trainer_qualification='assistant'
WHERE minimum_trainer_qualification IS NULL
   OR minimum_trainer_qualification NOT IN ('none','assistant','trainer_c','trainer_b','trainer_a');

INSERT OR IGNORE INTO schema_migrations (version,name)
VALUES (68,'trainer_qualification');

COMMIT;
