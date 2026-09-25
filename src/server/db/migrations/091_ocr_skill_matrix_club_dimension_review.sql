BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS ocr_skills (
  id VARCHAR PRIMARY KEY,
  label_de VARCHAR NOT NULL,
  label_en VARCHAR NOT NULL
);

INSERT OR IGNORE INTO ocr_skills (id,label_de,label_en) VALUES
('locomotion-running','Laufen','Running'),
('locomotion-transition','Übergänge / Richtungswechsel','Transitions / Direction Changes'),
('locomotion-crawl','Crawlen','Crawling'),
('grip-hang','Griff / Hang','Grip / Hang'),
('traverse','Traverse / Hangeln','Traverse'),
('swing-rotation','Schwingen / Rotation','Swing / Rotation'),
('pull-support','Ziehen / Stützen','Pull / Support'),
('rope-climb','Seilklettern','Rope Climb'),
('wall-vault','Wand / Überstieg','Wall / Vault'),
('balance-precision','Balance / Präzision','Balance / Precision'),
('carry-load','Tragen / Last','Carry / Load'),
('drag-pull','Ziehen / Schleifen','Drag / Pull'),
('jump-land','Springen / Landen','Jump / Land'),
('throw-target','Werfen / Ziel','Throw / Target'),
('strength-conditioning','Kraft / Conditioning','Strength / Conditioning'),
('mobility-coordination','Mobilität / Koordination','Mobility / Coordination');

CREATE TABLE IF NOT EXISTS exercise_ocr_skills (
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  skill_id VARCHAR NOT NULL REFERENCES ocr_skills(id),
  emphasis VARCHAR NOT NULL CHECK (emphasis IN ('primary','secondary')),
  PRIMARY KEY (exercise_id,skill_id)
);

CREATE TABLE IF NOT EXISTS club_obstacle_review_state (
  exercise_id UUID PRIMARY KEY REFERENCES exercises(id),
  dimensions_status VARCHAR NOT NULL DEFAULT 'review'
    CHECK (dimensions_status IN ('unknown','review','approved','blocked')),
  dimensions_note VARCHAR NOT NULL DEFAULT '',
  reviewed_by UUID,
  reviewed_at TIMESTAMP
);

INSERT OR IGNORE INTO exercise_ocr_skills (exercise_id,skill_id,emphasis)
SELECT e.id,v.skill_id,v.emphasis
FROM exercises e
JOIN (VALUES
  ('club-irish-table','wall-vault','primary'),
  ('club-irish-table','pull-support','secondary'),
  ('club-irish-table','balance-precision','secondary'),
  ('club-weaver','traverse','primary'),
  ('club-weaver','grip-hang','secondary'),
  ('club-weaver','balance-precision','secondary'),
  ('club-rotating-rig-elements','swing-rotation','primary'),
  ('club-rotating-rig-elements','traverse','secondary'),
  ('club-rotating-rig-elements','grip-hang','secondary'),
  ('club-multirig-ring-traverse','traverse','primary'),
  ('club-multirig-ring-traverse','grip-hang','secondary'),
  ('club-multirig-ring-traverse','swing-rotation','secondary'),
  ('club-incline-wall-traverse','wall-vault','primary'),
  ('club-incline-wall-traverse','pull-support','secondary'),
  ('club-incline-wall-traverse','balance-precision','secondary'),
  ('club-tire-obstacle-transit','balance-precision','primary'),
  ('club-tire-obstacle-transit','locomotion-transition','secondary'),
  ('club-olympus','traverse','primary'),
  ('club-olympus','grip-hang','secondary'),
  ('club-olympus','swing-rotation','secondary'),
  ('club-escaladierwand','wall-vault','primary'),
  ('club-escaladierwand','pull-support','secondary'),
  ('club-inverse-wall','wall-vault','primary'),
  ('club-inverse-wall','pull-support','secondary'),
  ('club-balance-beam','balance-precision','primary'),
  ('club-slackline','balance-precision','primary'),
  ('club-anchor-chain-drag','drag-pull','primary'),
  ('club-anchor-chain-drag','strength-conditioning','secondary'),
  ('club-atlas-stone-carry','carry-load','primary'),
  ('club-atlas-stone-carry','strength-conditioning','secondary')
) AS v(seed_key,skill_id,emphasis) ON e.seed_key=v.seed_key;

INSERT OR IGNORE INTO club_obstacle_review_state (
  exercise_id,dimensions_status,dimensions_note
)
SELECT
  e.id,
  'review',
  'Lokale Höhe/Spannweite/Reichweite bleibt bis zur expliziten Vereinsmessung unbestätigt.'
FROM exercises e
WHERE e.seed_key LIKE 'club-%'
  AND e.exercise_type='obstacle';

INSERT OR IGNORE INTO schema_migrations (version,name)
VALUES (91,'ocr_skill_matrix_club_dimension_review');

COMMIT;
