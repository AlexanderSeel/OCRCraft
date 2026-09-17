BEGIN TRANSACTION;

ALTER TABLE training_sessions
  ADD COLUMN IF NOT EXISTS organization_mode VARCHAR DEFAULT 'solo';
ALTER TABLE training_sessions
  ADD COLUMN IF NOT EXISTS team_size INTEGER;

ALTER TABLE training_items
  ADD COLUMN IF NOT EXISTS main_part_index INTEGER;
ALTER TABLE training_items
  ADD COLUMN IF NOT EXISTS main_part_title VARCHAR;

-- Existing sessions had one implicit main part. Make that explicit without
-- changing warm-up/cooldown rows.
UPDATE training_items i
SET main_part_index=1,
    main_part_title='Hauptteil'
WHERE main_part_index IS NULL
  AND EXISTS (
    SELECT 1 FROM training_phases p
    WHERE p.id=i.training_phase_id AND p.kind='main'
  );

INSERT OR IGNORE INTO schema_migrations (version, name)
VALUES (37, 'training_main_parts_team_structure');

COMMIT;
