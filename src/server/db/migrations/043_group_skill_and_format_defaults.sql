BEGIN TRANSACTION;

ALTER TABLE club_groups
  ADD COLUMN IF NOT EXISTS skill_beginner_percent INTEGER;
ALTER TABLE club_groups
  ADD COLUMN IF NOT EXISTS skill_intermediate_percent INTEGER;
ALTER TABLE club_groups
  ADD COLUMN IF NOT EXISTS skill_advanced_percent INTEGER;

CREATE TABLE IF NOT EXISTS club_group_preferred_formats (
  group_id UUID NOT NULL REFERENCES club_groups(id),
  format VARCHAR NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (group_id, format)
);

INSERT OR IGNORE INTO schema_migrations (version, name)
VALUES (43, 'group_skill_and_format_defaults');

COMMIT;
