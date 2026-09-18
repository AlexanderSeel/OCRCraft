BEGIN TRANSACTION;

ALTER TABLE club_groups
  ADD COLUMN IF NOT EXISTS rule_profile VARCHAR;

UPDATE club_groups
SET rule_profile='standard'
WHERE rule_profile IS NULL OR trim(rule_profile)='';

INSERT OR IGNORE INTO schema_migrations (version, name)
VALUES (44, 'group_club_rule_profile');

COMMIT;
