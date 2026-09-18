BEGIN TRANSACTION;

ALTER TABLE club_groups ADD COLUMN IF NOT EXISTS default_organization_mode VARCHAR DEFAULT 'solo';
ALTER TABLE club_groups ADD COLUMN IF NOT EXISTS default_team_size INTEGER;
ALTER TABLE club_groups ADD COLUMN IF NOT EXISTS default_group_split_count INTEGER;
ALTER TABLE club_groups ADD COLUMN IF NOT EXISTS default_station_group_size INTEGER;

INSERT OR IGNORE INTO schema_migrations (version,name)
VALUES (62,'group_organization_defaults');

COMMIT;
