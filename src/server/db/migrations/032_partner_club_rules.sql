BEGIN TRANSACTION;

ALTER TABLE exercise_details ADD COLUMN IF NOT EXISTS partner_team_variant VARCHAR;
ALTER TABLE exercise_details ADD COLUMN IF NOT EXISTS contact_requirement VARCHAR DEFAULT 'none';
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS club_rule_key VARCHAR;

UPDATE exercise_details d
SET partner_team_variant = CASE WHEN d.locale='de'
  THEN 'Als Partner- oder Teamvariante nur mit klaren Rollen, Abstand und sicherem Abbruchsignal durchführen.'
  ELSE 'Use as a partner or team variation only with clear roles, spacing and a safe stop signal.' END,
    contact_requirement = 'optional'
WHERE d.partner_team_variant IS NULL
  AND EXISTS (SELECT 1 FROM exercise_tags t WHERE t.exercise_id=d.exercise_id AND t.tag_id IN ('team','games-teamwork'));

UPDATE exercise_details d
SET contact_requirement = CASE
  WHEN EXISTS (SELECT 1 FROM exercise_tags t WHERE t.exercise_id=d.exercise_id AND t.tag_id IN ('team','games-teamwork')) THEN 'optional'
  ELSE 'none' END
WHERE d.contact_requirement IS NULL;

INSERT OR IGNORE INTO schema_migrations (version,name) VALUES (32,'partner_club_rules');
COMMIT;
