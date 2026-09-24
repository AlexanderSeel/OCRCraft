BEGIN TRANSACTION;

-- Keeps the portability decision explicit and reversible. Imported reference
-- exercises are never deleted; blocked records leave the active catalogue.
CREATE TABLE IF NOT EXISTS exercise_environment_reviews (
  exercise_id UUID PRIMARY KEY REFERENCES exercises(id),
  disposition VARCHAR NOT NULL CHECK (disposition IN ('portable', 'converted', 'blocked')),
  reason VARCHAR NOT NULL,
  replacement_equipment VARCHAR NOT NULL DEFAULT '',
  reviewed_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE TEMP TABLE portable_environment_candidates AS
SELECT
  e.id AS exercise_id,
  EXISTS (
    SELECT 1
    FROM exercise_equipment ee
    JOIN equipment eq ON eq.id=ee.equipment_id
    WHERE ee.exercise_id=e.id
      AND eq.seed_key IN (
        'external-assisted','external-barbell','external-cable','external-dumbbell',
        'external-ez-barbell','external-kettlebell','external-medicine-ball',
        'external-olympic-barbell','external-resistance-band','external-smith-machine',
        'external-trap-bar','external-weighted','external-bosu-ball',
        'external-stability-ball','external-wheel-roller','external-hammer'
      )
  ) AS has_convertible_equipment,
  EXISTS (
    SELECT 1
    FROM exercise_equipment ee
    JOIN equipment eq ON eq.id=ee.equipment_id
    WHERE ee.exercise_id=e.id
      AND eq.seed_key IN (
        'external-elliptical-machine','external-skierg-machine','external-stationary-bike',
        'external-stepmill-machine','external-upper-body-ergometer'
      )
  )
  OR EXISTS (
    SELECT 1
    FROM exercise_translations t
    WHERE t.exercise_id=e.id
      AND lower(t.name) ~ '(beinpresse|leg press|hack squat|pec deck|butterfly.*maschine|laufband|treadmill|stepmill|skierg|ergometer|elliptical|spinning bike)'
  ) AS is_blocked,
  e.archived AS was_archived
FROM exercises e
WHERE e.seed_key IS NULL;

-- Clearly studio-bound cardio and machine-only movements are removed from
-- active planning. The source record and all provenance remain available.
UPDATE exercises
SET archived=true, outdoor_suitable=false, updated_at=current_timestamp
WHERE id IN (
  SELECT exercise_id
  FROM portable_environment_candidates
  WHERE is_blocked
);

-- Replace imported load/machine labels with portable equipment already used by
-- the curated OCR catalogue. The source equipment rows remain untouched.
INSERT OR IGNORE INTO exercise_equipment (exercise_id,equipment_id,quantity_required)
SELECT ee.exercise_id, replacement.id, ee.quantity_required
FROM exercise_equipment ee
JOIN equipment source ON source.id=ee.equipment_id
JOIN equipment replacement ON replacement.seed_key = CASE source.seed_key
  WHEN 'external-assisted' THEN 'resistance-band'
  WHEN 'external-barbell' THEN 'sandbag'
  WHEN 'external-cable' THEN 'resistance-band'
  WHEN 'external-dumbbell' THEN 'kettlebell'
  WHEN 'external-ez-barbell' THEN 'resistance-band'
  WHEN 'external-kettlebell' THEN 'kettlebell'
  WHEN 'external-medicine-ball' THEN 'medicine-ball'
  WHEN 'external-olympic-barbell' THEN 'sandbag'
  WHEN 'external-resistance-band' THEN 'resistance-band'
  WHEN 'external-smith-machine' THEN 'resistance-band'
  WHEN 'external-trap-bar' THEN 'sandbag'
  WHEN 'external-weighted' THEN 'sandbag'
  WHEN 'external-bosu-ball' THEN 'mat'
  WHEN 'external-stability-ball' THEN 'mat'
  WHEN 'external-wheel-roller' THEN 'mat'
  WHEN 'external-hammer' THEN 'kettlebell'
  ELSE NULL
END
WHERE source.seed_key IS NOT NULL
  AND source.seed_key LIKE 'external-%'
  AND source.seed_key NOT IN (
    'external-elliptical-machine','external-skierg-machine','external-stationary-bike',
    'external-stepmill-machine','external-upper-body-ergometer'
  );

DELETE FROM exercise_equipment
WHERE equipment_id IN (
  SELECT id FROM equipment WHERE seed_key IN (
    'external-assisted','external-barbell','external-cable','external-dumbbell',
    'external-ez-barbell','external-kettlebell','external-medicine-ball',
    'external-olympic-barbell','external-resistance-band','external-smith-machine',
    'external-trap-bar','external-weighted','external-bosu-ball',
    'external-stability-ball','external-wheel-roller','external-hammer'
  )
);

-- The curated assisted pull-up seed contained a studio leverage-machine link.
-- Keep its pull-up bar and make the reviewed band assistance explicit.
DELETE FROM exercise_equipment
WHERE exercise_id IN (SELECT id FROM exercises WHERE seed_key='assisted-pullup')
  AND equipment_id IN (SELECT id FROM equipment WHERE seed_key='external-leverage-machine');
INSERT OR IGNORE INTO exercise_equipment (exercise_id,equipment_id,quantity_required)
SELECT e.id,eq.id,1
FROM exercises e CROSS JOIN equipment eq
WHERE e.seed_key='assisted-pullup' AND eq.seed_key='resistance-band';

-- Outdoor planning consumes this table and therefore never falls back to the
-- original imported machine requirement.
INSERT OR REPLACE INTO exercise_outdoor_variant_equipment (exercise_id,equipment_id,quantity_required)
SELECT ee.exercise_id,ee.equipment_id,ee.quantity_required
FROM exercise_equipment ee
JOIN portable_environment_candidates c ON c.exercise_id=ee.exercise_id
JOIN exercises e ON e.id=ee.exercise_id
WHERE e.archived=false
  AND c.has_convertible_equipment;

UPDATE exercise_details d
SET outdoor_variant=CASE d.locale
  WHEN 'de' THEN 'Outdoor-Variante: Nutze Kettlebell, Sandbag, Widerstandsband, Matte oder Körpergewicht entsprechend der angezeigten Ausstattung. Bewegungsmuster, kontrollierten Bewegungsumfang und Sicherheitskriterien beibehalten.'
  ELSE 'Outdoor variation: Use the displayed kettlebell, sandbag, resistance band, mat or bodyweight equipment. Keep the movement pattern, controlled range of motion and safety criteria.'
END
WHERE d.exercise_id IN (
  SELECT exercise_id FROM portable_environment_candidates
  WHERE has_convertible_equipment AND NOT is_blocked
)
  AND trim(COALESCE(d.outdoor_variant,''))='';

INSERT OR REPLACE INTO exercise_environment_reviews (exercise_id,disposition,reason,replacement_equipment)
SELECT
  c.exercise_id,
  CASE WHEN c.is_blocked THEN 'blocked'
       WHEN c.has_convertible_equipment THEN 'converted'
       ELSE 'portable' END,
  CASE WHEN c.is_blocked THEN 'Fitnessstudio- oder Cardiogerät ohne verlässliche Outdoor-/Hallen-Konvertierung.'
       WHEN c.has_convertible_equipment THEN 'Studio-/Lastgerät auf portables Outdoor- oder Hallen-Equipment umgeschrieben.'
       ELSE 'Kein studioexklusives Equipment erkannt.' END,
  COALESCE((
    SELECT string_agg(eq.seed_key, ', ' ORDER BY eq.seed_key)
    FROM exercise_outdoor_variant_equipment ove
    JOIN equipment eq ON eq.id=ove.equipment_id
    WHERE ove.exercise_id=c.exercise_id
  ), '')
FROM portable_environment_candidates c;

DROP TABLE portable_environment_candidates;

INSERT OR IGNORE INTO schema_migrations (version,name)
VALUES (84,'portable_training_catalog');

COMMIT;
