BEGIN TRANSACTION;

ALTER TABLE club_groups ADD COLUMN default_location VARCHAR DEFAULT 'mixed';

CREATE TABLE IF NOT EXISTS club_group_equipment_defaults (
  group_id UUID NOT NULL REFERENCES club_groups(id),
  equipment_id UUID NOT NULL REFERENCES equipment(id),
  quantity_available INTEGER NOT NULL CHECK (quantity_available >= 0),
  PRIMARY KEY (group_id, equipment_id)
);

INSERT OR IGNORE INTO schema_migrations (version, name)
VALUES (24, 'group_training_defaults');

COMMIT;
